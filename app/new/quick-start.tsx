"use client";

// Quick start: a ready invitation in about 6 screens, one thing per screen
// (Design 2.0 prototype; CONCEPT 7e). Big tiles and buttons, the main button
// always at the bottom within thumb reach, "Step 3 of 6" at the top, and
// springy movement between screens. Swipe through complete looks instead of
// choosing colours, borders and letters one by one.
//
// A prototype: answers stay on this phone, nothing is published.

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import EventView from "@/components/event/event-view";
import { Icon } from "@/components/icons";
import { eventType } from "@/lib/catalog";
import { toViewData } from "@/lib/draft";
import { formatDate } from "@/lib/event-view";
import { resizePhoto } from "@/lib/image";
import { EMPTY, FIRST_TYPES, MORE_TYPES, TYPE_ART, draftFrom, loadAnswers, looksFor, saturday, saveAnswers, type Answers } from "./model";
import { Pop, Sheet, TopBar, spring, useToast } from "./ui";

const STEPS = 6;
// Screens slide in from the side you're going towards.
const slide = {
  enter: (d: number) => ({ x: d * 56, opacity: 0 }),
  centre: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -56, opacity: 0 }),
};

export default function QuickStart() {
  const [a, setA] = useState<Answers>(() => loadAnswers());
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [now] = useState(() => Date.now());
  const [toast, say] = useToast();

  const update = (patch: Partial<Answers>) => setA((prev) => { const next = { ...prev, ...patch }; saveAnswers(next); return next; });
  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); window.scrollTo({ top: 0 }); };
  const t = eventType(a.type);

  const screens: Record<number, ReactNode> = {
    1: <WhatScreen a={a} onPick={(type) => { update({ type, look: null }); window.setTimeout(() => go(2), 220); }} />,
    2: <NamesScreen a={a} update={update} next={() => go(3)} />,
    3: <WhenScreen a={a} update={update} next={() => go(4)} />,
    4: <WhereScreen a={a} update={update} next={() => go(5)} />,
    5: <LookScreen a={a} now={now} onUse={(key) => { update({ look: key }); go(6); }} />,
    6: <PhotoScreen a={a} now={now} update={update} next={() => go(7)} say={say} />,
    7: <DoneScreen a={a} now={now} say={say} restart={() => { setA(EMPTY); saveAnswers(EMPTY); go(1); }} />,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="b2-shell">
        <TopBar step={step <= STEPS ? step : undefined} of={STEPS} onBack={step > 1 ? () => go(step - 1) : undefined} />
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.main key={step} custom={dir} variants={slide} initial="enter" animate="centre" exit="exit" transition={spring}>
            {screens[step]}
          </motion.main>
        </AnimatePresence>
        {step === 1 && a.type && (
          <BottomBar><button type="button" className="b2-btn b2-primary b2-block" onClick={() => go(2)}>Next: {t?.label ?? "your event"}</button></BottomBar>
        )}
        {toast}
      </div>
    </MotionConfig>
  );
}

function BottomBar({ children }: { children: ReactNode }) {
  return <div className="b2-bottom"><div>{children}</div></div>;
}

// ── 1. What are you celebrating? ──
function WhatScreen({ a, onPick }: { a: Answers; onPick: (type: string) => void }) {
  const [more, setMore] = useState(false);
  const keys = more ? [...FIRST_TYPES, ...MORE_TYPES] : FIRST_TYPES;
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">What are you celebrating?</h1>
      <p className="b2-lead">Tap one. Everything else is set up for you.</p>
      <div className="b2-choices">
        {keys.map((k) => {
          const t = eventType(k);
          const art = TYPE_ART[k];
          if (!t || !art) return null;
          return (
            <button key={k} type="button" className="b2-choice" aria-pressed={a.type === k} onClick={() => onPick(k)}>
              <span className="b2-art" style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }} aria-hidden="true">
                <Icon name={art.icon} className="" />
              </span>
              <span style={{ display: "grid", gap: 4 }}>
                <strong>{t.label}</strong>
                <span>{t.line}</span>
              </span>
            </button>
          );
        })}
      </div>
      {!more && <button type="button" className="b2-btn b2-secondary" onClick={() => setMore(true)}><Icon name="plus" className="" />More kinds of event</button>}
    </section>
  );
}

