// A gentle moving effect over the top of the page: snow, fireworks, marigold
// petals or confetti (0004, events.effect). Plain CSS animation, no library,
// drawn in code like the borders (CONCEPT 7d). It runs for about half a
// minute and then stops, so the page settles (7b: animation only where it
// counts). Never shown when Motion is off, on the builder's small copies, or
// to people who have asked their phone for less motion (event-view.css).
//
// Pure and deterministic: positions come from a fixed seed, so the server and
// the phone draw the same thing.

import type { CSSProperties } from "react";
import type { EffectKey } from "@/lib/catalog";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const r2 = (n: number) => Math.round(n * 100) / 100;

type Piece = { x: number; size: number; dur: number; delay: number; sway: number; spin: number; colour: number };

function pieces(seed: number, n: number, minDur: number, maxDur: number): Piece[] {
  const rand = rng(seed);
  return Array.from({ length: n }, () => ({
    x: r2(rand() * 100),
    size: r2(0.6 + rand() * 0.8),
    dur: r2(minDur + rand() * (maxDur - minDur)),
    delay: r2(-rand() * maxDur),           // already falling when the page opens
    sway: r2((rand() - 0.5) * 40),
    spin: Math.round(180 + rand() * 360) * (rand() > 0.5 ? 1 : -1),
    colour: Math.floor(rand() * 6),
  }));
}

const SNOW = pieces(11, 28, 8, 14);
const PETALS = pieces(29, 18, 7, 12);
const CONFETTI = pieces(53, 26, 5, 9);
const BURSTS = [
  { x: 18, y: 14, delay: 0 }, { x: 78, y: 10, delay: 0.9 }, { x: 52, y: 24, delay: 1.8 }, { x: 30, y: 34, delay: 2.6 }, { x: 84, y: 30, delay: 3.4 },
];

export default function Effect({ kind }: { kind: EffectKey }) {
  if (kind === "none") return null;
  if (kind === "fireworks") {
    return (
      <span className="ev-fx" data-fx="fireworks" aria-hidden="true">
        {BURSTS.map((b, i) => (
          <span key={i} className="ev-fxBurst" style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.delay}s`, "--c": `var(--ev-c${(i % 6) + 1})` } as CSSProperties}>
            {Array.from({ length: 12 }, (_, j) => (
              <span key={j} className="ev-fxSpark" style={{ transform: `rotate(${j * 30}deg)`, animationDelay: `${b.delay}s` }} />
            ))}
          </span>
        ))}
      </span>
    );
  }
  const list = kind === "snow" ? SNOW : kind === "petals" ? PETALS : CONFETTI;
  return (
    <span className="ev-fx" data-fx={kind} aria-hidden="true">
      {list.map((p, i) => (
        <span key={i} className="ev-fxLane"
          style={{ left: `${p.x}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, "--s": p.size, "--sway": `${p.sway}px`, "--spin": `${p.spin}deg`, "--c": `var(--ev-c${p.colour + 1})` } as CSSProperties}>
          <span className="ev-fxBit" style={{ animationDuration: `${r2(p.dur / 3)}s` }} />
        </span>
      ))}
    </span>
  );
}
