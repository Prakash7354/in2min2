"use client";

// Quick start: a ready invitation in about six screens, one thing per screen
// (CONCEPT 7e). Each kind of event asks its own questions with its own quick
// choices (kinds.ts): a birthday asks "which birthday?", a wedding asks for
// two names, a memorial asks what it is, a community event asks who's
// organising and about parking. Everything else waits on the event Home.

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import EventView from "@/components/event/event-view";
import { Icon, type IconName } from "@/components/icons";
import { eventType, ORGANISER_TYPES, PARKING_OPTIONS } from "@/lib/catalog";
import { applyType, toViewData, type Draft } from "@/lib/draft";
import { formatDate, formatTime } from "@/lib/event-view";
import { resizePhoto } from "@/lib/image";
import { useB2 } from "./context";
import { applyLook, currentLook, dateChips, dateLine, FIRST_TYPES, kindOf, looksFor, MEMORIAL_KINDS, MORE_TYPES, TYPE_ART } from "./kinds";
import type { Screen } from "./nav";
import { Peek } from "./peek";
import { MilestonePicker, TitleLine } from "./pickers";
import { AccountButton } from "./sheets";
import { BottomBar, Chips, Pop, TopBar, spring } from "./ui";

export function quickSteps(d: Draft): Screen[] {
  return d.scale === "community"
    ? ["what", "who", "organiser", "profit", "when", "where", "parking", "look", "photo"]
    : ["what", "who", "when", "where", "look", "photo"];
}

export const time12 = (t: string) => formatTime(t).replace(":00", "");

// Short names and icons for the organiser chips.
const ORGANISER_SHORT: Record<string, string> = {
  community_group: "Community group", club: "Club or society", charity: "Charity", armed_forces: "Armed forces or veterans",
  faith: "Faith group", business: "Business", individual: "An individual", family: "A family",
};
export const ORGANISER_ICON: Record<string, IconName> = {
  community_group: "flag", club: "star", charity: "heart", armed_forces: "shield", faith: "flower", business: "briefcase", individual: "user", family: "people",
};

function useQuick() {
  const b = useB2();
  const steps = quickSteps(b.d);
  // Forward to the next screen, remembering where the host got to. The
  // ready-made words start here and follow the facts until the AI or the
  // host writes them.
  const next = (from: Screen) => {
    const list = quickSteps(b.d);
    const i = list.indexOf(from);
    const to: Screen = i >= 0 && i < list.length - 1 ? list[i + 1] : "ready";
    b.update((x) => ({
      ...x, quickAt: to, quickDone: x.quickDone || to === "ready",
      wordsBy: x.wordsBy ?? (Object.values(x.copy).every((v) => !v.trim()) ? "suggested" : undefined),
    }));
    b.go({ screen: to });
  };
  return { ...b, steps, next };
}

export function QuickScreen({ screen }: { screen: Screen }) {
  const { steps, back } = useQuick();
  const i = steps.indexOf(screen);
  const body: Record<string, ReactNode> = {
    what: <WhatScreen />, who: <WhoScreen />, organiser: <OrganiserScreen />, profit: <ProfitScreen />, when: <WhenScreen />,
    where: <WhereScreen />, parking: <ParkingScreen />, look: <LookScreen />, photo: <PhotoScreen />, ready: <ReadyScreen />,
  };
  return (
    <>
      <TopBar step={i >= 0 ? i + 1 : undefined} of={steps.length} onBack={screen !== "what" ? () => void back() : undefined}
        right={<AccountButton />} />
      {body[screen] ?? <WhatScreen />}
    </>
  );
}

