"use client";

// The guests' photo wall on the event page and the photos page (0006).
// One big "Add your photos" button, no app and no account. Photos are made
// ready on the phone (lib/photo-prep.ts), wait safely on it until they've
// sent (lib/photo-queue.ts), then appear in the grid. Tap a photo to see it
// large; every photo has "Please remove this photo".
//
// Lives inside the event's own design (EventView's colours and fonts, the
// .ev-… styles). The large view opens over the whole screen.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { preparePhoto } from "@/lib/photo-prep";
import { queueDelete, queueList, queuePut, sendPhoto, type Queued } from "@/lib/photo-queue";
import { PhotoWheel } from "./photo-wheel";
import {
  PHOTO_MESSAGES, RETRY_REASONS, deviceId, loadWall, lovePhoto, photoUrl, publicRpc,
  type PublicWall, type WallPhoto,
} from "@/lib/photos";

const s = (k: string) => `ev-${k}`;

// motion: the host's "Gentle movement" (the wheel turns by itself, and new
// photos arrive with confetti). Off, the wheel stays still but can be swiped.
type Props = { type: string; slug: string; token: string | null; sensitive: boolean; live: boolean; motion?: boolean };
type Sending = { total: number; done: number; waitingForSignal: number; message: string | null; tone: "info" | "error" };

