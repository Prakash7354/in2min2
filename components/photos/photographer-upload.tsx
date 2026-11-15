"use client";

// The photographer's upload page (0009): many photos at once, with no
// account. Each is made ready on their phone or laptop like a guest's
// (lib/photo-prep.ts: 1600 px, location removed), kept safely until it has
// sent (lib/photo-queue.ts), and credited to them on the wall.

import { useCallback, useEffect, useRef, useState } from "react";
import { preparePhoto } from "@/lib/photo-prep";
import { queueDelete, queueList, queuePut, sendPhoto } from "@/lib/photo-queue";
import { PHOTO_MESSAGES, RETRY_REASONS } from "@/lib/photos";

const s = (k: string) => `ev-${k}`;
type Progress = { total: number; done: number; message: string | null; tone: "info" | "error" };

export function PhotographerUpload({ pgKey, name, limit, used, mine, wallHref }: {
  pgKey: string; name: string; limit: number | null; used: number; mine: number; wallHref: string;
}) {
  const wallId = `pg:${pgKey}`;
  const [count, setCount] = useState(mine);
  const [left, setLeft] = useState<number | null>(limit === null ? null : Math.max(0, limit - used));
  const [progress, setProgress] = useState<Progress | null>(null);
  const running = useRef(false);
  const retry = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Sends whatever is waiting, one photo at a time.
  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    if (retry.current) { window.clearTimeout(retry.current); retry.current = null; }
    try {
      for (;;) {
        const next = (await queueList(wallId))[0];
        if (!next) break;
        const r = await sendPhoto(next);
        if (r.ok) {
          await queueDelete(next.qid);
          setCount((c) => c + 1);
          setLeft((l) => (l === null ? null : Math.max(0, l - 1)));
          setProgress((p) => p && { ...p, done: p.done + 1 });
          continue;
        }
        if (RETRY_REASONS.has(r.reason)) {
          await queuePut({ ...next, tries: next.tries + 1 });
          const waiting = (await queueList(wallId)).length;
          setProgress((p) => ({ total: p?.total ?? waiting, done: p?.done ?? 0, tone: "info",
            message: r.reason === "network"
              ? `No signal just now. ${waiting} ${waiting === 1 ? "photo is" : "photos are"} saved here and will send by themselves.`
              : PHOTO_MESSAGES[r.reason] ?? "Trying again in a minute." }));
          retry.current = window.setTimeout(() => void pump(), Math.min(120_000, 15_000 * (next.tries + 1)));
          return;
        }
        for (const rest of await queueList(wallId)) await queueDelete(rest.qid);
        setProgress((p) => ({ total: p?.total ?? 0, done: p?.done ?? 0, tone: "error", message: PHOTO_MESSAGES[r.reason] ?? "A photo couldn't be added." }));
        return;
      }
      setProgress((p) => (p && p.total ? { ...p, tone: "info", message: `All done: ${p.done} ${p.done === 1 ? "photo" : "photos"} added. Thank you!` } : p));
    } finally {
      running.current = false;
    }
  }, [wallId]);

  useEffect(() => {
    const first = window.setTimeout(() => void pump(), 0);
    const online = () => void pump();
    window.addEventListener("online", online);
    return () => { window.clearTimeout(first); window.removeEventListener("online", online); if (retry.current) window.clearTimeout(retry.current); };
  }, [pump]);

  async function add(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setProgress({ total: list.length, done: 0, message: null, tone: "info" });
    let unreadable = 0;
    for (const f of list) {
      try {
        const p = await preparePhoto(f);
        await queuePut({
          qid: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, wall: wallId, type: "", slug: "", token: null,
          device: "", name: "", pg: pgKey, ...p, added: Date.now(), tries: 0,
        });
        void pump();
      } catch {
        unreadable++;
      }
    }
    if (input.current) input.current.value = "";
    if (unreadable) setProgress((p) => p && { ...p, total: p.total - unreadable });
  }

  const busy = !!progress && progress.message === null;
  return (
    <div className={s("photoWall")}>
      <p className={s("body")}>
        Hello {name}. Add your photos here, as many as you like. They go straight on the guests&apos; photo wall with your name on
        each one, and a <strong>Book them</strong> card with your link.
      </p>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => void add(e.target.files)} />
      <div>
        <button type="button" className={`${s("btn")} ${s("btnAccent")} ${s("btnBig")}`} disabled={left === 0}
          onClick={() => input.current?.click()}>
          {busy ? `Sending ${Math.min(progress!.done + 1, progress!.total)} of ${progress!.total}…` : "Choose photos"}
        </button>
      </div>
      {busy && progress && progress.total > 0 && (
        <div className={s("progress")} role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}
          aria-label={`Sending ${Math.min(progress.done + 1, progress.total)} of ${progress.total}`}>
          <i style={{ width: `${Math.round(((progress.done + 0.4) / progress.total) * 100)}%` }} />
        </div>
      )}
      {progress?.message && <p className={progress.tone === "error" ? s("replyError") : s("photoNote")} role="status">{progress.message}</p>}
      <p className={s("muted")}>
        {count} of your photos {count === 1 ? "is" : "are"} on the wall.
        {left !== null && ` Room for ${left} more on this event.`}
        {" "}You can choose many at once. If the signal drops, they wait here and send by themselves.
      </p>
      <p><a href={wallHref} className={`${s("btn")} ${s("btnGhost")} ${s("btnSmall")}`}>See the photo wall</a></p>
    </div>
  );
}