// ── What are you celebrating? ──
function WhatScreen() {
  const { d, update, next } = useQuick();
  const [more, setMore] = useState(() => !!d.eventType && !FIRST_TYPES.includes(d.eventType));
  const keys = more ? [...FIRST_TYPES, ...MORE_TYPES] : FIRST_TYPES;
  const t = eventType(d.eventType);
  const pick = (k: string) => {
    update((x) => applyType(x, k));
    window.setTimeout(() => next("what"), 220);
  };
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">What are you celebrating?</h1>
      <p className="b2-lead">Tap one. Everything else is set up for you.</p>
      <div className="b2-choices">
        {keys.map((k) => {
          const et = eventType(k);
          const art = TYPE_ART[k];
          if (!et || !art) return null;
          return (
            <button key={k} type="button" className="b2-choice" aria-pressed={d.eventType === k} onClick={() => pick(k)}>
              <span className="b2-art" style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }} aria-hidden="true">
                <Icon name={art.icon} className="" />
              </span>
              <span style={{ display: "grid", gap: 4 }}>
                <strong>{et.label}</strong>
                <span>{et.line}</span>
              </span>
            </button>
          );
        })}
      </div>
      {!more && <button type="button" className="b2-btn b2-secondary" onClick={() => setMore(true)}><Icon name="plus" className="" />More kinds of event</button>}
      {t && (
        <BottomBar><button type="button" className="b2-btn b2-primary b2-block" onClick={() => next("what")}>Next: {t.label}</button></BottomBar>
      )}
    </section>
  );
}

// ── Whose day is it? (or: what's it called?) ──
function WhoScreen() {
  const { d, update, next } = useQuick();
  const k = kindOf(d.eventType);
  const t = eventType(d.eventType);
  const [parts, setParts] = useState<[string, string]>(() => {
    const [a = "", ...rest] = d.stars.names.split(" & ");
    return [a, rest.join(" & ")];
  });
  const setCouple = (i: 0 | 1, v: string) => {
    const p: [string, string] = i === 0 ? [v, parts[1]] : [parts[0], v];
    setParts(p);
    update((x) => ({ ...x, stars: { ...x.stars, names: p.map((s) => s.trim()).filter(Boolean).join(" & ") } }));
  };
  const filled = k.titleFirst ? d.title.trim() : d.stars.names.trim();
  const submit = (e: FormEvent) => { e.preventDefault(); if (filled) next("who"); };
  // The bottom bar sits outside the form (see BottomBar), so its button names the form.
  const form = useId();
  return (
    <form id={form} className="b2-screen" onSubmit={submit}>
      <h1 className="b2-h1">{k.who}</h1>
      {k.titleFirst ? (
        <>
          <label className="b2-field">
            <span className="b2-label">{k.label}</span>
            <input className="b2-input" value={d.title} maxLength={120} enterKeyHint="next" autoComplete="off"
              placeholder={`e.g. ${k.example}`} onChange={(e) => update((x) => ({ ...x, title: e.target.value }))} />
          </label>
          {k.titleChips && (
            <Chips label="Popular names" value={k.titleChips.includes(d.title) ? d.title : null}
              options={k.titleChips.map((c) => ({ key: c, label: c }))}
              onChange={(c) => c && update((x) => ({ ...x, title: c }))} />
          )}
          <p className="b2-small">Tap one and add to it, or type your own. You can change it any time.</p>
        </>
      ) : k.couple ? (
        <div style={{ display: "grid", gap: 12 }}>
          <label className="b2-field">
            <span className="b2-label">{k.label}</span>
            <input className="b2-input" value={parts[0]} maxLength={58} enterKeyHint="next" autoComplete="off"
              placeholder={`e.g. ${k.example}`} onChange={(e) => setCouple(0, e.target.value)} />
          </label>
          <span aria-hidden="true" className="b2-amp">&amp;</span>
          <label className="b2-field">
            <span className="b2-label sr-only">And</span>
            <input className="b2-input" value={parts[1]} maxLength={58} enterKeyHint="next" autoComplete="off" aria-label="And"
              placeholder={d.eventType === "wedding" ? "e.g. Jose" : d.eventType === "anniversary" ? "e.g. Sita" : "e.g. Sam"} onChange={(e) => setCouple(1, e.target.value)} />
          </label>
        </div>
      ) : (
        <label className="b2-field">
          <span className="b2-label">{k.label}</span>
          <input className="b2-input" value={d.stars.names} maxLength={120} enterKeyHint="next" autoComplete="off"
            placeholder={`e.g. ${k.example}`} onChange={(e) => update((x) => ({ ...x, stars: { ...x.stars, names: e.target.value } }))} />
        </label>
      )}

      {k.milestone && <MilestonePicker m={k.milestone} />}
      {k.memorialKinds && (
        <div className="b2-field">
          <span className="b2-label">What is it?</span>
          <Chips label="What is it?" value={d.milestone ?? "Remembrance"} options={MEMORIAL_KINDS.map((m) => ({ key: m.key, label: m.key }))}
            onChange={(c) => update((x) => ({ ...x, milestone: c ?? undefined }))} />
        </div>
      )}

      {!k.titleFirst && filled && <TitleLine />}
      <BottomBar aside={<Peek />}>
        <button type="submit" form={form} className="b2-btn b2-primary b2-block" disabled={!filled}>Next</button>
        <button type="button" className="b2-btn b2-quiet" onClick={() => next("who")}>Skip for now</button>
      </BottomBar>
      {t?.soonNote && <p className="b2-note">{t.soonNote}</p>}
    </form>
  );
}