function ago(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function savedName(type: string, slug: string): string {
  try {
    const own = window.localStorage.getItem("in2min2.name");
    if (own !== null) return own;
    const reply = window.localStorage.getItem(`in2min2.reply.${type}/${slug}`);
    return reply ? String((JSON.parse(reply) as { name?: string }).name ?? "") : "";
  } catch { return ""; }
}

export function PhotoWall({ type, slug, token, sensitive, live, motion = true }: Props) {
  const wallId = `${type}/${slug}`;
  const [wall, setWall] = useState<PublicWall | null | "error">(null);
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [featured, setFeatured] = useState<WallPhoto[]>([]);   // favourites and most-loved (0008)
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [sending, setSending] = useState<Sending | null>(null);
  const [open, setOpen] = useState<{ from: "grid" | "wheel"; i: number } | null>(null);
  const [more, setMore] = useState(false);
  const device = useRef<string>("");
  const running = useRef(false);
  const retryTimer = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // Photos seen already, so the wheel can celebrate each new one.
  const known = useRef<Set<string> | null>(null);
  const [arrivals, setArrivals] = useState<{ ids: string[]; n: number }>({ ids: [], n: 0 });

  const refresh = useCallback(async () => {
    const w = await loadWall(type, slug, token, device.current).catch(() => null);
    if (!w) { setWall((old) => (old && old !== "error" ? old : "error")); return; }
    setWall(w);
    setFeatured(w.featured ?? []);
    const ids = (w.photos ?? []).map((p) => p.id);
    if (!known.current) known.current = new Set(ids);
    else {
      const added = ids.filter((id) => !known.current!.has(id));
      added.forEach((id) => known.current!.add(id));
      if (added.length) setArrivals((a) => ({ ids: added, n: a.n + 1 }));
    }
    setPhotos((old) => {
      const fresh = w.photos ?? [];
      const ids = new Set(fresh.map((p) => p.id));
      return [...fresh, ...old.filter((p) => !ids.has(p.id) && fresh.length > 0 && p.at < fresh[fresh.length - 1].at)];
    });
  }, [type, slug, token]);

  // Sends whatever is waiting on this phone, one photo at a time.
  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    if (retryTimer.current) { window.clearTimeout(retryTimer.current); retryTimer.current = null; }
    let shown = 0, waiting = 0, stopped: string | null = null, lastError: string | null = null;
    try {
      for (;;) {
        const next = (await queueList(wallId))[0];
        if (!next) break;
        const r = await sendPhoto(next);
        if (r.ok) {
          await queueDelete(next.qid);
          if (r.status === "shown") shown++; else waiting++;
          setSending((x) => x && { ...x, done: x.done + 1 });
          continue;
        }
        if (RETRY_REASONS.has(r.reason)) {
          await queuePut({ ...next, tries: next.tries + 1 });
          stopped = r.reason;
          const delay = Math.min(120_000, 15_000 * Math.max(1, next.tries + 1));
          retryTimer.current = window.setTimeout(() => void pump(), delay);
          break;
        }
        await queueDelete(next.qid);
        lastError = r.reason;
        if (r.reason === "your_share" || r.reason === "full" || r.reason === "closed" || r.reason === "off" || r.reason === "private") {
          for (const rest of await queueList(wallId)) await queueDelete(rest.qid);
          break;
        }
      }
    } finally {
      running.current = false;
    }
    const left = (await queueList(wallId)).length;
    const done = shown + waiting;
    const thanks = done === 0 ? null
      : waiting > 0 && shown === 0 ? `${done === 1 ? "Your photo was" : `${done} photos were`} sent. ${done === 1 ? "It" : "They"}'ll appear once the host has checked ${done === 1 ? "it" : "them"}.`
      : `${done === 1 ? "Your photo is" : `${done} photos are`} on the wall. Thank you!`;
    if (stopped) {
      setSending((x) => ({
        total: x?.total ?? left, done: x?.done ?? 0, waitingForSignal: left, tone: "info",
        message: stopped === "network"
          ? `No signal just now. ${left === 1 ? "Your photo is saved on this phone and will send by itself" : `${left} photos are saved on this phone and will send by themselves`} when the signal is back.`
          : PHOTO_MESSAGES[stopped] ?? "Trying again in a minute.",
      }));
    } else if (lastError) {
      setSending({ total: 0, done: 0, waitingForSignal: 0, tone: "error", message: [thanks, PHOTO_MESSAGES[lastError] ?? "A photo couldn't be added."].filter(Boolean).join(" ") });
    } else {
      setSending(done ? { total: 0, done: 0, waitingForSignal: 0, tone: "info", message: thanks } : null);
    }
    if (done) void refresh();
  }, [wallId, refresh]);

  // First look: this phone's id and name, the wall, and anything left to send.
  useEffect(() => {
    device.current = deviceId();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this phone's saved name once, after the first draw
    setName(savedName(type, slug));
    const first = window.setTimeout(() => { void refresh(); void pump(); }, 0);
    const online = () => void pump();
    window.addEventListener("online", online);
    return () => { window.clearTimeout(first); window.removeEventListener("online", online); if (retryTimer.current) window.clearTimeout(retryTimer.current); };
  }, [type, slug, refresh, pump]);

  // On the day, new photos appear by themselves.
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    return () => window.clearInterval(t);
  }, [live, refresh]);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    try { window.localStorage.setItem("in2min2.name", name.trim()); } catch { /* fine */ }
    const list = Array.from(files).slice(0, 30);
    setSending({ total: list.length, done: 0, waitingForSignal: 0, tone: "info", message: null });
    let unreadable = 0;
    for (const f of list) {
      try {
        const p = await preparePhoto(f);
        const item: Queued = {
          qid: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, wall: wallId, type, slug, token,
          device: device.current, name: name.trim(), ...p, added: Date.now(), tries: 0,
        };
        await queuePut(item);
      } catch {
        unreadable++;
      }
    }
    if (unreadable) setSending((x) => x && { ...x, total: x.total - unreadable });
    if (input.current) input.current.value = "";
    await pump();
    if (unreadable) setSending((x) => ({ total: 0, done: 0, waitingForSignal: 0, tone: "error",
      message: [x?.message, `${unreadable === 1 ? "One photo" : `${unreadable} photos`} couldn't be opened on this phone. Try a JPEG or a screenshot.`].filter(Boolean).join(" ") }));
  }

  async function loadMore() {
    const last = photos[photos.length - 1];
    if (!last) return;
    setMore(true);
    const w = await loadWall(type, slug, token, device.current, last.at).catch(() => null);
    setMore(false);
    if (w?.photos?.length) setPhotos((old) => [...old, ...w.photos!.filter((p) => !old.some((o) => o.id === p.id))]);
  }

  // Love a photo, or take it back: shown at once, then corrected by the
  // database's count (0008). One love per phone per photo.
  async function love(id: string) {
    const target = [...photos, ...featured].find((p) => p.id === id);
    if (!target) return;
    const on = !target.mine;
    const apply = (f: (p: WallPhoto) => WallPhoto) => {
      setPhotos((x) => x.map((p) => (p.id === id ? f(p) : p)));
      setFeatured((x) => x.map((p) => (p.id === id ? f(p) : p)));
    };
    apply((p) => ({ ...p, mine: on, loves: Math.max(0, (p.loves ?? 0) + (on ? 1 : -1)) }));
    const r = await lovePhoto(type, slug, token, id, device.current, on);
    if (r?.ok) apply((p) => ({ ...p, mine: on, loves: r.loves ?? p.loves }));
    else apply((p) => ({ ...p, mine: !on, loves: Math.max(0, (p.loves ?? 0) + (on ? -1 : 1)) }));
  }

  if (wall === null) return <p className={s("muted")}>Loading photos…</p>;
  if (wall === "error" || !wall.event || !wall.rules) return <p className={s("muted")}>Guests’ photos will appear here.</p>;
  if (!wall.rules.on) return <p className={s("muted")}>The host has switched off photos for this event.</p>;

  const ev = wall.event;
  const r = wall.rules;
  const visible = photos.filter((p) => !broken.has(p.id));
  // The wheel: the hosts' favourites and the most-loved first, then the rest, newest first.
  const featuredIds = new Set(featured.map((p) => p.id));
  const latest = new Map(visible.map((p) => [p.id, p]));
  const wheelPhotos = [...featured.filter((p) => !broken.has(p.id)).map((p) => latest.get(p.id) ?? p), ...visible.filter((p) => !featuredIds.has(p.id))];
  const viewList = open?.from === "wheel" ? wheelPhotos : visible;
  const mine = wall.mine;
  const shareLeft = wall.per_guest != null && mine ? Math.max(0, wall.per_guest - mine.added) : null;
  const busy = sending !== null && sending.message === null;

  return (
    <div className={s("photoWall")}>
      {wheelPhotos.length >= 3 && (
        <PhotoWheel eventId={ev.id} photos={wheelPhotos} stars={featured.map((p) => p.id)} arrivals={arrivals} motion={motion}
          celebrate={motion && !sensitive} onLove={(id) => void love(id)}
          onOpen={(id) => { const i = wheelPhotos.findIndex((p) => p.id === id); if (i >= 0) setOpen({ from: "wheel", i }); }} />
      )}
      {r.open ? (
        <div className={s("photoAdd")}>
          <label className={s("field")}>
            <span className={s("label")}>Your name <span className={s("optional")}>(shown with your photos, if you like)</span></span>
            <input className={s("input")} value={name} maxLength={60} autoComplete="name" onChange={(e) => setName(e.target.value)}
              placeholder="For example, Sita" />
          </label>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => void add(e.target.files)} />
          <button type="button" className={`${s("btn")} ${s("btnAccent")} ${s("btnBig")}`} disabled={busy || shareLeft === 0}
            onClick={() => input.current?.click()}>
            <CameraIcon /> {busy ? "Sending…" : sensitive ? "Share a photo or memory" : "Add your photos"}
          </button>
          {busy && sending && sending.total > 0 && (
            <div className={s("progress")} role="progressbar" aria-valuemin={0} aria-valuemax={sending.total} aria-valuenow={sending.done}
              aria-label={`Sending ${Math.min(sending.done + 1, sending.total)} of ${sending.total}`}>
              <i style={{ width: `${Math.round(((sending.done + 0.4) / sending.total) * 100)}%` }} />
            </div>
          )}
          {sending?.message && <p className={sending.tone === "error" ? s("replyError") : s("photoNote")} role="status">{sending.message}</p>}
          <p className={s("muted")}>
            No app needed. Choose photos from your phone, or take one now.
            {shareLeft !== null && (shareLeft === 0 ? " You've added all the photos one phone can." : ` You can add ${shareLeft} more.`)}
            {r.approve_first && " The host checks each photo before it shows."}
            {mine && mine.waiting > 0 && ` ${mine.waiting} of yours ${mine.waiting === 1 ? "is" : "are"} waiting for the host's OK.`}
          </p>
        </div>
      ) : (
        <p className={s("muted")}>From midnight on the day, guests can add their photos here.</p>
      )}

      {visible.length > 0 ? (
        <div className={s("photoGrid")}>
          {visible.map((p, i) => (
            <button key={p.id} type="button" className={s("photoTile")} onClick={() => setOpen({ from: "grid", i })}
              aria-label={`Open photo ${i + 1}${p.by ? ` by ${p.by}` : ""}${p.loves ? `, ${p.loves} loves` : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- R2 photos, already sized on the guest's phone */}
              <img src={photoUrl(ev.id, p.id, "t")} alt="" loading="lazy" decoding="async"
                onError={() => setBroken((b) => new Set(b).add(p.id))} />
              {(!!p.loves || p.fav) && <span className={s("tileLoves")} aria-hidden="true">{p.fav ? "★ " : ""}{p.loves ? `♥ ${p.loves}` : ""}</span>}
            </button>
          ))}
        </div>
      ) : (
        r.open && <p className={s("muted")}>{sensitive ? "Photos and memories shared by guests will appear here." : "Be the first to add a photo!"}</p>
      )}
      {visible.length > 0 && wall.shown !== undefined && photos.length < wall.shown && (
        <div><button type="button" className={`${s("btn")} ${s("btnGhost")} ${s("btnSmall")}`} onClick={() => void loadMore()} disabled={more}>
          {more ? "Loading…" : "Show more photos"}
        </button></div>
      )}

      {open !== null && viewList[open.i] && (
        <Viewer photos={viewList} index={open.i} eventId={ev.id} onIndex={(i) => setOpen({ from: open.from, i })} onClose={() => setOpen(null)}
          onLove={(id) => void love(id)}
          onRemoved={(id) => {
            setPhotos((x) => x.filter((p) => p.id !== id));
            setFeatured((x) => x.filter((p) => p.id !== id));
            setWall((w) => (w && w !== "error" ? { ...w, shown: Math.max(0, (w.shown ?? 1) - 1) } : w));
            setOpen(null);
          }}
          ask={(id, note) => publicRpc<{ ok: boolean; reason?: string }>("ask_photo_removal", { p_type: type, p_slug: slug, p_token: token, p_photo: id, p_note: note || null })} />
      )}
    </div>
  );
}

// ─────────────── the large view ───────────────

function Viewer({ photos, index, eventId, onIndex, onClose, onRemoved, onLove, ask }: {
  photos: WallPhoto[]; index: number; eventId: string; onIndex: (i: number) => void; onClose: () => void; onLove: (id: string) => void;
  onRemoved: (id: string) => void; ask: (id: string, note: string) => Promise<{ ok: boolean; reason?: string } | null>;
}) {
  const p = photos[index];
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const startX = useRef<number | null>(null);
  const go = useCallback((d: number) => { setAsking(false); setMsg(null); onIndex((index + d + photos.length) % photos.length); }, [index, photos.length, onIndex]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.documentElement.style.overflow = prev; };
  }, [go, onClose]);

  async function remove() {
    const r = await ask(p.id, note.trim());
    if (r?.ok) { onRemoved(p.id); return; }
    setMsg(r?.reason === "busy" ? "Lots of requests just now. Please tell the host directly." : "That didn't work. Please try again, or tell the host.");
  }

  const url = photoUrl(eventId, p.id, "p");
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Photo" className="fixed inset-0 z-[80] flex flex-col bg-black text-white"
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { if (startX.current === null) return; const dx = e.changedTouches[0].clientX - startX.current; startX.current = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); }}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-[15px]">
        <span className="tabular-nums text-white/75">{index + 1} of {photos.length}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- R2 photo */}
        <img src={url} alt={p.by ? `Photo by ${p.by}` : "A guest's photo"} className="max-h-full max-w-full object-contain" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 hover:bg-black/70">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/45 hover:bg-black/70">
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>
      <div className="grid gap-2 px-4 pb-4 pt-2 text-[15px]" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-white/80">{p.fav ? "★ Host’s pick · " : ""}{p.by ? `Added by ${p.by}` : "Added by a guest"} · {ago(p.at)}</p>
          <button type="button" onClick={() => onLove(p.id)} aria-pressed={!!p.mine}
            aria-label={`${p.mine ? "Take back your love for" : "Love"} this photo${p.loves ? `, ${p.loves} loves` : ""}`}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 font-extrabold ${p.mine ? "bg-[#e0245e] text-white" : "bg-white/10 text-white ring-1 ring-white/50"}`}>
            <span aria-hidden="true" className="text-xl leading-none">{p.mine ? "♥" : "♡"}</span>{p.loves ? p.loves : "Love"}
          </button>
        </div>
        {asking ? (
          <div className="grid gap-2 rounded-2xl bg-white/10 p-3">
            <p className="m-0 font-semibold">Ask the host to remove this photo? It comes down straight away while they look.</p>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Why? (if you like)"
              className="rounded-xl border-0 bg-white px-3 py-2.5 text-[16px] text-black" />
            {msg && <p className="m-0 text-amber-200">{msg}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void remove()} className="min-h-11 rounded-full bg-white px-4 font-bold text-black">Yes, remove it</button>
              <button type="button" onClick={() => setAsking(false)} className="min-h-11 rounded-full px-4 font-bold ring-1 ring-white/40">Keep it</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a href={url} download={`photo-${p.id.slice(0, 8)}.jpg`} className="font-semibold underline underline-offset-4">Save this photo</a>
            <button type="button" onClick={() => setAsking(true)} className="font-semibold text-white/80 underline underline-offset-4">Please remove this photo</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.6" />
    </svg>
  );
}
