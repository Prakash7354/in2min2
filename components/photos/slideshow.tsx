"use client";

// The TV slideshow (in2min2.com/{type}/{slug}/tv). Open it on a laptop
// plugged into the venue's TV or projector, or on a smart TV's browser. It
// fills the screen, shows each photo for 8 seconds with a gentle fade, puts
// brand-new photos next ("New"), and keeps a QR code in the corner so more
// guests join in. It checks for new photos every 15 seconds and keeps the
// screen awake.

import { useCallback, useEffect, useRef, useState } from "react";
import { QrCode } from "@/components/qr-code";
import { fromLine, photoUrl, publicRpc, type PublicWall, type WallPhoto } from "@/lib/photos";

const SHOW_MS = 8000;
const CHECK_MS = 15000;

type Props = {
  type: string; slug: string; token: string | null; eventId: string;
  title: string; joinUrl: string; joinText: string; main: string; onMain: string; accent: string; display: string; motion: boolean;
};

export function Slideshow({ type, slug, token, eventId, title, joinUrl, joinText, main, onMain, accent, display, motion }: Props) {
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [current, setCurrent] = useState<{ p: WallPhoto; fresh: boolean; n: number } | null>(null);
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const known = useRef<Set<string>>(new Set());
  const priority = useRef<WallPhoto[]>([]);
  const cursor = useRef(0);
  const list = useRef<WallPhoto[]>([]);
  const counter = useRef(0);

  const check = useCallback(async () => {
    const w = await publicRpc<PublicWall | null>("public_photos", { p_type: type, p_slug: slug, p_token: token, p_device: null, p_before: null, p_limit: 200 }).catch(() => null);
    if (!w?.photos) { setProblem(w?.rules && !w.rules.on ? "Photos are switched off for this event." : null); return; }
    setProblem(null);
    const first = known.current.size === 0;
    for (const p of w.photos) {
      if (!known.current.has(p.id)) {
        known.current.add(p.id);
        if (!first) priority.current.push(p);
      }
    }
    list.current = w.photos;
    setPhotos(w.photos);
  }, [type, slug, token]);

  // Next photo: brand-new ones first, then round the whole wall.
  const advance = useCallback(() => {
    const fresh = priority.current.shift();
    const all = list.current;
    const p = fresh ?? (all.length ? all[cursor.current++ % all.length] : null);
    if (!p) { setCurrent(null); return; }
    const img = new Image();
    const show = () => { counter.current++; setCurrent({ p, fresh: !!fresh, n: counter.current }); };
    img.onload = show;
    img.onerror = () => { list.current = list.current.filter((x) => x.id !== p.id); };
    img.src = photoUrl(eventId, p.id, "p");
  }, [eventId]);

  useEffect(() => {
    const first = window.setTimeout(() => void check().then(advance), 0);
    const poll = window.setInterval(() => void check(), CHECK_MS);
    const turn = window.setInterval(advance, SHOW_MS);
    return () => { window.clearTimeout(first); window.clearInterval(poll); window.clearInterval(turn); };
  }, [check, advance]);

  // Keep the screen awake, and hide the pointer and buttons when nobody's touching.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const wake = () => { if (document.visibilityState === "visible") nav.wakeLock?.request("screen").then((l) => { lock = l; }).catch(() => {}); };
    wake();
    document.addEventListener("visibilitychange", wake);
    let t = window.setTimeout(() => setIdle(true), 4000);
    const stir = () => { setIdle(false); window.clearTimeout(t); t = window.setTimeout(() => setIdle(true), 4000); };
    window.addEventListener("pointermove", stir);
    const fs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fs);
    return () => {
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pointermove", stir);
      document.removeEventListener("fullscreenchange", fs);
      window.clearTimeout(t);
      void lock?.release().catch(() => {});
    };
  }, []);

  const empty = photos.length === 0;
  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white" style={{ cursor: idle ? "none" : "auto" }}>
      {current && (
        <div key={current.n} className="tv-slide absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 photo, blurred behind to fill the screen */}
          <img src={photoUrl(eventId, current.p.id, "t")} alt="" aria-hidden="true" className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 photo */}
          <img src={photoUrl(eventId, current.p.id, "p")} alt={current.p.by ? `Photo by ${current.p.by}` : "A guest's photo"}
            className={`absolute inset-0 size-full object-contain ${motion ? "tv-drift" : ""}`} />
          {(current.p.by || current.fresh) && (
            <div className="absolute bottom-[4vh] left-[3vw] flex items-center gap-3 rounded-full bg-black/55 px-[1.6vw] py-[0.8vh] text-[clamp(16px,2.2vw,34px)] font-semibold">
              {current.fresh && <span className="rounded-full px-3 py-0.5 text-[0.7em] font-extrabold uppercase tracking-wider" style={{ background: accent, color: "#1C1A3A" }}>New</span>}
              {current.p.by ? fromLine(current.p.by) : "Just added"}
            </div>
          )}
        </div>
      )}

      {/* The title along the top */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-[3vw] pb-[6vh] pt-[2.5vh]">
        <p className="m-0 text-[clamp(22px,3.4vw,56px)] font-bold leading-tight" style={{ fontFamily: display }}>{title}</p>
      </div>

      {/* How to join, bottom right */}
      <div className="ev-slideQr absolute bottom-[3vh] right-[2.5vw] grid w-[clamp(150px,16vw,280px)] justify-items-center gap-2 rounded-[1.4vw] p-[1vw] text-center shadow-2xl"
        style={{ background: main, color: onMain }}>
        <div className="w-full rounded-[0.8vw] bg-white p-[0.4vw]"><QrCode text={joinUrl} className="block w-full" label="Scan to add your photos" /></div>
        <p className="m-0 text-[clamp(14px,1.5vw,26px)] font-extrabold leading-tight">Add your photos</p>
        <p className="m-0 text-[clamp(11px,0.95vw,17px)] leading-snug opacity-85">{joinText}</p>
      </div>

      {empty && (
        <div className="absolute inset-0 grid place-items-center px-[8vw] text-center">
          <div className="grid max-w-[60vw] gap-[2vh]">
            <p className="m-0 text-[clamp(28px,4.5vw,80px)] font-bold leading-tight" style={{ fontFamily: display }}>Be the first to add a photo</p>
            <p className="m-0 text-[clamp(16px,2vw,34px)] text-white/80">Scan the code with your phone’s camera. No app needed.</p>
            {problem && <p className="m-0 text-[clamp(14px,1.4vw,24px)] text-amber-200">{problem}</p>}
          </div>
        </div>
      )}

      {!full && (
        <button type="button" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => {})}
          className={`absolute right-[2vw] top-[2.5vh] min-h-12 rounded-full bg-white px-5 font-bold text-black shadow-lg transition-opacity ${idle ? "opacity-0" : "opacity-100"}`}>
          Full screen
        </button>
      )}
    </div>
  );
}