// ── Who's organising? (public events) ──
function OrganiserScreen() {
  const { d, update, next } = useQuick();
  const submit = (e: FormEvent) => { e.preventDefault(); if (d.organiserName.trim() && d.organiserType) next("organiser"); };
  const form = useId();
  return (
    <form id={form} className="b2-screen" onSubmit={submit}>
      <h1 className="b2-h1">Who’s organising?</h1>
      <label className="b2-field">
        <span className="b2-label">Organiser’s name</span>
        <input className="b2-input" value={d.organiserName} maxLength={120} enterKeyHint="next" autoComplete="organization"
          placeholder="e.g. Riverside Community Association" onChange={(e) => update((x) => ({ ...x, organiserName: e.target.value }))} />
      </label>
      <div className="b2-field">
        <span className="b2-label">What kind of organiser?</span>
        <Chips label="What kind of organiser?" value={d.organiserType || null}
          options={ORGANISER_TYPES.map((o) => ({ key: o.key, label: ORGANISER_SHORT[o.key] ?? o.label, icon: ORGANISER_ICON[o.key] }))}
          onChange={(c) => update((x) => ({ ...x, organiserType: c ?? "" }))} />
      </div>
      <p className="b2-small">Shown on the page, so people know who they’re dealing with. Needed before a public event goes live.</p>
      <BottomBar aside={<Peek />}>
        <button type="submit" form={form} className="b2-btn b2-primary b2-block" disabled={!d.organiserName.trim() || !d.organiserType}>Next</button>
        <button type="button" className="b2-btn b2-quiet" onClick={() => next("organiser")}>Skip for now</button>
      </BottomBar>
    </form>
  );
}

// ── Is anyone making a profit? Two big answers; tapping one moves on. ──
function ProfitScreen() {
  const { d, update, next } = useQuick();
  const answer = (v: boolean) => { update((x) => ({ ...x, forProfit: v })); window.setTimeout(() => next("profit"), 200); };
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">Is anyone making a profit?</h1>
      <p className="b2-lead">An honest answer keeps things fair. It’s shown on the page.</p>
      <div style={{ display: "grid", gap: 12 }}>
        {([[false, "No", "Money raised goes to the cause, or just covers the costs", "heart"], [true, "Yes", "A business or a person keeps any profit", "briefcase"]] as const).map(([v, label, line, icon]) => (
          <button key={label} type="button" className="b2-choice b2-choice-row" aria-pressed={d.forProfit === v} onClick={() => answer(v)}>
            <span className="b2-art" style={{ background: v ? "linear-gradient(135deg, #3d5afe, #1a237e)" : "linear-gradient(135deg, #26c6da, #00838f)" }} aria-hidden="true">
              <Icon name={icon} className="" />
            </span>
            <span style={{ display: "grid", gap: 4 }}><strong>{label}</strong><span>{line}</span></span>
          </button>
        ))}
      </div>
      <BottomBar aside={<Peek />}><button type="button" className="b2-btn b2-quiet" onClick={() => next("profit")}>Skip for now</button></BottomBar>
    </section>
  );
}

