"use client";

// The top of the website (owner, 22 Nov 2026): a tablet with the host's
// Replies and a phone with the invitation, changing together through six
// events every few seconds. Each invitation is shrunk to fit the phone's
// screen whole. Still (no changing) when the phone asks for less motion;
// the dots below choose one by hand.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import EventView from "@/components/event/event-view";
import { FOOD_NEEDS } from "@/lib/catalog";
import type { Dash, HeroShow } from "@/lib/site-samples";

const EVERY = 5500;
const STATUS = { yes: "Coming", maybe: "Maybe", no: "Can’t come" } as const;

export function HeroDevices({ shows, now }: { shows: HeroShow[]; now: number }) {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setAt((i) => (i + 1) % shows.length), EVERY);
    return () => window.clearInterval(t);
  }, [held, shows.length]);
  const pos = (i: number) => (i === at ? "on" : i === (at - 1 + shows.length) % shows.length ? "gone" : "next");
  return (
    <div className="s-heroart">
      <div className="s-devices" aria-hidden="true">
        <div className="s-tablet">
          <div className="s-tabscreen">
            {shows.map((s, i) => <div key={s.key} className="s-slide" data-pos={pos(i)}><Dashboard d={s.dash} /></div>)}
          </div>
        </div>
        <div className="s-phone s-herophone">
          <div className="s-phonescreen s-phonefit">
            {shows.map((s, i) => (
              <div key={s.key} className="s-slide" data-pos={pos(i)} style={{ background: s.card.palette.bg }}>
                <Fit><EventView data={s.card} view="card" now={now} thumb /></Fit>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="s-devdots" role="group" aria-label="Examples">
        {shows.map((s, i) => (
          <button key={s.key} type="button" aria-label={`${s.label} example`} aria-pressed={i === at} data-on={i === at ? "" : undefined}
            onClick={() => { setAt(i); setHeld(true); }}>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Shrinks what's inside to fit the box whole (only ever smaller), centred.
function Fit({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const b = box.current, el = inner.current;
    if (!b || !el) return;
    const measure = () => setScale(Math.min(1, b.clientHeight / Math.max(1, el.offsetHeight)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(b); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="s-fit">
      <div ref={inner} className="s-fitin" style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}

function Dashboard({ d }: { d: Dash }) {
  const total = d.coming + d.maybe + d.cant + d.fourth[1];
  const pc = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="s-dash">
      <div className="s-dash-top">
        <span className="s-dash-app">Replies</span>
        <span className="s-dash-bell">🔔<i>{d.bell}</i></span>
      </div>
      <div>
        <p className="s-dash-ev">{d.title}</p>
        <p className="s-dash-when">{d.when}</p>
      </div>
      <div className="s-dash-stats">
        <span data-k="yes"><b>{d.coming}</b>Coming</span>
        <span data-k="maybe"><b>{d.maybe}</b>Maybe</span>
        <span data-k="no"><b>{d.cant}</b>Can’t come</span>
        <span data-k="wait"><b>{d.fourth[1]}</b>{d.fourth[0]}</span>
      </div>
      <div className="s-dash-bar">
        <i data-k="yes" style={{ width: pc(d.coming) }} /><i data-k="maybe" style={{ width: pc(d.maybe) }} />
        <i data-k="no" style={{ width: pc(d.cant) }} /><i data-k="wait" style={{ width: pc(d.fourth[1]) }} />
      </div>
      <div className="s-dash-food">
        {d.food.map(([k, n]) => {
          const f = FOOD_NEEDS.find((x) => x.key === k);
          return f ? <span key={k}>{f.icon} {f.label} <b>{n}</b></span> : null;
        })}
      </div>
      <div className="s-dash-list">
        {d.replies.map((r) => (
          <div key={r.name} className="s-dash-row">
            <p><b>{r.name}</b><span className="s-dash-pill" data-k={r.status}>{STATUS[r.status]}{r.size ? ` · ${r.size}` : ""}</span></p>
            <p className="s-dash-note">“{r.note}”</p>
            <p className="s-dash-ago">{r.ago}</p>
          </div>
        ))}
      </div>
      <div className="s-dash-btns"><span data-k="wa">Send a reminder</span><span>Copy the list</span></div>
    </div>
  );
}