// ── 2. Whose day is it? ──
const EXAMPLES: Record<string, string> = {
  birthday: "Sita", wedding: "Meenu & Jose", engagement: "Asha & Raj", anniversary: "Ram & Sita", pasni: "Baby Aarav",
  memorial: "Grandma Kamala", christmas: "The Gurung family", "new-year": "Our New Year party", lhosar: "Riverside Lhosar 2027",
};
function NamesScreen({ a, update, next }: { a: Answers; update: (p: Partial<Answers>) => void; next: () => void }) {
  const t = eventType(a.type);
  const community = t?.scale === "community";
  const title = community ? "What’s the event called?" : t?.sensitive ? "Who are we remembering?" : "Whose day is it?";
  const submit = (e: FormEvent) => { e.preventDefault(); if (a.names.trim()) next(); };
  return (
    <form className="b2-screen" onSubmit={submit}>
      <h1 className="b2-h1">{title}</h1>
      <label className="b2-field">
        <span className="b2-label">{t?.starLabel ?? "Name"}</span>
        <input className="b2-input" value={a.names} maxLength={80} autoFocus enterKeyHint="next" autoComplete="off"
          placeholder={`e.g. ${EXAMPLES[a.type ?? ""] ?? "Sita"}`} onChange={(e) => update({ names: e.target.value })} />
      </label>
      <p className="b2-small">This goes on the invitation. You can change it any time.</p>
      <BottomBar>
        <button type="submit" className="b2-btn b2-primary b2-block" disabled={!a.names.trim()}>Next</button>
        <button type="button" className="b2-btn b2-quiet" onClick={next}>Skip for now</button>
      </BottomBar>
    </form>
  );
}

// ── 3. When is it? ──
function WhenScreen({ a, update, next }: { a: Answers; update: (p: Partial<Answers>) => void; next: () => void }) {
  const sat1 = saturday(0), sat2 = saturday(1);
  const times: [string, string][] = [["11:00", "11am"], ["14:00", "2pm"], ["18:00", "6pm"]];
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">When is it?</h1>
      <div className="b2-chips" role="group" aria-label="Quick dates">
        <button type="button" className="b2-chip" aria-pressed={a.date === sat1} onClick={() => update({ date: sat1 })}>This Saturday</button>
        <button type="button" className="b2-chip" aria-pressed={a.date === sat2} onClick={() => update({ date: sat2 })}>Next Saturday</button>
      </div>
      <label className="b2-field">
        <span className="b2-label">Or pick the date</span>
        <input className="b2-input" type="date" value={a.date} onChange={(e) => update({ date: e.target.value })} />
      </label>
      {a.date && <p className="b2-h3" aria-live="polite">{formatDate(a.date)}</p>}
      <div className="b2-chips" role="group" aria-label="Quick times">
        {times.map(([v, l]) => <button key={v} type="button" className="b2-chip" aria-pressed={a.time === v} onClick={() => update({ time: v })}>{l}</button>)}
      </div>
      <label className="b2-field">
        <span className="b2-label">Or the exact time it starts</span>
        <input className="b2-input" type="time" value={a.time} onChange={(e) => update({ time: e.target.value })} />
      </label>
      <BottomBar>
        <button type="button" className="b2-btn b2-primary b2-block" disabled={!a.date} onClick={next}>Next</button>
        <button type="button" className="b2-btn b2-quiet" onClick={next}>Not sure yet</button>
      </BottomBar>
    </section>
  );
}

// ── 4. Where is it? ──
function WhereScreen({ a, update, next }: { a: Answers; update: (p: Partial<Answers>) => void; next: () => void }) {
  const submit = (e: FormEvent) => { e.preventDefault(); next(); };
  return (
    <form className="b2-screen" onSubmit={submit}>
      <h1 className="b2-h1">Where is it?</h1>
      <label className="b2-field">
        <span className="b2-label">The place</span>
        <input className="b2-input" value={a.venue} maxLength={120} enterKeyHint="next" placeholder="e.g. Village Hall"
          onChange={(e) => update({ venue: e.target.value })} />
      </label>
      <label className="b2-field">
        <span className="b2-label">Address, for directions <span style={{ fontWeight: 400 }}>(if you like)</span></span>
        <input className="b2-input" style={{ fontSize: 18, fontWeight: 600 }} value={a.address} maxLength={300} enterKeyHint="done"
          placeholder="Street and town" onChange={(e) => update({ address: e.target.value })} />
      </label>
      <p className="b2-small">Guests get a Directions button that opens their own maps app.</p>
      <BottomBar>
        <button type="submit" className="b2-btn b2-primary b2-block" disabled={!a.venue.trim()}>Next</button>
        <button type="button" className="b2-btn b2-quiet" onClick={next}>Not decided yet</button>
      </BottomBar>
    </form>
  );
}