// ── When is it? Quick dates and the usual start times for this kind of event ──
function WhenScreen() {
  const { d, update, next } = useQuick();
  const k = kindOf(d.eventType);
  const [now] = useState(() => new Date());
  const dates = dateChips(d.eventType, now);
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">When is it?</h1>
      <div className="b2-field">
        <span className="b2-label">The day</span>
        <Chips label="Quick dates" value={dates.find((x) => x.date === d.date)?.date ?? null}
          options={dates.map((x) => ({ key: x.date, label: x.label, line: dateLine(x.label, x.date), icon: "calendar" as const }))}
          onChange={(v) => v && update((x) => ({ ...x, date: v }))} />
        <input className="b2-input b2-input-sm" type="date" aria-label="Or pick the date" value={d.date} onChange={(e) => update((x) => ({ ...x, date: e.target.value }))} />
      </div>
      <div className="b2-field">
        <span className="b2-label">Starts at</span>
        <Chips label="Usual start times" value={k.times.includes(d.startTime) ? d.startTime : null}
          options={k.times.map((v) => ({ key: v, label: time12(v), icon: "clock" as const }))}
          onChange={(v) => v && update((x) => ({ ...x, startTime: v }))} />
        <input className="b2-input b2-input-sm" type="time" aria-label="Or the exact time" value={d.startTime} onChange={(e) => update((x) => ({ ...x, startTime: e.target.value }))} />
      </div>
      {d.date && <p className="b2-h3" aria-live="polite">{formatDate(d.date)}{d.startTime ? `, ${formatTime(d.startTime)}` : ""}</p>}
      <BottomBar aside={<Peek />}>
        <button type="button" className="b2-btn b2-primary b2-block" disabled={!d.date} onClick={() => next("when")}>Next</button>
        <button type="button" className="b2-btn b2-quiet" onClick={() => next("when")}>Not sure yet</button>
      </BottomBar>
    </section>
  );
}

// ── Where is it? ──
export const venueValue = (chip: string) => (chip === "At home" ? "Our home" : chip);
function WhereScreen() {
  const { d, update, next } = useQuick();
  const k = kindOf(d.eventType);
  const submit = (e: FormEvent) => { e.preventDefault(); next("where"); };
  const form = useId();
  return (
    <form id={form} className="b2-screen" onSubmit={submit}>
      <h1 className="b2-h1">Where is it?</h1>
      <div className="b2-field">
        <span className="b2-label">The place</span>
        <Chips label="Popular places" value={k.venues.map(venueValue).includes(d.venueName) ? d.venueName : null}
          options={k.venues.map((v) => ({ key: venueValue(v), label: v, icon: "pin" as const }))}
          onChange={(v) => v && update((x) => ({ ...x, venueName: v }))} />
        <input className="b2-input" value={d.venueName} maxLength={120} enterKeyHint="next" placeholder="Or type its name"
          aria-label="The place's name" onChange={(e) => update((x) => ({ ...x, venueName: e.target.value }))} />
      </div>
      <label className="b2-field">
        <span className="b2-label">Address, for directions <span style={{ fontWeight: 500 }}>(if you like)</span></span>
        <input className="b2-input b2-input-sm" value={d.venueAddress} maxLength={300} enterKeyHint="done" autoComplete="street-address"
          placeholder="Street and postcode" onChange={(e) => update((x) => ({ ...x, venueAddress: e.target.value }))} />
      </label>
      <p className="b2-small">Guests get a Directions button that opens their own maps app.</p>
      <BottomBar aside={<Peek />}>
        <button type="submit" form={form} className="b2-btn b2-primary b2-block" disabled={!d.venueName.trim()}>Next</button>
        <button type="button" className="b2-btn b2-quiet" onClick={() => next("where")}>Not decided yet</button>
      </BottomBar>
    </form>
  );
}

