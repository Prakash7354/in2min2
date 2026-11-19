"use client";

// What guests get (owner, 19 Nov 2026: "that video-type guide speaks louder
// than written instructions"): the real envelope, full-screen, then the real
// event page underneath with the music, exactly as a guest gets it from the
// link. The welcome plays a sample wedding; the Ready screen plays the
// host's own event. Closing it stops the music.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import EventView from "@/components/event/event-view";
import { stopMusic } from "@/components/event/music";
import { Opening } from "@/components/event/opening";
import { Icon } from "@/components/icons";
import { applyType, newDraft, type Draft } from "@/lib/draft";
import type { EventViewData } from "@/lib/event-view";
import { suggestedWords } from "./kinds";

export function GuestDemo({ data, title, to, now, onClose, action }: {
  data: EventViewData; title: string; to?: string | null; now: number; onClose: () => void;
  action?: { label: string; run: () => void };
}) {
  // Without the envelope, guests go straight to the page.
  const [opened, setOpened] = useState(!data.envelope);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  // Once, while it's open: the page behind stays still, Escape closes, and
  // the music stops when it closes.
  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { stopMusic(); closeRef.current(); } };
    window.addEventListener("keydown", key);
    return () => { html.style.overflow = before; window.removeEventListener("keydown", key); stopMusic(); };
  }, []);
  const close = () => { stopMusic(); onClose(); };
  const root = typeof document !== "undefined" ? document.getElementById("b2") : null;
  if (!root) return null;
  return createPortal(
    <div className="b2-demo" role="dialog" aria-modal="true" aria-label="What your guests get">
      <div className="b2-demo-page"><EventView data={data} view="page" now={now} /></div>
      {opened && (
        <>
          <button type="button" className="b2-round b2-demo-x" onClick={close} aria-label="Close"><Icon name="close" className="" /></button>
          <div className="b2-demo-bar">
            <button type="button" className="b2-btn b2-secondary" onClick={close}>Close</button>
            {action && <button type="button" className="b2-btn b2-primary" onClick={() => { stopMusic(); action.run(); }}>{action.label}</button>}
          </div>
        </>
      )}
      {!opened && <Opening data={{ ...data, envelope: true }} title={title} to={to} id="demo" preview={() => setOpened(true)} />}
    </div>,
    root,
  );
}

// The welcome's sample: a wedding six weeks away, with the wedding tune.
export function sampleWedding(): Draft {
  const base = applyType(newDraft(), "wedding");
  const date = new Date(Date.now() + 42 * 864e5).toISOString().slice(0, 10);
  const d: Draft = {
    ...base, title: "Meenu & Jose", stars: { ...base.stars, names: "Meenu & Jose" }, date, startTime: "11:00",
    venueName: "The Grand Hall", envelope: true, music: "wedding_vows", wordsBy: "suggested",
  };
  return { ...d, copy: suggestedWords(d) };
}
