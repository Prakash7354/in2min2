"use client";

// The photo wheel at the top of the gallery (owner's idea, 15 Nov 2026):
// guests' photos stand on a ring that turns slowly clockwise, like the cards
// in a phone-gallery advert. The photo at the front swells a little; the ones
// at the sides lean away. Every card is the same tall shape: a landscape
// photo sits whole inside its card on a soft blurred copy of itself, so
// guests never need to be told which way to hold the phone.
//
// - With more photos than places on the ring, each card takes the next photo
//   as it passes round the back, so every photo comes round in turn.
// - A new photo jumps in next, with a "New" badge and a small burst of
//   confetti in the event's colours (not for memorials).
// - Swipe to spin it; tap a photo to see it large.
// - Phones set to reduce motion, and hosts who switch movement off, get a
//   still wheel that can still be swiped.
// Moves by writing styles straight to the cards each frame (no React
// re-render), so it stays smooth on older phones.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { photoUrl, type WallPhoto } from "@/lib/photos";

const SLOTS = 10;
const STEP = (Math.PI * 2) / SLOTS;
const SECONDS_PER_PHOTO = 3.6;
const s = (k: string) => `ev-${k}`;

type Props = {
  eventId: string;
  photos: WallPhoto[];
  arrivals: { ids: string[]; n: number };   // new photos since the last look
  onOpen: (id: string) => void;
  motion: boolean;
  celebrate: boolean;
};

const fill = (list: WallPhoto[]) => Array.from({ length: SLOTS }, (_, i) => list[i % list.length]?.id ?? "");