// ── Parking (public events): four big answers ──
const PARKING_ICON = { free: "check", paid: "coins", street: "pin", none: "close" } as const;
function ParkingScreen() {
  const { d, update, next } = useQuick();
  const answer = (v: Draft["parking"]) => { update((x) => ({ ...x, parking: v })); window.setTimeout(() => next("parking"), 200); };
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">Is there parking?</h1>
      <p className="b2-lead">Guests see it with the directions. Add a note later, like “40 spaces behind the hall”.</p>
      <div className="b2-choices">
        {PARKING_OPTIONS.map((o) => (
          <button key={o.key} type="button" className="b2-choice" aria-pressed={d.parking === o.key} onClick={() => answer(o.key)}>
            <span className="b2-art" style={{ background: "linear-gradient(135deg, #22b8cf, #1e6fd9)" }} aria-hidden="true">
              <Icon name={PARKING_ICON[o.key as keyof typeof PARKING_ICON] ?? "pin"} className="" />
            </span>
            <span style={{ display: "grid", gap: 4 }}><strong>{o.label}</strong><span>{o.line}</span></span>
          </button>
        ))}
      </div>
      <BottomBar aside={<Peek />}><button type="button" className="b2-btn b2-quiet" onClick={() => next("parking")}>Skip for now</button></BottomBar>
    </section>
  );
}

// ── Pick a look: swipe through complete designs ──
function LookScreen() {
  const { d, update, next, now } = useQuick();
  const looks = looksFor(d.eventType);
  const [active, setActive] = useState(() => Math.max(0, looks.findIndex((l) => l.key === currentLook(d))));
  const deck = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = deck.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const w = card ? card.offsetWidth + 16 : el.clientWidth;
    setActive(Math.max(0, Math.min(looks.length - 1, Math.round(el.scrollLeft / w))));
  };
  const jump = (i: number) => (deck.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  const use = (i: number) => { update((x) => applyLook(x, looks[i])); next("look"); };
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">Pick a look</h1>
      <p className="b2-lead">Swipe to see more. Colours, border and letters come together; fine-tune them later.</p>
      <div className="b2-deck" ref={deck} onScroll={onScroll}>
        {looks.map((l, i) => (
          <button key={l.key} type="button" className="b2-look" data-active={i === active ? "" : undefined}
            onClick={() => (i === active ? use(i) : jump(i))} aria-label={`${l.name}${i === active ? ", use this look" : ""}`}>
            <div className="b2-look-card"><EventView data={toViewData(applyLook(d, l))} view="card" now={now} thumb /></div>
            <p>{l.name}</p>
          </button>
        ))}
      </div>
      <div className="b2-dots" aria-hidden="true">{looks.map((l, i) => <i key={l.key} data-on={i === active ? "" : undefined} />)}</div>
      <BottomBar>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={() => use(active)}>Use “{looks[active]?.name}”</button>
      </BottomBar>
    </section>
  );
}

