"use client";

// "The big days" phone (owner, 23 Nov 2026: "animated, starting from opening
// an invite and scrolling all the way down, not static"). While it's on
// screen it plays by itself: the envelope opens (no music), then the whole
// page scrolls gently to the bottom, rests, and starts again. A touch, a
// scroll or a key hands it to the visitor and it stops. Phones set to reduce
// motion get the page, still.

import { PhoneChrome } from "@/components/site/phone-chrome";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import EventView from "@/components/event/event-view";
import { Opening } from "@/components/event/opening";
import type { EventViewData } from "@/lib/event-view";

const SPEED = 60;     // pixels a second
const REST = 2600;    // a pause at the bottom, in ms
const QUERY = "(prefers-reduced-motion: reduce)";
const reduced = (cb: () => void) => { const m = window.matchMedia(QUERY); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

export function AutoPlayPhone({ data, title, label, now }: { data: EventViewData; title: string; label: string; now: number }) {
  const screen = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState<"envelope" | "page">("envelope");
  const [visible, setVisible] = useState(false);
  const [mine, setMine] = useState(false);   // the visitor took over
  const still = useSyncExternalStore(reduced, () => window.matchMedia(QUERY).matches, () => false);

  // Play only while it's on screen.
  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The page scrolls itself to the bottom, rests, then the envelope comes back.
  useEffect(() => {
    if (stage !== "page" || !visible || mine || still) return;
    const el = screen.current;
    if (!el) return;
    let raf = 0;
    let rest: number | undefined;
    let last = performance.now();
    let pos = el.scrollTop;
    const step = (t: number) => {
      const max = el.scrollHeight - el.clientHeight;
      pos = Math.min(max, pos + ((t - last) / 1000) * SPEED);
      last = t;
      el.scrollTop = pos;
      if (pos >= max - 1) {
        rest = window.setTimeout(() => { el.scrollTop = 0; setStage("envelope"); setRound((r) => r + 1); }, REST);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(rest); };
  }, [stage, visible, mine, still]);

  const takeOver = () => { if (!mine) { setMine(true); setStage("page"); } };
  const envelope = stage === "envelope" && !still && !mine;
  return (
    <div className="s-phone">
      <div ref={screen} className="s-phonescreen s-autoplay" tabIndex={0} aria-label={label}
        onPointerDown={takeOver} onWheel={takeOver} onKeyDown={takeOver}>
        <EventView data={data} view="page" now={now} />
        {envelope && (
          <Opening key={round} data={{ ...data, envelope: true, music: null }} title={title} id={`autoplay-${round}`}
            embedded autoOpen={visible ? 1700 : undefined} onDone={() => setStage("page")} />
        )}
      </div>
      <PhoneChrome bg={data.palette.bg} battery={58} />
    </div>
  );
}
