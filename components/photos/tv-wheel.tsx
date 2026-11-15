"use client";

// The TV wheel (in2min2.com/{type}/{slug}/tv?style=wheel): the photo wheel
// filling a TV or projector, in the night sky, with the event's title and a
// QR code so more guests join in. Checks for new photos every 15 seconds;
// each new one arrives next with confetti. Love counts show on the cards.
// Keeps the screen awake. The hosts' favourites and the most-loved photos
// come round more often (0008).

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { QrCode } from "@/components/qr-code";
import type { Sky } from "@/lib/catalog";
import { publicRpc, type PublicWall, type WallPhoto } from "@/lib/photos";
import { PhotoWheel } from "./photo-wheel";

type Props = {
  type: string; slug: string; token: string | null; eventId: string; title: string;
  joinUrl: string; joinText: string; vars: CSSProperties; display: string; motion: boolean; celebrate: boolean; sky: Sky;
};

export function TvWheel({ type, slug, token, eventId, title, joinUrl, joinText, vars, display, motion, celebrate, sky }: Props) {
  const [photos, setPhotos] = useState<WallPhoto[]>([]);
  const [featured, setFeatured] = useState<WallPhoto[]>([]);
  const [arrivals, setArrivals] = useState<{ ids: string[]; n: number }>({ ids: [], n: 0 });
  const [full, setFull] = useState(false);
  const [idle, setIdle] = useState(false);
  const known = useRef<Set<string> | null>(null);

  const check = useCallback(async () => {
    const w = await publicRpc<PublicWall | null>("public_photos", { p_type: type, p_slug: slug, p_token: token, p_device: null, p_before: null, p_limit: 200 }).catch(() => null);
    if (!w?.photos) return;
    const ids = w.photos.map((p) => p.id);
    if (!known.current) known.current = new Set(ids);
    else {
      const added = ids.filter((id) => !known.current!.has(id));
      added.forEach((id) => known.current!.add(id));
      if (added.length) setArrivals((a) => ({ ids: added, n: a.n + 1 }));
    }
    setPhotos(w.photos);
    setFeatured(w.featured ?? []);
  }, [type, slug, token]);

  useEffect(() => {
    const first = window.setTimeout(() => void check(), 0);
    const poll = window.setInterval(() => void check(), 15_000);
    return () => { window.clearTimeout(first); window.clearInterval(poll); };
  }, [check]);

  // Keep the screen awake, and hide the pointer and button when nobody's touching.
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

  const featuredIds = new Set(featured.map((p) => p.id));
  const latest = new Map(photos.map((p) => [p.id, p]));
  const wheelPhotos = [...featured.map((p) => latest.get(p.id) ?? p), ...photos.filter((p) => !featuredIds.has(p.id))];

  return (
    <div className="ev-frame fixed inset-0" style={{ cursor: idle ? "none" : "auto" }}>
      <div className="ev-root h-full" style={vars} data-motion={motion ? "on" : "off"}>
        {wheelPhotos.length >= 3 ? (
          <PhotoWheel size="tv" eventId={eventId} photos={wheelPhotos} stars={featured.map((p) => p.id)} arrivals={arrivals}
            motion={motion} celebrate={celebrate} sky={sky} />
        ) : (
          <div className="ev-wheelWrap ev-sky grid h-dvh place-items-center text-center" data-size="tv" data-sky={sky}>
            <div className="grid max-w-[60vw] gap-[2vh]">
              <p className="m-0 text-[clamp(28px,4.5vw,80px)] font-bold leading-tight" style={{ fontFamily: display }}>
                {photos.length ? "More photos, please!" : "Be the first to add a photo"}
              </p>
              <p className="m-0 text-[clamp(16px,2vw,34px)] text-white/80">Scan the code with your phone’s camera. No app needed.</p>
            </div>
          </div>
        )}

        <p className="pointer-events-none absolute left-[3vw] top-[3vh] m-0 text-[clamp(22px,3.4vw,56px)] font-bold leading-tight text-white drop-shadow-lg"
          style={{ fontFamily: display }}>{title}</p>

        <div className="absolute bottom-[3vh] right-[2.5vw] grid w-[clamp(150px,15vw,260px)] justify-items-center gap-2 rounded-[1.4vw] p-[1vw] text-center shadow-2xl"
          style={{ background: "var(--ev-main)", color: "var(--ev-on-main)" }}>
          <div className="w-full rounded-[0.8vw] bg-white p-[0.4vw]"><QrCode text={joinUrl} className="block w-full" label="Scan to add your photos" /></div>
          <p className="m-0 text-[clamp(14px,1.5vw,26px)] font-extrabold leading-tight">Add your photos</p>
          <p className="m-0 text-[clamp(11px,0.95vw,17px)] leading-snug opacity-85">{joinText}</p>
        </div>

        {!full && (
          <button type="button" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => {})}
            className={`absolute right-[2vw] top-[2.5vh] min-h-12 rounded-full bg-white px-5 font-bold text-black shadow-lg transition-opacity ${idle ? "opacity-0" : "opacity-100"}`}>
            Full screen
          </button>
        )}
      </div>
    </div>
  );
}