// ── Add a photo (optional) ──
function PhotoScreen() {
  const { d, update, next, now, say } = useQuick();
  const [busy, setBusy] = useState(false);
  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const r = await resizePhoto(file);
      // A landscape photo fills the space; a square or tall one (a logo, a poster) is shown whole.
      update((x) => ({ ...x, cover: r.url, coverFit: r.width / r.height >= 1.25 ? "fill" : "whole" }));
    } catch (e) {
      say(e instanceof Error && e.message.includes("isn't a photo") ? e.message : "That photo couldn’t be opened. Try another.");
    } finally {
      setBusy(false);
    }
  }
  const t = eventType(d.eventType);
  return (
    <section className="b2-screen">
      <h1 className="b2-h1">Add a photo</h1>
      <p className="b2-lead">{t?.sensitive ? "A favourite photo of them." : d.scale === "community" ? "A poster, a logo or last year’s best photo." : "The star of the day, or the place."} Its hidden location is removed.</p>
      {d.cover ? (
        <div className="b2-stage">
          <div className="b2-float" style={{ animation: "none" }}><EventView data={toViewData(d)} view="card" now={now} thumb /></div>
        </div>
      ) : (
        <label className="b2-drop">
          <Icon name="camera" className="" />
          <span className="b2-h3">{busy ? "Preparing…" : "Choose a photo"}</span>
          <span className="b2-small">From your phone, or take one now</span>
          <input type="file" accept="image/*" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}
      <BottomBar aside={d.cover ? undefined : <Peek />}>
        {d.cover ? (
          <>
            <button type="button" className="b2-btn b2-primary b2-block" onClick={() => next("photo")}>Looks good</button>
            <label className="b2-btn b2-quiet" style={{ cursor: "pointer" }}>
              Change photo
              <input type="file" accept="image/*" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          </>
        ) : (
          <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => next("photo")}>Skip for now</button>
        )}
      </BottomBar>
    </section>
  );
}

// ── Ready: the invitation floats in. The AI writes the words meanwhile. ──
function ReadyScreen() {
  const { d, now, session, ai, writeAll, open, go } = useQuick();
  const t = eventType(d.eventType);
  const sensitive = !!t?.sensitive;
  const writing = ai.busy === "all";
  return (
    <section className="b2-screen" style={{ position: "relative" }}>
      <p className="b2-kicker">Ready</p>
      <h1 className="b2-h1">{sensitive ? "Your page is ready" : d.scale === "community" ? "Your event page is ready" : "Your invitation is ready"}</h1>
      <motion.div className="b2-stage" initial={{ rotateY: -35, scale: 0.85, opacity: 0 }} animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 0.1 }}>
        <button type="button" className="b2-float b2-cardbtn" style={{ width: "min(66%, 290px)" }} onClick={() => open("preview")} aria-label="See it full-screen">
          <EventView data={toViewData(d)} view="card" now={now} thumb />
          {writing && <span className="b2-writing"><Icon name="sparkle" className="" />The AI is writing your words…</span>}
        </button>
      </motion.div>
      {!sensitive && <Pop />}

      {d.wordsBy === "ai" && !writing ? (
        <p className="b2-note" data-tone="ok"><Icon name="sparkle" className="b2-inline" /> Written by the AI. Read it, and change anything from your event home.</p>
      ) : !writing && (
        <div className="b2-ai">
          <p className="b2-h3"><Icon name="sparkle" className="b2-inline" /> {session ? "Let the AI write your words" : "Want better words?"}</p>
          <p className="b2-small">{session
            ? "In English, Nepali or both, in about ten seconds. You check every word."
            : "Sign in (free) and the AI writes them for you, in English, Nepali or both. These ready-made words are fine too."}</p>
          {ai.error && <p className="b2-small" role="alert">{ai.error}</p>}
          <button type="button" className="b2-btn b2-secondary" onClick={() => void writeAll()}>
            <Icon name="sparkle" className="" />{session ? "Write it for me" : "Sign in and write it"}
          </button>
        </div>
      )}

      <BottomBar>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={() => open("publish")}>
          <Icon name="share" className="" />Publish and share
        </button>
        <button type="button" className="b2-btn b2-quiet" onClick={() => go({ screen: "home" })}>Go to your event home</button>
      </BottomBar>
    </section>
  );
}