// ── 5. Pick a look: swipe through complete designs ──
function LookScreen({ a, now, onUse }: { a: Answers; now: number; onUse: (key: string) => void }) {
  const looks = looksFor(a.type);
  const start = Math.max(0, looks.findIndex((l) => l.key === a.look));
  const [active, setActive] = useState(start);
  const deck = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = deck.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const w = card ? card.offsetWidth + 16 : el.clientWidth;
    setActive(Math.max(0, Math.min(looks.length - 1, Math.round(el.scrollLeft / w))));
  };
  const jump = (i: number) => {
    const el = deck.current;
    const card = el?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">Pick a look</h1>
      <p className="b2-lead">Swipe to see more. Colours, border and letters all come together.</p>
      <div className="b2-deck" ref={deck} onScroll={onScroll}>
        {looks.map((l, i) => (
          <button key={l.key} type="button" className="b2-look" data-active={i === active ? "" : undefined}
            onClick={() => (i === active ? onUse(l.key) : jump(i))} aria-label={`${l.name}${i === active ? ", use this look" : ""}`}
            style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", cursor: "pointer" }}>
            <div className="b2-look-card"><EventView data={toViewData(draftFrom(a, l))} view="card" now={now} thumb /></div>
            <p>{l.name}</p>
          </button>
        ))}
      </div>
      <div className="b2-dots" aria-hidden="true">{looks.map((l, i) => <i key={l.key} data-on={i === active ? "" : undefined} />)}</div>
      <BottomBar>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={() => onUse(looks[active].key)}>Use “{looks[active].name}”</button>
      </BottomBar>
    </section>
  );
}

// ── 6. Add a photo ──
function PhotoScreen({ a, now, update, next, say }: { a: Answers; now: number; update: (p: Partial<Answers>) => void; next: () => void; say: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const look = looksFor(a.type).find((l) => l.key === a.look) ?? looksFor(a.type)[0];
  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try { update({ photo: (await resizePhoto(file, 1080, 0.78)).url }); }
    catch { say("That photo couldn’t be opened. Try another."); }
    finally { setBusy(false); }
  }
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">Add a photo</h1>
      <p className="b2-lead">The star of the day, or the place. Its hidden location is removed.</p>
      {a.photo ? (
        <div className="b2-stage">
          <div className="b2-float" style={{ animation: "none" }}><EventView data={toViewData(draftFrom(a, look))} view="card" now={now} thumb /></div>
        </div>
      ) : (
        <label className="b2-drop">
          <Icon name="camera" className="" />
          <span className="b2-h3">{busy ? "Preparing…" : "Choose a photo"}</span>
          <span className="b2-small">From your phone, or take one now</span>
          <input type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        </label>
      )}
      <BottomBar>
        {a.photo ? (
          <>
            <button type="button" className="b2-btn b2-primary b2-block" onClick={next}>Looks good</button>
            <label className="b2-btn b2-quiet" style={{ cursor: "pointer" }}>
              Change photo
              <input type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
            </label>
          </>
        ) : (
          <button type="button" className="b2-btn b2-secondary b2-block" onClick={next}>Skip for now</button>
        )}
      </BottomBar>
    </section>
  );
}

// ── Done: the invitation floats in, with a little confetti ──
function DoneScreen({ a, now, say, restart }: { a: Answers; now: number; say: (m: string) => void; restart: () => void }) {
  const [share, setShare] = useState(false);
  const look = looksFor(a.type).find((l) => l.key === a.look) ?? looksFor(a.type)[0];
  return (
    <section className="b2-screen" style={{ position: "relative" }}>
      <p className="b2-kicker">Ready</p>
      <h1 className="b2-h1">Your invitation is ready</h1>
      <motion.div className="b2-stage" initial={{ rotateY: -35, scale: 0.85, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 0.1 }}>
        <div className="b2-float"><EventView data={toViewData(draftFrom(a, look))} view="card" now={now} thumb /></div>
      </motion.div>
      <Pop />
      <p className="b2-small" style={{ textAlign: "center" }}>We wrote the words for you. Change anything from your event home.</p>
      <BottomBar>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={() => setShare(true)}><Icon name="share" className="" />Share it</button>
        <Link href="/new/home" className="b2-btn b2-secondary b2-block">Go to your event home</Link>
        <button type="button" className="b2-btn b2-quiet" onClick={restart}>Start again</button>
      </BottomBar>
      <Sheet open={share} title="Share your invitation" onClose={() => setShare(false)}>
        <p className="b2-small">In the finished app, this puts your page live and opens WhatsApp with your link ready to send.</p>
        {([["message", "Send on WhatsApp"], ["copy", "Copy the link"], ["qr", "Show a QR code"]] as const).map(([icon, label]) => (
          <button key={label} type="button" className="b2-row" onClick={() => say("Prototype: nothing is sent.")}>
            <span className="b2-ico" style={{ background: "linear-gradient(135deg, #8b7cff, #ffb627)" }}><Icon name={icon} className="" /></span>
            <span className="b2-grow"><strong>{label}</strong></span>
            <Icon name="next" className="size-5" />
          </button>
        ))}
      </Sheet>
    </section>
  );
}
