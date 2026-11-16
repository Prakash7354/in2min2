"use client";

// The TV wheel (in2min2.com/{type}/{slug}/tv?style=wheel): the photo wheel
// filling a TV or projector, in the night sky, with the event's title and a
// QR code so more guests join in. Checks for new photos every 15 seconds;
// each new one arrives next with confetti. Love counts show on the cards.
// Keeps the screen awake. The hosts' favourites and the most-loved photos
// come round more often (0008).
//
// Live comments (0011, owner 16 Nov 2026): guests' words in a frosted column
// on the right (the QR code at its foot), or a band moving along the bottom,
// as the host chooses (or ?comments=right|bottom|off on the link); emoji
// cheers float up the screen; a new announcement shows at the top for an
// hour. The wheel sits in the middle of the space that's left.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { QrCode } from "@/components/qr-code";
import type { Sky } from "@/lib/catalog";
import { CheerFloats, MegaphoneIcon, TvCheers } from "@/components/live/cheers";
import { useLive } from "@/lib/live";
import { publicRpc, type PublicWall, type WallPhoto } from "@/lib/photos";
import { PhotoWheel } from "./photo-wheel";

type Props = {
  type: string; slug: string; token: string | null; eventId: string; title: string;
  joinUrl: string; joinText: string; vars: CSSProperties; display: string; motion: boolean; celebrate: boolean; sky: Sky;
  comments?: "right" | "bottom" | "off" | null;
};

export function TvWheel({ type, slug, token, eventId, title, joinUrl, joinText, vars, display, motion, celebrate, sky, comments }: Props) {
  const lv = useLive(type, slug, token, 6_000);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(t); }, []);
  const mode = lv.rules?.on ? comments ?? lv.rules.tv : "off";
  const notice = lv.announcements.find((a) => now - new Date(a.at).getTime() < 60 * 60_000) ?? null;
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

  const qr = (
    <div className="ev-tvQr" style={{ background: "var(--ev-main)", color: "var(--ev-on-main)" }}>
      <div className="ev-tvQrCode"><QrCode text={joinUrl} className="block w-full" label="Scan to add your photos" /></div>
      <p className="ev-tvQrTitle">{mode === "off" ? "Add your photos" : "Add photos and comments"}</p>
      <p className="ev-tvQrLine">{joinText}</p>
    </div>
  );
  return (
    <div className="ev-frame fixed inset-0" style={{ cursor: idle ? "none" : "auto" }}>
      <div className="ev-root ev-tv" style={vars} data-motion={motion ? "on" : "off"} data-cheers={mode}>
        {wheelPhotos.length >= 3 ? (
          <PhotoWheel size="tv" eventId={eventId} photos={wheelPhotos} stars={featured.map((p) => p.id)} arrivals={arrivals}
            motion={motion} celebrate={celebrate} sky={sky} />
        ) : (
          <div className="ev-wheelWrap ev-sky ev-tvEmpty" data-size="tv" data-sky={sky}>
            <div className="grid max-w-[60vw] gap-[2vh] text-center">
              <p className="m-0 text-[clamp(28px,4.5vw,80px)] font-bold leading-tight" style={{ fontFamily: display }}>
                {photos.length ? "More photos, please!" : "Be the first to add a photo"}
              </p>
              <p className="m-0 text-[clamp(16px,2vw,34px)] opacity-80">Scan the code with your phone’s camera. No app needed.</p>
            </div>
          </div>
        )}
        <CheerFloats floats={lv.floats} />

        <p className="ev-tvTitle" style={{ fontFamily: display }}>{title}</p>
        {notice && (
          <div className="ev-tvNotice" data-kind={notice.kind} role="status">
            <span aria-hidden="true"><MegaphoneIcon /></span>{notice.body}
          </div>
        )}

        {mode === "right" ? (
          <div className="ev-tvSide"><TvCheers cheers={lv.cheers} mode="right" />{qr}</div>
        ) : (
          <>
            <div className="ev-tvCorner">{qr}</div>
            {mode === "bottom" && <TvCheers cheers={lv.cheers} mode="bottom" />}
          </>
        )}

        {!full && (
          <button type="button" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => {})}
            className={`ev-tvFull ${idle ? "opacity-0" : "opacity-100"}`}>
            Full screen
          </button>
        )}
      </div>
    </div>
  );
}
