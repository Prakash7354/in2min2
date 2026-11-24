"use client";

// The builder's seven screens (docs/CONCEPT.md, section 7). One question per
// screen; every change is saved straight away by the parent.

import { useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { COPY_FIELDS, COPY_KEYS, charCount, type CopyKey, type CopyResponse } from "@/lib/ai/copy";
import { copyRequest } from "@/lib/ai/request";
import { COURSES, DEFAULT_RUN, MEAL_WORDS, RUN_SUGGESTIONS, nextTime } from "@/lib/running-order";
import {
  BORDERS, COVER_FITS, EFFECTS, EVENT_TYPES, HERO_MOTIONS, LANGUAGES, MAX_SHOWCASE, ORGANISER_TYPES, PALETTE_FAMILIES, PALETTES, PARKING_OPTIONS, PHOTO_STYLES, SCALES,
  TEMPLATES, TEXT_STYLES, TOGGLES, TONES, eventType, formatPence, language, onlineWords, paletteFor, plan, plansFor, quote,
  type CoverFit, type EffectKey, type HeroMotion, type Palette, type PhotoStyle, type Scale, type Tag,
} from "@/lib/catalog";
import {
  applyScale, applyType, fingerprint, missingForPublish, people, slugify, toViewData, unpublishedChanges, type Draft,
} from "@/lib/draft";
import { formatDate, formatTime, type MenuItem } from "@/lib/event-view";
import { resizePhoto } from "@/lib/image";
import EventView from "@/components/event/event-view";
import { saveMedia } from "@/lib/media-upload";
import { publishDraft } from "@/lib/publish";
import { supabase } from "@/lib/supabase/client";
import type { PhotosState } from "./photos";
import { totals, type RepliesState } from "./replies";
import { ShareLinks } from "./share-links";
import { eventLink } from "./topbar";
import { Badge, Button, Choices, Field, Group, Notice, Soon, Switch, Tick, inputClass } from "./ui";

export type StepProps = {
  d: Draft; update: (fn: (d: Draft) => Draft) => void; now: number; session?: Session | null;
  askSignIn: (why: string, then?: () => void) => void; say: (message: string) => void;
};

const set = <K extends keyof Draft>(key: K, value: Draft[K]) => (d: Draft): Draft => ({ ...d, [key]: value });

// ───────────────────────────── 1. What are you celebrating? ─────────────────────────────

export function StepType({ d, update }: StepProps) {
  const t = eventType(d.eventType);
  return (
    <div className="grid gap-6">
      <div role="radiogroup" aria-label="What are you celebrating?" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {EVENT_TYPES.map((et) => {
          const on = et.key === d.eventType;
          const p = paletteFor(et.palette);
          return (
            <button
              key={et.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => update((x) => applyType(x, et.key))}
              className={`grid overflow-hidden rounded-2xl border-2 text-left transition ${on ? "border-brand shadow-[0_6px_18px_-10px_rgba(46,42,110,0.6)]" : "border-line hover:border-brand/40"}`}
            >
              <span className="relative flex h-14 items-end px-3 pb-2" style={{ background: p.soft }} aria-hidden="true">
                <span className="font-display text-2xl font-extrabold leading-none" style={{ color: p.main }}>{Array.from(et.label)[0]}</span>
                <Badge tag={et.tag} className="absolute right-2 top-2" />
                <span className="absolute bottom-2.5 right-3 flex gap-1">
                  <i className="size-3 rounded-full" style={{ background: p.main }} />
                  <i className="size-3 rounded-full" style={{ background: p.accent }} />
                </span>
              </span>
              <span className="grid gap-0.5 bg-card px-3 py-2.5">
                <span className="font-semibold leading-tight">{et.label}</span>
                <span className="text-sm leading-snug text-muted">{et.line}</span>
              </span>
            </button>
          );
        })}
      </div>
      {t?.soonNote && <Notice>{t.soonNote}</Notice>}
      {t && (
        <Group icon="sparkle" title={`This looks like ${SCALES[d.scale].label.toLowerCase()}`} line="This decides which switches you see. Change it if it doesn't fit.">
          <Choices<Scale>
            label="How big is your event?"
            value={d.scale}
            columns="grid-cols-1 sm:grid-cols-3"
            onChange={(k) => update((x) => applyScale(x, k))}
            options={(Object.keys(SCALES) as Scale[]).map((k) => ({ key: k, label: SCALES[k].label, line: SCALES[k].line }))}
          />
        </Group>
      )}
    </div>
  );
}

// ───────────────────────────── 2. Who is it for? ─────────────────────────────

const TITLE_EXAMPLES: Record<string, string> = {
  birthday: "Asha is 10!", pasni: "Aarav's Pasni", wedding: "Meenu & Jose", engagement: "Priya & Sam's engagement",
  anniversary: "Ram & Sita: 25 years", bratabandha: "Kiran's Bratabandha", reunion: "2nd Battalion reunion 2027",
  mela: "Riverside Mela 2027", sport: "Riverside Cup 2027", charity: "Walk for Nepal 2027", community: "Dashain gathering 2027",
  memorial: "Remembering Bhim Bahadur", corporate: "Annual dinner 2027",
  christmas: "The Gurung family Christmas", "new-year": "New Year's Eve 2026", lhosar: "Tamu Lhosar 2026",
};

export function StepWho({ d, update }: StepProps) {
  const t = eventType(d.eventType);
  const community = d.scale === "community";
  return (
    <div className="grid gap-6">
      <Field id="title" label="Name of the event" hint="The big line on the page. You can change it any time." aside={`${charCount(d.title)}/120`}>
        <input id="title" className={inputClass} value={d.title} maxLength={120}
          placeholder={TITLE_EXAMPLES[d.eventType ?? ""] ?? "Our celebration"}
          onChange={(e) => update(set("title", e.target.value))} />
      </Field>

      <Group icon="star" title={t?.starLabel ?? "Who it's for"} line={community ? "What or who the event is for." : "The stars of the day. They come first on the card and the page."}>
        <Field id="star-names" label="Names" aside={`${charCount(d.stars.names)}/120`}>
          <input id="star-names" className={inputClass} value={d.stars.names} maxLength={120}
            placeholder={d.eventType === "wedding" || d.eventType === "anniversary" ? "Meenu & Jose" : d.eventType === "memorial" ? "Bhim Bahadur Gurung" : "Aarav"}
            onChange={(e) => update((x) => ({ ...x, stars: { ...x.stars, names: e.target.value } }))} />
        </Field>
        <Field id="star-relation" label="Shown above the names" hint="For example: The couple, The birthday girl, Our grandfather.">
          <input id="star-relation" className={inputClass} value={d.stars.relation} maxLength={40}
            onChange={(e) => update((x) => ({ ...x, stars: { ...x.stars, relation: e.target.value } }))} />
        </Field>
      </Group>

      {!community && <Family d={d} update={update} />}
      {community && <Organiser d={d} update={update} />}
    </div>
  );
}

function Family({ d, update }: Pick<StepProps, "d" | "update">) {
  const sensitive = eventType(d.eventType)?.sensitive;
  const edit = (i: number, key: "relation" | "names", value: string) =>
    update((x) => ({ ...x, family: x.family.map((f, j) => (j === i ? { ...f, [key]: value } : f)) }));
  return (
    <Group icon="heart" title="Family to honour" line={sensitive ? "Shown as “With love from”. Optional." : "Parents, grandparents and close family, shown with pride as “With blessings from”. Optional."}>
      <datalist id="relations">
        {["Parents", "Grandparents", "Mother", "Father", "Brothers and sisters", "Uncles and aunts", "The family"].map((r) => <option key={r} value={r} />)}
      </datalist>
      {d.family.map((f, i) => (
        <div key={i} className="grid gap-3 rounded-2xl bg-wash/60 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-end">
          <Field id={`fam-rel-${i}`} label="Who">
            <input id={`fam-rel-${i}`} list="relations" className={inputClass} value={f.relation} maxLength={40} placeholder="Grandparents"
              onChange={(e) => edit(i, "relation", e.target.value)} />
          </Field>
          <Field id={`fam-names-${i}`} label="Names">
            <input id={`fam-names-${i}`} className={inputClass} value={f.names} maxLength={120} placeholder="Mr & Mrs Gurung"
              onChange={(e) => edit(i, "names", e.target.value)} />
          </Field>
          <Button kind="quiet" onClick={() => update((x) => ({ ...x, family: x.family.filter((_, j) => j !== i) }))}>Remove</Button>
        </div>
      ))}
      {d.family.length < 6 && (
        <Button kind="ghost" onClick={() => update((x) => ({ ...x, family: [...x.family, { relation: "", names: "" }] }))}>
          Add family
        </Button>
      )}
    </Group>
  );
}

function Organiser({ d, update }: Pick<StepProps, "d" | "update">) {
  return (
    <Group icon="flag" title="Who's organising?" line="Shown on the page so people know who they're dealing with. Needed before a public event can be published.">
      <Field id="org-name" label="Organiser's name" aside={`${charCount(d.organiserName)}/120`}>
        <input id="org-name" className={inputClass} value={d.organiserName} maxLength={120} placeholder="Riverside Community Association"
          onChange={(e) => update(set("organiserName", e.target.value))} />
      </Field>
      <Field id="org-type" label="What kind of organiser?">
        <select id="org-type" className={inputClass} value={d.organiserType} onChange={(e) => update(set("organiserType", e.target.value))}>
          <option value="">Choose one</option>
          {ORGANISER_TYPES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </Field>
      <div className="grid gap-2">
        <p className="font-semibold">Is anyone making a profit from this event?</p>
        <Choices<"no" | "yes">
          label="Is anyone making a profit from this event?"
          value={d.forProfit === null ? null : d.forProfit ? "yes" : "no"}
          onChange={(k) => update(set("forProfit", k === "yes"))}
          options={[{ key: "no", label: "No", line: "Money raised goes to the cause or covers costs" }, { key: "yes", label: "Yes", line: "A business or person keeps any profit" }]}
        />
      </div>
      {d.organiserType === "charity" && (
        <Field id="org-charity" label="Charity number (if registered)" hint="Small charities don't have to register; leave it empty if you haven't one.">
          <input id="org-charity" className={inputClass} value={d.charityNumber} maxLength={12} placeholder="1234567"
            onChange={(e) => update(set("charityNumber", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")))} />
        </Field>
      )}
      <Field id="org-contact" label="Contact to show (phone or email)" hint="Optional, but people trust a page with a real contact.">
        <input id="org-contact" className={inputClass} value={d.organiserContact} maxLength={120} placeholder="07700 900456"
          onChange={(e) => update(set("organiserContact", e.target.value))} />
      </Field>
    </Group>
  );
}

// ───────────────────────────── 3. When, where and how many ─────────────────────────────

function RunningOrderEditor({ d, update }: Pick<StepProps, "d" | "update">) {
  const community = d.scale === "community";
  const suggestions = RUN_SUGGESTIONS[d.eventType ?? ""] ?? DEFAULT_RUN;
  const used = new Set(d.functions.map((f) => f.title.trim().toLowerCase()));
  type Item = Draft["functions"][number];
  const edit = (id: string, patch: Partial<Item>) =>
    update((x) => ({ ...x, functions: x.functions.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const add = (title = "") => update((x) => {
    const meal = MEAL_WORDS.test(title);
    const id = `${Date.now().toString(36)}${x.functions.length}`;
    return { ...x, functions: [...x.functions, { id, title, date: x.date, time: nextTime(x), place: "", note: "", meal, menu: meal ? [{ course: "Main", dish: "" }] : [] }] };
  });
  const full = d.functions.length >= 15;
  return (
    <Group icon="list" title={community ? "Programme" : "Running order"}
      line="What happens when, with a menu for each meal. Guests see it on the event page, and on the day it shows what's on now. Optional.">
      {!d.toggles.schedule && <Notice tone="warn">The running order is switched off in step 6, so guests won&apos;t see it.</Notice>}
      {!full && (
        <div className="grid gap-2">
          <p className="text-[15px] font-semibold">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.filter((t) => !used.has(t.toLowerCase())).map((t) => (
              <button key={t} type="button" onClick={() => add(t)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-line bg-card px-4 font-semibold hover:border-brand/50">
                <span aria-hidden="true" className="text-brand">+</span> {t}
                {MEAL_WORDS.test(t) && <span aria-hidden="true">🍽</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <datalist id="run-names">{suggestions.map((t) => <option key={t} value={t} />)}</datalist>
      <datalist id="courses">{COURSES.map((c) => <option key={c} value={c} />)}</datalist>
      {d.functions.map((f, i) => (
        <RunItem key={f.id} f={f} n={i + 1} d={d} edit={(patch) => edit(f.id, patch)}
          remove={() => update((x) => ({ ...x, functions: x.functions.filter((g) => g.id !== f.id) }))} />
      ))}
      {!full && (
        <Button kind="ghost" onClick={() => add()} className="justify-self-start">
          {d.functions.length ? "Add another" : community ? "Add to the programme" : "Add to the running order"}
        </Button>
      )}
      {d.functions.length > 1 && <p className="text-[15px] text-muted">Guests see these in time order, whatever order you add them in.</p>}
    </Group>
  );
}

function RunItem({ f, n, d, edit, remove }: {
  f: Draft["functions"][number]; n: number; d: Draft; edit: (patch: Partial<Draft["functions"][number]>) => void; remove: () => void;
}) {
  const [more, setMore] = useState(!!(f.place || f.note || (f.date && f.date !== d.date)));
  const menu = f.menu ?? [];
  const setMenu = (next: MenuItem[]) => edit({ menu: next });
  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-card p-3 sm:p-4">
      <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-3">
        <Field id={`run-time-${f.id}`} label="Time">
          <input id={`run-time-${f.id}`} type="time" className={inputClass} value={f.time} onChange={(e) => edit({ time: e.target.value })} />
        </Field>
        <Field id={`run-what-${f.id}`} label={`What (${n})`}>
          <input id={`run-what-${f.id}`} list="run-names" className={inputClass} value={f.title} maxLength={80} placeholder="Welcome speech"
            onChange={(e) => edit({ title: e.target.value })} />
        </Field>
      </div>
      {more ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={`run-place-${f.id}`} label="Where, if different">
            <input id={`run-place-${f.id}`} className={inputClass} value={f.place} maxLength={120} placeholder="Main hall"
              onChange={(e) => edit({ place: e.target.value })} />
          </Field>
          {d.scale !== "personal" && (
            <Field id={`run-date-${f.id}`} label="Date, if a different day">
              <input id={`run-date-${f.id}`} type="date" className={inputClass} value={f.date} onChange={(e) => edit({ date: e.target.value })} />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field id={`run-note-${f.id}`} label="A short note" aside={`${(f.note ?? "").length}/140`}>
              <input id={`run-note-${f.id}`} className={inputClass} value={f.note ?? ""} maxLength={140} placeholder="Tea and coffee in the foyer"
                onChange={(e) => edit({ note: e.target.value })} />
            </Field>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setMore(true)} className="justify-self-start text-[15px] font-semibold text-brand underline underline-offset-4">
          Add a place, date or note
        </button>
      )}
      <label className="flex min-h-11 items-center gap-3 font-semibold">
        <input type="checkbox" className="size-6 accent-[#2E2A6E]" checked={!!f.meal}
          onChange={(e) => edit({ meal: e.target.checked, menu: e.target.checked && !menu.length ? [{ course: "Main", dish: "" }] : menu })} />
        <span>It&apos;s a meal: add the menu <span aria-hidden="true">🍽</span></span>
      </label>
      {f.meal && (
        <div className="grid gap-2 rounded-xl bg-wash/70 p-3">
          <p className="font-semibold">Menu for {f.title || "this meal"}</p>
          {!d.toggles.menu && <Notice tone="warn">The food menu is switched off in step 6, so guests won&apos;t see it.</Notice>}
          {menu.map((m, j) => (
            <div key={j} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 rounded-xl bg-card p-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto]">
              <input aria-label={`Course for dish ${j + 1}`} list="courses" className={`${inputClass} px-3 py-2 text-[15px] font-semibold sm:col-start-1`} value={m.course} maxLength={40} placeholder="Course, e.g. Main"
                onChange={(e) => setMenu(menu.map((x, k) => (k === j ? { ...x, course: e.target.value } : x)))} />
              <button type="button" aria-label={`Remove dish ${j + 1}`} onClick={() => setMenu(menu.filter((_, k) => k !== j))}
                className="grid size-11 place-items-center rounded-full text-muted hover:bg-line hover:text-ink sm:col-start-3 sm:row-start-1">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
              <input aria-label={`Dish ${j + 1}`} className={`${inputClass} col-span-2 px-3 py-2.5 text-[16px] sm:col-span-1 sm:col-start-2 sm:row-start-1`} value={m.dish} maxLength={160} placeholder="Dish, e.g. Dal bhat with goat curry"
                onChange={(e) => setMenu(menu.map((x, k) => (k === j ? { ...x, dish: e.target.value } : x)))} />
            </div>
          ))}
          {menu.length < 20 && (
            <Button kind="ghost" className="justify-self-start" onClick={() => setMenu([...menu, { course: menu[menu.length - 1]?.course ?? "Main", dish: "" }])}>
              Add a dish
            </Button>
          )}
          <p className="text-[15px] leading-snug text-muted">Tip: mark dishes (V) vegetarian, (VG) vegan or (GF) gluten-free. Dishes under the same course are grouped.</p>
        </div>
      )}
      <Button kind="quiet" onClick={remove} className="justify-self-start">Remove</Button>
    </div>
  );
}

export function StepWhen({ d, update }: StepProps) {
  const community = d.scale === "community";
  const n = people(d);
  const overCapacity = d.venueCapacity !== null && n > d.venueCapacity;
  return (
    <div className="grid gap-6">
      <Group icon="calendar" title="When">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="date" label="Date">
            <input id="date" type="date" className={inputClass} value={d.date} onChange={(e) => update(set("date", e.target.value))} />
          </Field>
          <Field id="start" label="Starts">
            <input id="start" type="time" className={inputClass} value={d.startTime} onChange={(e) => update(set("startTime", e.target.value))} />
          </Field>
          <Field id="end" label="Ends (optional)">
            <input id="end" type="time" className={inputClass} value={d.endTime} onChange={(e) => update(set("endTime", e.target.value))} />
          </Field>
        </div>
        {d.date && <p className="text-[15px] text-muted">Guests will see: {formatDate(d.date)}{d.startTime ? `, ${formatTime(d.startTime)}` : ""}</p>}
      </Group>

      <Group icon="pin" title="Where">
        <Field id="venue" label="Venue name" aside={`${charCount(d.venueName)}/120`}>
          <input id="venue" className={inputClass} value={d.venueName} maxLength={120} placeholder="Princes Hall"
            onChange={(e) => update(set("venueName", e.target.value))} />
        </Field>
        <Field id="address" label="Address and postcode" hint="Guests get a Directions button that opens maps on their phone.">
          <textarea id="address" rows={2} className={inputClass} value={d.venueAddress} maxLength={300} placeholder="Princes Way, Aldershot GU11 1NX"
            onChange={(e) => update(set("venueAddress", e.target.value))} />
        </Field>
        <div className="grid gap-2">
          <p className="font-semibold">Parking</p>
          <Choices
            label="Parking"
            value={d.parking === "unknown" ? null : d.parking}
            columns="grid-cols-2 sm:grid-cols-4"
            onChange={(k) => update(set("parking", k))}
            options={PARKING_OPTIONS.map((o) => ({ key: o.key, label: o.label, line: o.line }))}
          />
        </div>
        {d.parking !== "unknown" && (
          <Field id="parking-note" label="Parking note (optional)" aside={`${charCount(d.parkingNote)}/140`}>
            <input id="parking-note" className={inputClass} value={d.parkingNote} maxLength={140} placeholder="40 spaces behind the hall"
              onChange={(e) => update(set("parkingNote", e.target.value))} />
          </Field>
        )}
      </Group>

      <RunningOrderEditor d={d} update={update} />

      <Group icon="people" title="How many people?" line="Count everyone, children too. It sets your price and tells the venue and caterer what to expect.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="people" label="About how many people?">
            <input id="people" type="number" inputMode="numeric" min={1} max={100000} className={inputClass} value={d.expectedGuests ?? ""} placeholder="150"
              onChange={(e) => update(set("expectedGuests", e.target.value ? Math.min(100000, Math.max(0, Math.floor(+e.target.value))) : null))} />
          </Field>
          <Field id="capacity" label={community ? "Venue's safe capacity" : "Venue's safe capacity (optional)"} hint="Replies and tickets stop here, and a waiting list takes over.">
            <input id="capacity" type="number" inputMode="numeric" min={1} max={100000} className={inputClass} value={d.venueCapacity ?? ""} placeholder="250"
              onChange={(e) => update(set("venueCapacity", e.target.value ? Math.min(100000, Math.max(0, Math.floor(+e.target.value))) : null))} />
          </Field>
        </div>
        {overCapacity && <Notice tone="warn">That&apos;s more people than the venue holds safely. Check the number with the venue.</Notice>}
      </Group>

      {community ? <CommunityPrice /> : <PlanPicker d={d} update={update} />}
    </div>
  );
}

function PlanPicker({ d, update }: Pick<StepProps, "d" | "update">) {
  const n = people(d);
  return (
    <Group icon="hourglass" title="How long should the page stay online?" line="After the event, guests can still see the thank-you and everyone's photos. Every plan has every feature.">
      <Choices
        label="How long should the page stay online after the event?"
        value={d.plan}
        columns="grid-cols-1 sm:grid-cols-2"
        onChange={(k) => update(set("plan", k))}
        options={plansFor(d.scale).map((p) => {
          const q = quote(p.key, n);
          return {
            key: p.key,
            label: <span>{p.fromPublish ? `${p.duration} from publishing` : `${p.duration} after`} <span className="font-normal text-muted">· {p.name}</span></span>,
            line: (
              <span className="grid gap-0.5">
                <span>Up to {p.guestLimit} people{q.packs ? `; you need ${q.packs} extra pack${q.packs > 1 ? "s" : ""} (+${q.packs * (p.packSize ?? 0)} people)` : ""}</span>
                <span>{p.bestFor}</span>
              </span>
            ),
            badge: (
              <span className="mt-1 font-display text-2xl font-extrabold text-brand">
                {formatPence(q.totalPence)}
                {q.packs > 0 && <span className="ml-2 align-middle text-sm font-semibold text-muted">{formatPence(p.pricePence)} + {formatPence(q.packsPence)}</span>}
              </span>
            ),
          };
        })}
      />
      <p className="text-[15px] text-muted">More people any time: +100 for £3. Nothing is paid until you publish.</p>
    </Group>
  );
}

function CommunityPrice() {
  return (
    <Group icon="coins" title="What it costs" line="No upfront cost. No guesswork. No cash flow needed.">
      <ul className="grid gap-2 text-[16px]">
        <li><strong>Free to set up</strong>, with every organiser tool.</li>
        <li><strong>4% + 30p</strong> on each online order, only when money comes in. Card costs included.</li>
        <li><strong>Nothing</strong> on cash on the day, or on free events.</li>
        <li>The page stays up 90 days after the event.</li>
      </ul>
    </Group>
  );
}

// ───────────────────────────── 4. The words ─────────────────────────────

type WriteState = { busy: boolean; error: string | null; trimmed: string[]; done: boolean };

export function StepWords({ d, update, session, askSignIn }: StepProps) {
  const [w, setW] = useState<WriteState>({ busy: false, error: null, trimmed: [], done: false });
  const main = language(d.languages[0]) ?? LANGUAGES[0];
  const second = language(d.languages[1]);

  async function writeForMe() {
    // The token is read fresh, so this also works straight after signing in.
    const { data: auth } = await supabase().auth.getSession();
    const token = auth.session?.access_token;
    if (!token) {
      askSignIn("Sign in (free) and the AI will write your words straight away.", () => void writeForMe());
      return;
    }
    setW({ busy: true, error: null, trimmed: [], done: false });
    const body = copyRequest(d);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<CopyResponse> & { error?: string };
      if (!res.ok) {
        setW({ busy: false, trimmed: [], done: false, error: res.status === 503
          ? "The AI writer isn't switched on yet. You can type your own words below for now."
          : data.error ?? "Something went wrong. Please try again." });
        return;
      }
      update((x) => ({
        ...x,
        copy: Object.fromEntries(COPY_KEYS.map((k) => [k, data[k] ?? ""])) as Draft["copy"],
        translation: data.translation ? { ...x.translation, ...data.translation } : x.translation,
      }));
      setW({ busy: false, error: null, done: true, trimmed: res.headers.get("X-Copy-Trimmed")?.split(",").filter(Boolean) ?? [] });
    } catch {
      setW({ busy: false, trimmed: [], done: false, error: "Couldn't reach in2min2. Check your signal and try again." });
    }
  }
  const languagesText = second ? `${main.name} and ${second.name}` : main.name;

  return (
    <div className="grid gap-6">
      <section aria-labelledby="ai-title"
        className="relative grid gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-brand to-[#5A4CB0] p-5 text-white shadow-[0_18px_40px_-20px_rgba(46,42,110,0.9)] sm:p-6">
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-marigold/30 blur-2xl" />
        <div className="relative grid gap-1.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink">
            <Sparkle /> AI writer
          </span>
          <h2 id="ai-title" className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">Let AI write it for you</h2>
          <p className="text-[16px] leading-snug text-white/90">
            All five boxes below, in <strong className="text-white">{languagesText}</strong>, in about ten seconds. You check and change every word before it goes live.
          </p>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-3 [&_label]:text-white">
          <Field id="lang-main" label="Main language">
            <select id="lang-main" className={inputClass} value={main.code}
              onChange={(e) => update((x) => ({ ...x, languages: [e.target.value, ...x.languages.slice(1).filter((c) => c !== e.target.value)] }))}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}{l.ready ? "" : " (beta)"}</option>)}
            </select>
          </Field>
          <Field id="lang-second" label="Second language">
            <select id="lang-second" className={inputClass} value={second?.code ?? ""}
              onChange={(e) => update((x) => ({ ...x, languages: e.target.value ? [x.languages[0], e.target.value] : [x.languages[0]] }))}>
              <option value="">None</option>
              {LANGUAGES.filter((l) => l.code !== main.code).map((l) => <option key={l.code} value={l.code}>{l.name}{l.ready ? "" : " (beta)"}</option>)}
            </select>
          </Field>
          <Field id="tone" label="Tone">
            <select id="tone" className={inputClass} value={d.tone} onChange={(e) => update(set("tone", e.target.value))}>
              {TONES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
        </div>
        {[main, second].some((l) => l && !l.ready) && (
          <p className="relative rounded-2xl bg-white/12 px-4 py-3 text-[15px] leading-snug">
            Beta language: the AI writes it well, but please ask a native speaker to read it before you publish.
          </p>
        )}
        <button type="button" onClick={() => void writeForMe()} disabled={w.busy}
          className="relative inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-marigold px-7 text-lg font-extrabold text-ink shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)] transition hover:brightness-105 disabled:opacity-70 sm:w-auto sm:justify-self-start">
          <Sparkle />
          {w.busy ? "Writing your words…" : session ? (w.done ? "Write it again" : "Write it for me") : "Sign in and write it for me"}
        </button>
        <p className="relative text-sm text-white/80">
          {session ? "Free, up to 20 times a day." : "Signing in is free and takes a minute. Or type your own words below."}
        </p>
        {w.error && <Notice tone="warn">{w.error}</Notice>}
        {w.done && !w.error && <Notice>Done! Read every word below and change anything you like.</Notice>}
        {w.trimmed.length > 0 && <Notice>Some boxes were a little long, so they were shortened to fit. Check them below.</Notice>}
      </section>

      <div className="grid gap-5">
        <div className="grid gap-1">
          <h2 className="font-display text-xl font-bold text-brand">Your words</h2>
          <p className="text-[15px] text-muted">Type your own, or edit what the AI wrote. You approve every word before it goes live.</p>
        </div>
        {COPY_KEYS.map((key) => (
          <CopyBox key={key} id={key} d={d} update={update} secondName={second?.name} secondCode={second?.code} />
        ))}
      </div>
    </div>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5zM19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
    </svg>
  );
}

function CopyBox({ id, d, update, secondName, secondCode }: {
  id: CopyKey; d: Draft; update: StepProps["update"]; secondName?: string; secondCode?: string;
}) {
  const f = COPY_FIELDS[id];
  const long = id !== "card_headline";
  const clip = (v: string) => Array.from(v).slice(0, f.max).join("");
  const box = (which: "copy" | "translation", lang?: string) => {
    const value = d[which][id];
    const props = {
      id: `${which}-${id}`,
      className: inputClass,
      value,
      lang,
      onChange: (e: { target: { value: string } }) => update((x) => ({ ...x, [which]: { ...x[which], [id]: clip(e.target.value) } })),
    };
    return long ? <textarea rows={id === "landing_page_story" ? 6 : 3} {...props} /> : <input {...props} />;
  };
  return (
    <div className="grid gap-3 rounded-3xl border border-line bg-card/70 p-4">
      <Field id={`copy-${id}`} label={f.label} hint={f.hint} aside={`${charCount(d.copy[id])}/${f.max}`}>
        {box("copy", d.languages[0])}
      </Field>
      {secondName && (
        <Field id={`translation-${id}`} label={<span className="font-normal text-muted">In {secondName}</span>} aside={`${charCount(d.translation[id])}/${f.max}`}>
          {box("translation", secondCode)}
        </Field>
      )}
    </div>
  );
}

// ───────────────────────────── 5. The look ─────────────────────────────
// Like browsing a high street: suggestions for this kind of event first, then
// everything else. Every choice is shown on the host's own card.

export function StepLook({ d, update, now }: StepProps) {
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [allBorders, setAllBorders] = useState(false);
  const data = toViewData(d);
  const t = eventType(d.eventType);
  const suggested = t?.borders ?? ["none"];
  const shownBorders = allBorders ? BORDERS : BORDERS.filter((b) => suggested.includes(b.key) || b.key === d.border)
    .sort((a, b) => suggested.indexOf(a.key) - suggested.indexOf(b.key));
  const scriptSample = d.languages.map((c) => language(c)?.sample).find((x) => x && x !== "Aa" && x !== "Ąa");

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const r = await resizePhoto(file);
      // A landscape photo fills the space; a square or tall one (a logo, a
      // poster) is shown whole. The host can change it below.
      const fit: CoverFit = r.width / r.height >= 1.25 ? "fill" : "whole";
      update((x) => ({ ...x, cover: r.url, coverFit: fit }));
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "That photo couldn't be used. Try another.");
    } finally {
      setPhotoBusy(false);
    }
  }

  // Up to four more photos for the top of the page (0007). Kept a little
  // smaller than the main one, so the draft fits in the phone's storage.
  const more = d.moreCovers ?? [];
  const room = MAX_SHOWCASE - 1 - more.length;
  async function addMore(files: FileList | null) {
    const list = Array.from(files ?? []).slice(0, room);
    if (!list.length) return;
    setPhotoBusy(true);
    setPhotoError(null);
    const urls: string[] = [];
    for (const f of list) {
      try { urls.push((await resizePhoto(f, 1080, 0.75)).url); }
      catch { setPhotoError("One photo couldn't be used. Try another."); }
    }
    update((x) => ({ ...x, moreCovers: [...(x.moreCovers ?? []), ...urls].slice(0, MAX_SHOWCASE - 1) }));
    setPhotoBusy(false);
  }
  const makeMain = (i: number) => update((x) => {
    if (!x.cover) return x;
    const rest = [...(x.moreCovers ?? [])];
    const [picked] = rest.splice(i, 1, x.cover);
    return { ...x, cover: picked, moreCovers: rest };
  });

  return (
    <div className="grid gap-6">
      <Group icon="camera" title="Photos at the top" line="Your main photo, and up to four more that take turns. Each is made smaller on your phone, and its hidden location data is removed.">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-brand px-6 py-3 font-bold text-white hover:bg-brand-deep">
            {photoBusy ? "Preparing…" : d.cover ? "Change photo" : "Choose a photo"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {d.cover && <Button kind="quiet" onClick={() => update((x) => {
            const [next, ...rest] = x.moreCovers ?? [];
            return { ...x, cover: next ?? null, moreCovers: rest };
          })}>Remove photo</Button>}
        </div>
        {photoError && <Notice tone="warn">{photoError}</Notice>}
        {d.cover && (
          <div className="grid gap-2">
            <p className="font-semibold">More photos <span className="font-normal text-muted">({more.length} of {MAX_SHOWCASE - 1})</span></p>
            <div className="flex flex-wrap gap-2">
              {more.map((src, i) => (
                <div key={i} className="grid w-24 gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local data: URL */}
                  <img src={src} alt={`Photo ${i + 2}`} className="aspect-square w-24 rounded-xl border border-line object-cover" />
                  <div className="flex gap-1">
                    <button type="button" className="min-h-9 flex-1 rounded-full bg-wash text-xs font-bold hover:bg-line" onClick={() => makeMain(i)}>Make main</button>
                    <button type="button" aria-label={`Remove photo ${i + 2}`} className="grid size-9 place-items-center rounded-full bg-wash hover:bg-line"
                      onClick={() => update((x) => ({ ...x, moreCovers: (x.moreCovers ?? []).filter((_, j) => j !== i) }))}>
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {room > 0 && (
                <label className="grid aspect-square w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line text-center text-sm font-bold text-brand hover:bg-wash">
                  <span>+ Add<br />photos</span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void addMore(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
            {more.length > 0 && d.photoStyle === "polaroid" && (
              <p className="text-[15px] text-muted">With the Polaroids photo style, your first three photos show as a still stack.</p>
            )}
            {more.length > 0 && d.photoStyle !== "polaroid" && (
              <>
                <p className="font-semibold">How they change</p>
                <Choices<HeroMotion> label="How the photos change" value={d.heroMotion ?? "zoomin"} columns="grid-cols-1 sm:grid-cols-3"
                  onChange={(k) => update(set("heroMotion", k))}
                  options={HERO_MOTIONS.map((m) => ({ key: m.key, label: m.name, line: m.line }))} />
                {!d.motion && <Notice tone="warn">Turn on <strong>Gentle movement</strong> below to show them all. Until then, only the main photo shows.</Notice>}
              </>
            )}
          </div>
        )}
        {d.cover && (
          <div className="grid gap-2">
            <p className="font-semibold">How should they fit?</p>
            <Choices<CoverFit> label="How the photo fits" value={d.coverFit} columns="grid-cols-1 sm:grid-cols-2"
              onChange={(k) => update(set("coverFit", k))}
              options={COVER_FITS.map((f) => ({ key: f.key, label: f.name, line: f.line }))} />
          </div>
        )}
      </Group>

      <Group icon="frame" title="Border" line={allBorders ? "All borders. Each one takes your colours." : `Suggested for ${t ? t.label.toLowerCase() : "your event"}. Each one takes your colours.`}>
        <div role="radiogroup" aria-label="Border" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shownBorders.map((b) => (
            <Tile key={b.key} tag={b.tag} on={d.border === b.key} onClick={() => update(set("border", b.key))} label={b.name} line={b.line}>
              <span className="pointer-events-none block overflow-hidden rounded-lg" aria-hidden="true">
                <EventView data={{ ...data, border: b.key }} view="card" now={now} thumb />
              </span>
            </Tile>
          ))}
        </div>
        <Button kind="ghost" onClick={() => setAllBorders((v) => !v)} className="justify-self-start">
          {allBorders ? "Show only the suggestions" : `Show all ${BORDERS.length} borders`}
        </Button>
      </Group>

      <Group icon="palette" title="Colours" line="Every set is checked so the words stay easy to read.">
        {PALETTE_FAMILIES.map((family) => (
          <div key={family} className="grid gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">{family === "in2min2" ? "in2min2 colours" : family}</h3>
            <div role="radiogroup" aria-label={`${family} colours`} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PALETTES.filter((p) => p.family === family).map((p) => (
                <Tile key={p.key} tag={p.tag} on={d.palette === p.key} onClick={() => update(set("palette", p.key))} label={p.name}>
                  <Swatch p={p} />
                </Tile>
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Your own</h3>
          <label className={`grid cursor-pointer gap-2 rounded-2xl border-2 p-3 transition sm:max-w-[33%] ${d.palette === "custom" ? "border-brand bg-card" : "border-line bg-card/80"}`}>
            <span className="relative flex h-10 overflow-hidden rounded-lg" style={{ background: d.customColor }}>
              <input type="color" value={d.customColor} aria-label="Your own colour" className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={(e) => update((x) => ({ ...x, customColor: e.target.value, palette: "custom" }))}
                onClick={() => update(set("palette", "custom"))} />
            </span>
            <span className="font-semibold leading-tight">Your own colour</span>
            <span className="text-xs font-bold text-muted">Text colour picked for you</span>
          </label>
        </div>
      </Group>

      <Group icon="type" title="Text style" line="Each style has matching letters for Nepali, Hindi, Punjabi, Gujarati, Bengali and Tamil.">
        <div role="radiogroup" aria-label="Text style" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEXT_STYLES.map((ts) => (
            <Tile key={ts.key} on={d.textStyle === ts.key} onClick={() => update(set("textStyle", ts.key))} label={ts.name} line={ts.feel}>
              <span className="block truncate text-[26px] leading-tight text-brand" style={{ fontFamily: ts.display, fontStyle: ts.key === "elegant" ? "italic" : undefined, textTransform: ts.key === "bold" ? "uppercase" : undefined }} aria-hidden="true">
                {(d.title || t?.label || "Our event").slice(0, 28)}
              </span>
              <span className="block text-xl leading-tight text-ink" style={{ fontFamily: ts.display }} aria-hidden="true">
                Aa {scriptSample ?? "अ"}
              </span>
            </Tile>
          ))}
        </div>
      </Group>

      <Group icon="layout" title="Layout">
        <div role="radiogroup" aria-label="Layout" className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((tp) => (
            <Tile key={tp.key} on={d.template === tp.key} onClick={() => update(set("template", tp.key))} label={tp.name} line={tp.line}>
              <span className="pointer-events-none block h-44 overflow-hidden rounded-lg" aria-hidden="true">
                <EventView data={{ ...data, template: tp.key }} view="page" now={now} thumb />
              </span>
            </Tile>
          ))}
        </div>
      </Group>

      <Group icon="image" title="Photo style">
        <Choices<PhotoStyle>
          label="Photo style"
          value={d.photoStyle}
          columns="grid-cols-2"
          onChange={(k) => update(set("photoStyle", k))}
          options={PHOTO_STYLES.map((p) => ({ key: p.key, label: p.name, line: p.line, visual: <PhotoShape kind={p.key} /> }))}
        />
      </Group>

      <Switch id="motion" checked={d.motion} onChange={(v) => update(set("motion", v))} label="Gentle movement"
        line="A slow zoom on the photo and a few small moments. People who switch movement off on their phone never see it." />

      {d.motion && !eventType(d.eventType)?.sensitive && (
        <Group icon="sparkle" title="Moving effect" line="Falls gently over the top of the page for about half a minute, then stops. Open the full-screen preview to see it.">
          <Choices<EffectKey>
            label="Moving effect"
            value={d.effect}
            columns="grid-cols-2 sm:grid-cols-3"
            onChange={(k) => update(set("effect", k))}
            options={EFFECTS.map((f) => ({ key: f.key, label: f.name, line: f.line }))}
          />
        </Group>
      )}
    </div>
  );
}

function Tile({ on, onClick, label, line, tag, children }: { on: boolean; onClick: () => void; label: string; line?: string; tag?: Tag; children: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`relative grid content-start gap-2 rounded-2xl border-2 p-2.5 text-left transition ${on ? "border-brand bg-card shadow-[0_6px_18px_-10px_rgba(46,42,110,0.6)]" : "border-line bg-card/80 hover:border-brand/40"}`}>
      <Badge tag={tag} className="absolute left-1.5 top-1.5 z-10 shadow" />
      {children}
      <span className="flex items-start justify-between gap-2 px-0.5">
        <span className="font-semibold leading-tight">{label}</span>
        {on && <Tick />}
      </span>
      {line && <span className="px-0.5 text-sm leading-snug text-muted">{line}</span>}
    </button>
  );
}

function Swatch({ p }: { p: Palette }) {
  return (
    <span className="grid h-12 grid-cols-[2fr_1fr] overflow-hidden rounded-lg ring-1 ring-black/10" aria-hidden="true">
      <span className="flex" style={p.gradient ? { background: p.gradient } : undefined}>
        {!p.gradient && [p.main, p.accent, p.soft].map((c, i) => <i key={i} className="flex-1" style={{ background: c }} />)}
      </span>
      <span className="grid place-items-center font-display text-lg font-bold" style={{ background: p.bg, color: p.main }}>Aa</span>
    </span>
  );
}

function PhotoShape({ kind }: { kind: PhotoStyle }) {
  const box = "bg-brand/25";
  return (
    <span className="flex h-16 items-center justify-center rounded-xl bg-wash" aria-hidden="true">
      {kind === "hero" && <span className={`h-10 w-24 rounded-md ${box}`} />}
      {kind === "arch" && <span className={`h-12 w-9 rounded-t-full rounded-b-md ${box}`} />}
      {kind === "heart" && (
        <svg viewBox="0 0 100 92" className="h-11 w-12 fill-brand/25" aria-hidden="true">
          <path d="M50 89C47 87 4 62 2.4 31.5 1.4 13.5 13.6 2 28.8 2 39.6 2 46.4 8.4 50 15.6 53.6 8.4 60.4 2 71.2 2 86.4 2 98.6 13.5 97.6 31.5 96 62 53 87 50 89Z" />
        </svg>
      )}
      {kind === "polaroid" && (
        <span className="relative h-12 w-12">
          <span className="absolute inset-0 -rotate-12 rounded-sm bg-white p-1 pb-3 shadow"><span className={`block size-full ${box}`} /></span>
          <span className="absolute inset-0 rotate-6 rounded-sm bg-white p-1 pb-3 shadow"><span className={`block size-full ${box}`} /></span>
        </span>
      )}
      {kind === "split" && (
        <span className="flex h-10 w-24 gap-1.5">
          <span className={`flex-1 rounded-md ${box}`} />
          <span className="grid flex-1 content-center gap-1"><i className="h-1.5 rounded bg-brand/60" /><i className="h-1.5 w-2/3 rounded bg-brand/30" /></span>
        </span>
      )}
    </span>
  );
}

// ───────────────────────────── 6. Switches ─────────────────────────────

export function StepSwitches({ d, update }: StepProps) {
  const list = TOGGLES.filter((t) => t.scales.includes(d.scale));
  return (
    <div className="grid gap-3">
      <p className="text-[15px] text-muted">Only the switches for your kind of event. Change them any time, even after publishing.</p>
      {list.map((t) => (
        <Switch key={t.key} id={`toggle-${t.key}`} checked={d.toggles[t.key]} label={t.label} line={t.line}
          badge={t.later ? <Soon when={t.later} /> : undefined}
          onChange={(v) => update((x) => ({ ...x, toggles: { ...x.toggles, [t.key]: v } }))} />
      ))}
      <Switch id="private" checked={d.isPrivate} onChange={(v) => update(set("isPrivate", v))} label="Private event"
        line="Only guests with their own personal link can open the page." />
    </div>
  );
}

// ───────────────────────────── 7. Check and publish ─────────────────────────────

export function StepPublish({ d, update, session, askSignIn, say, onPreview, onStartAgain, goTo, replies, openReplies, photos, openPhotos }: StepProps & {
  onPreview: (view: "card" | "page" | "live" | "after") => void; onStartAgain: () => void; goTo: (step: number) => void;
  replies: RepliesState; openReplies: () => void; photos: PhotosState; openPhotos: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [pub, setPub] = useState<{ busy: boolean; error: string | null; offer: string | null; done: boolean }>({ busy: false, error: null, offer: null, done: false });
  const t = eventType(d.eventType);
  const slug = d.slug || slugify(d.title || d.stars.names);
  const community = d.scale === "community";
  const p = plan(d.plan);
  const q = quote(d.plan, people(d));

  const missing = missingForPublish(d);

  async function publish() {
    setPub({ busy: true, error: null, offer: null, done: false });
    const r = await publishDraft(supabase(), d);
    if (!r.ok) {
      setPub({ busy: false, error: r.message, offer: null, done: false });
      return;
    }
    // The main photo and the picture WhatsApp shows (0005). If this fails the
    // page is still published; it just shows initials and no picture.
    const m = await saveMedia(supabase(), { ...d, eventId: r.eventId }, r.eventId).catch((e: unknown) => ({ ok: false as const, message: String(e) }));
    update((x) => {
      // Keep the published web address, so changing the name later never breaks links already shared.
      const next = {
        ...x, slug: x.slug || r.path.split("/")[2] || "", eventId: r.eventId, publishedPath: r.path, shortPath: r.shortPath, offerClaimed: x.offerClaimed || !!r.offer?.ok,
        ...(m.ok ? { coverKey: m.coverKey, shareKey: m.shareKey, mediaHash: m.mediaHash, heroKeys: m.heroKeys, heroHash: m.heroHash } : {}),
      };
      return { ...next, publishedHash: fingerprint(next) };
    });
    const photoNote = !m.ok
      ? `Your page is published, but the photo and the WhatsApp preview picture couldn't be saved yet. Press "Update my page" to try again. (Details for Claude Code: ${m.message})`
      : m.heroNote ? `Your page is published, but the extra photos at the top couldn't be saved yet. Press "Update my page" to try again. (Details for Claude Code: ${m.heroNote})` : null;
    setPub({ busy: false, error: null, offer: [r.offer?.message, photoNote].filter(Boolean).join(" ") || null, done: true });
  }

  const ready = missing.length === 0 && d.checked;
  const link = eventLink(d);
  const changed = unpublishedChanges(d);

  return (
    <div className="grid gap-6">
      {link && (
        <Group icon="check" title={pub.done ? "Published!" : "Your event is live"} line="Your links, and a ready-made message for each moment.">
          {pub.offer && <Notice>{pub.offer}</Notice>}
          {changed
            ? <Notice tone="warn">You&apos;ve changed things since publishing. Press &ldquo;Update my page&rdquo; below to put them live; the link stays the same.</Notice>
            : <p className="text-[15px] text-muted">Change anything, then press &ldquo;Update my page&rdquo; below; the link stays the same.</p>}
          <ShareLinks d={d} say={say} link={link} />
        </Group>
      )}

      {d.eventId && d.toggles.rsvp && (
        <Group icon="envelope" title="Guests' replies" line="Every reply, with its message. New ones also show on the bell at the top.">
          {replies.rows ? (() => {
            const t = totals(replies.rows);
            return (
              <p className="text-lg"><strong className="text-brand">{t.coming}</strong> coming · <strong>{t.maybe}</strong> maybe · <strong>{t.cant}</strong> can&apos;t come
                {t.waiting ? <> · <strong>{t.waiting}</strong> waiting</> : null}</p>
            );
          })() : <p className="text-[15px] text-muted">{session ? "Loading…" : "Sign in to see who has replied."}</p>}
          <Button kind="main" onClick={session ? openReplies : () => askSignIn("Sign in to see your guests' replies.")}>See replies</Button>
        </Group>
      )}

      {d.eventId && d.toggles.photo_wall && (
        <Group icon="images" title="Guests' photos" line="Guests add photos from their phones, with no app. Show them on a TV, and print table cards with a QR code.">
          {photos.rows ? (
            <p className="text-lg"><strong className="text-brand">{photos.rows.filter((p) => p.status === "shown").length}</strong> on the wall
              {photos.needsYou ? <> · <strong>{photos.needsYou}</strong> {photos.needsYou === 1 ? "needs" : "need"} you</> : null}</p>
          ) : <p className="text-[15px] text-muted">{session ? (photos.notReady ? "Photos switch on once database file 0006 has been run." : "Loading…") : "Sign in to see guests' photos."}</p>}
          <Button kind="main" onClick={session ? openPhotos : () => askSignIn("Sign in to see your guests' photos.")}>Photos, TV slideshow and table cards</Button>
        </Group>
      )}

      <Group icon="eye" title="See it as guests will" line="Tap to open full-screen.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["card", "Invitation card"], ["page", "Event page"], ["live", "On the day"], ["after", "After the event"]] as const).map(([v, label]) => (
            <Button key={v} kind="quiet" onClick={() => onPreview(v)}>{label}</Button>
          ))}
        </div>
      </Group>

      <Group icon="link" title="Web address">
        <Field id="slug" label={<span>in2min2.com/{t?.key ?? "event"}/<strong className="text-brand">{slug || "…"}</strong></span>}
          hint="Small letters, numbers and hyphens. You can't change it once it's shared, so check it now.">
          <input id="slug" className={inputClass} value={d.slug} placeholder={slugify(d.title || d.stars.names) || "our-event"} maxLength={60}
            onChange={(e) => update(set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-")))} />
        </Field>
      </Group>

      <Group icon="tag" title="Price">
        {community ? (
          <p>Free to set up. 4% + 30p on each online order; nothing on cash or free events. Online sales open in February.</p>
        ) : (
          <div className="grid gap-1">
            <p className="flex items-baseline justify-between gap-4">
              <span>{p.name}: {onlineWords(p)}, up to {p.guestLimit} people</span>
              <strong className="tabular-nums">{formatPence(p.pricePence)}</strong>
            </p>
            {q.packs > 0 && (
              <p className="flex items-baseline justify-between gap-4">
                <span>{q.packs} × 100 more people</span>
                <strong className="tabular-nums">{formatPence(q.packsPence)}</strong>
              </p>
            )}
            <p className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-2 text-lg">
              <span className="font-bold">Total</span>
              <strong className="font-display text-2xl text-brand tabular-nums">{formatPence(q.totalPence)}</strong>
            </p>
          </div>
        )}
        {!community && (
          <Notice>
            Paying for a plan opens in February. Until then, a published page is on the free plan: online 90 days after the event,
            up to 300 people. With the code <strong>LAUNCH50</strong> the first 50 families get a free Keepsake (12 months).
          </Notice>
        )}
        {!community && (
          <Field id="offer" label="Have a code?" hint="For example LAUNCH50: a free Keepsake for the first 50 families. Checked when you publish.">
            <input id="offer" className={inputClass} value={d.offerCode} maxLength={20} placeholder="LAUNCH50"
              onChange={(e) => update(set("offerCode", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")))} />
          </Field>
        )}
      </Group>

      <Group icon="shield" title="Before you publish">
        {missing.length > 0 ? (
          <div className="grid gap-2">
            <p className="font-semibold">Still needed:</p>
            <ul className="grid gap-2">
              {missing.map((m) => (
                <li key={m.text}>
                  <button type="button" onClick={() => goTo(m.step)} className="font-semibold text-brand underline underline-offset-4">{m.text}</button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="font-semibold text-brand">Everything needed is filled in.</p>
        )}
        <label className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
          <input type="checkbox" className="mt-1 size-6 accent-[#2E2A6E]" checked={d.checked} onChange={(e) => update(set("checked", e.target.checked))} />
          <span>I&apos;ve checked the names, date, venue and numbers, and every word in every language.</span>
        </label>
        {session ? (
          <>
            <Button kind="main" disabled={!ready || pub.busy} onClick={publish} className="w-full">
              {pub.busy ? "Publishing…" : d.eventId ? "Update my page" : "Publish"}
            </Button>
            {!ready && <p className="text-[15px] text-muted">Fill in what&apos;s still needed and tick the box to publish.</p>}
          </>
        ) : (
          <Button kind="main" className="w-full" onClick={() => askSignIn("Sign in to publish. It's free, and it keeps your event safe in your account.")}>
            Sign in to publish
          </Button>
        )}
        {pub.error && <Notice tone="warn">{pub.error}</Notice>}
        <p className="text-[15px] text-muted">The main photo shows in your preview; adding it to the live page comes with photo storage in January.</p>
      </Group>

      <div className="grid gap-3">
        {!confirmReset ? (
          <Button kind="quiet" onClick={() => setConfirmReset(true)} className="justify-self-start">Start again</Button>
        ) : (
          <div className="grid gap-3 rounded-2xl border-2 border-marigold bg-card p-4">
            <p className="font-semibold">Start again? This clears everything on this phone, including the photo.</p>
            <div className="flex flex-wrap gap-3">
              <Button kind="brand" onClick={() => { setConfirmReset(false); onStartAgain(); }}>Yes, clear it</Button>
              <Button kind="quiet" onClick={() => setConfirmReset(false)}>Keep my event</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
