"use client";

// The festive launch on the home page (owner, 14 Nov 2026: "seasonal event
// design would be a lovely way to show off the free launch offer until 31
// January"). Three ready-made starting points; it hides itself after the offer.

import Link from "next/link";
import { useSyncExternalStore } from "react";

const ENDS = Date.parse("2027-02-01T00:00:00Z");
const TILES = [
  { type: "christmas", name: "Christmas party", line: "Snowflakes, red and green", bg: "linear-gradient(140deg, #A3172B, #6E0F1D)", fg: "#fff", icon: "❄" },
  { type: "new-year", name: "New Year’s Eve", line: "Midnight, gold and fireworks", bg: "linear-gradient(150deg, #0B0B1A, #4A2E7A)", fg: "#F2C14E", icon: "✦" },
  { type: "lhosar", name: "Lhosar", line: "Prayer flags and marigold petals", bg: "linear-gradient(90deg, #1F5FBF 0 20%, #F4F1E8 20% 40%, #C8102E 40% 60%, #1E8C45 60% 80%, #F2C230 80% 100%)", fg: "#161B29", icon: "☸" },
];

const subscribe = () => () => {};

export function FestiveLaunch() {
  // Shown while the offer runs (the server always draws it; the phone hides it after 31 January).
  const on = useSyncExternalStore(subscribe, () => Date.now() < ENDS, () => true);
  if (!on) return null;
  return (
    <section aria-labelledby="festive-title" className="grid gap-5 overflow-hidden rounded-3xl bg-brand p-5 text-white sm:p-8">
      <div className="grid gap-2">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-marigold">Festive launch</p>
        <h2 id="festive-title" className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          In2Min2 is free until 31 January 2027
        </h2>
        <p className="max-w-2xl text-lg text-white/85">
          Every switch, every design, no card needed. Start with a festive design and change anything.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {TILES.map((t) => (
          <li key={t.type}>
            <Link href={`/builder?type=${t.type}`} className="grid min-h-28 content-between gap-3 rounded-2xl bg-card p-2 text-ink ring-1 ring-white/20 transition hover:-translate-y-0.5">
              <span className="grid h-20 place-items-center rounded-xl text-4xl" style={{ background: t.bg, color: t.fg }} aria-hidden="true">{t.icon}</span>
              <span className="grid gap-0.5 px-2 pb-1">
                <span className="font-display text-lg font-extrabold">{t.name}</span>
                <span className="text-[15px] text-muted">{t.line}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