export function PhotoWheel({ eventId, photos, arrivals, onOpen, motion, celebrate }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const shades = useRef<(HTMLSpanElement | null)[]>([]);
  const [slots, setSlots] = useState<string[]>(() => fill(photos));
  const [front, setFront] = useState(0);
  const [fresh, setFresh] = useState<string[]>([]);
  const [bursts, setBursts] = useState<number[]>([]);
  const list = useRef(photos);
  const st = useRef({
    angle: 0, vel: 0, last: 0, front: 0, pointer: SLOTS, queue: [] as string[], swapped: new Array<boolean>(SLOTS).fill(false),
    drag: null as null | { x: number; angle: number; lastX: number; lastT: number; moved: number },
  });

  useEffect(() => { list.current = photos; }, [photos]);

  // A card at the back takes the next photo: new ones first, then round the list.
  const swapAt = (i: number) => {
    const g = st.current;
    const all = list.current;
    const next = g.queue.shift() ?? (all.length > SLOTS ? all[g.pointer++ % all.length]?.id : undefined);
    if (next) setSlots((prev) => prev.map((id, j) => (j === i ? next : id)));
  };

  // New photos: straight into the hidden card that comes round next.
  useEffect(() => {
    if (!arrivals.ids.length) return;
    const g = st.current;
    let next = -1, best = Infinity;
    for (let i = 0; i < SLOTS; i++) {
      const th = (((g.angle + i * STEP) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (th > 1.85 && th < Math.PI && th < best) { best = th; next = i; }
    }
    const [first, ...rest] = arrivals.ids;
    g.queue.unshift(...rest);
    if (next >= 0) {
      g.swapped[next] = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a new photo just arrived from the server
      setSlots((prev) => prev.map((id, j) => (j === next ? first : id)));
    } else g.queue.unshift(first);
    setFresh((f) => [...arrivals.ids, ...f].slice(0, 12));
    if (celebrate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const k = arrivals.n;
      setBursts((b) => [...b, k]);
      window.setTimeout(() => setBursts((b) => b.filter((x) => x !== k)), 1800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per batch of arrivals
  }, [arrivals.n]);

  useEffect(() => {
    let raf = 0;
    const still = !motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = STEP / SECONDS_PER_PHOTO;
    const tick = (t: number) => {
      const g = st.current;
      const dt = g.last ? Math.min(0.05, (t - g.last) / 1000) : 0;
      g.last = t;
      if (!g.drag) {
        if (Math.abs(g.vel) > 0.02) { g.angle += g.vel * dt; g.vel *= Math.pow(0.05, dt); }
        else if (!still && document.visibilityState === "visible") g.angle -= speed * dt;   // clockwise, seen from above
      }
      const W = stage.current?.clientWidth ?? 360;
      const R = Math.min(W * 0.6, 420);
      let bestCos = -2, bestI = g.front;
      for (let i = 0; i < SLOTS; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const th = g.angle + i * STEP;
        const c = Math.cos(th);
        const pop = Math.pow(Math.max(0, c), 12) * 0.16;   // swells as it reaches the middle
        el.style.transform = `translate3d(${(Math.sin(th) * R).toFixed(1)}px,0,${((c - 1) * R).toFixed(1)}px) rotateY(${((th * 180) / Math.PI).toFixed(2)}deg) scale(${(1 + pop).toFixed(3)})`;
        el.style.zIndex = String(Math.round((c + 1) * 100));
        el.style.opacity = c < -0.3 ? "0" : Math.min(1, (c + 0.3) * 2.2).toFixed(2);
        const shade = shades.current[i];
        if (shade) shade.style.opacity = (0.5 * (1 - Math.max(0, c))).toFixed(2);
        if (c > bestCos) { bestCos = c; bestI = i; }
        if (c < -0.92 && !g.swapped[i]) { g.swapped[i] = true; swapAt(i); }
        if (c > 0) g.swapped[i] = false;
      }
      if (bestI !== g.front) { g.front = bestI; setFront(bestI); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [motion]);

  // Swipe to spin; a tap opens the photo.
  const down = (e: PointerEvent) => {
    const g = st.current;
    g.drag = { x: e.clientX, angle: g.angle, lastX: e.clientX, lastT: e.timeStamp, moved: 0 };
    g.vel = 0;
  };
  const move = (e: PointerEvent) => {
    const g = st.current;
    if (!g.drag) return;
    const W = stage.current?.clientWidth ?? 360;
    const R = Math.min(W * 0.6, 420);
    const dx = e.clientX - g.drag.x;
    g.drag.moved = Math.max(g.drag.moved, Math.abs(dx));
    if (g.drag.moved > 6) stage.current?.setPointerCapture?.(e.pointerId);
    g.angle = g.drag.angle + dx / R;
    const dt = Math.max(1, e.timeStamp - g.drag.lastT) / 1000;
    g.vel = (e.clientX - g.drag.lastX) / R / dt;
    g.drag.lastX = e.clientX;
    g.drag.lastT = e.timeStamp;
  };
  const up = (e: PointerEvent) => {
    const g = st.current;
    const d = g.drag;
    g.drag = null;
    if (d && d.moved <= 6) {
      const card = (e.target as HTMLElement).closest<HTMLElement>("[data-slot]");
      const id = card ? slots[Number(card.dataset.slot)] : slots[g.front];
      if (id) onOpen(id);
      g.vel = 0;
    }
  };

  const byId = new Map(photos.map((p) => [p.id, p]));
  const frontPhoto = byId.get(slots[front]);
  return (
    <div className={s("wheelWrap")} aria-hidden="true">
      <div ref={stage} className={s("wheel")} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { st.current.drag = null; }}>
        {slots.map((id, i) => {
          const p = byId.get(id);
          const wide = !!p && p.w > p.h * 1.1;
          const src = p ? photoUrl(eventId, p.id, "t") : "";
          return (
            <div key={i} data-slot={i} ref={(el) => { cards.current[i] = el; }} className={s("wheelCard")} data-wide={wide ? "" : undefined}>
              {src && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- R2 photo */}
                  {wide && <img src={src} alt="" className={s("wheelBlur")} draggable={false} />}
                  {/* eslint-disable-next-line @next/next/no-img-element -- R2 photo */}
                  <img src={src} alt="" className={s("wheelImg")} draggable={false} loading="lazy" decoding="async" />
                </>
              )}
              {p && fresh.includes(p.id) && <span className={s("wheelNew")}>New</span>}
              <span ref={(el) => { shades.current[i] = el; }} className={s("wheelShade")} />
            </div>
          );
        })}
        {bursts.map((k) => <Burst key={k} />)}
      </div>
      <p className={s("wheelCaption")}>{frontPhoto?.by ? `From ${frontPhoto.by}` : " "}</p>
    </div>
  );
}

// A small burst of confetti in the event's colours, from the middle of the wheel.
function Burst() {
  return (
    <div className={s("burst")}>
      {Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.2;
        const r = 38 + ((i * 37) % 30);
        return (
          <i key={i} style={{
            "--dx": `${(Math.cos(a) * r).toFixed(1)}cqi`, "--dy": `${(Math.sin(a) * r * 0.8 - 6).toFixed(1)}cqi`,
            "--rot": `${(i * 47) % 360}deg`, background: `var(--ev-c${(i % 6) + 1})`, animationDelay: `${(i % 5) * 0.03}s`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}
