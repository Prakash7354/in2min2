"use client";

// The builder's seven screens (docs/CONCEPT.md, section 7). One question per
// screen; every change is saved straight away by the parent.

import { useState, type ReactNode } from "react";
import { COPY_FIELDS, COPY_KEYS, charCount, type CopyKey, type CopyResponse } from "@/lib/ai/copy";
import {
  EVENT_TYPES, LANGUAGES, ORGANISER_TYPES, PALETTES, PARKING_OPTIONS, PHOTO_STYLES, SCALES, TEMPLATES, TEXT_STYLES,
  TOGGLES, TONES, eventType, formatPence, language, paletteFor, plan, plansFor, quote,
  type PhotoStyle, type Scale, type Template, type TextStyle,
} from "@/lib/catalog";
import { applyScale, applyType, people, slugify, slugOk, toViewData, type Draft } from "@/lib/draft";
import { formatDate, formatTime } from "@/lib/event-view";
import { resizePhoto } from "@/lib/image";
import EventView from "@/components/event/event-view";
import { Button, Choices, Field, Group, Notice, Soon, Switch, inputClass } from "./ui";

export type StepProps = { d: Draft; update: (fn: (d: Draft) => Draft) => void; now: number };

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
                <span className="absolute right-3 top-3 flex gap-1">
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
      {t && (
        <Group title={`This looks like ${SCALES[d.scale].label.toLowerCase()}`} line="This decides which switches you see. Change it if it doesn't fit.">
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
  mela: "Andover Mela 2027", sport: "Wessex Cup 2027", charity: "Walk for Nepal 2027", community: "Dashain gathering 2027",
  memorial: "Remembering Bhim Bahadur", corporate: "Annual dinner 2027",
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

      <Group title={t?.starLabel ?? "Who it's for"} line={community ? "What or who the event is for." : "The stars of the day. They come first on the card and the page."}>
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
    <Group title="Family to honour" line={sensitive ? "Shown as “With love from”. Optional." : "Parents, grandparents and close family, shown with pride as “With blessings from”. Optional."}>
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
    <Group title="Who's organising?" line="Shown on the page so people know who they're dealing with. Needed before a public event can be published.">
      <Field id="org-name" label="Organiser's name" aside={`${charCount(d.organiserName)}/120`}>
        <input id="org-name" className={inputClass} value={d.organiserName} maxLength={120} placeholder="Andover Gurkha Welfare Group"
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

const FUNCTION_SUGGESTIONS: Record<string, string[]> = {
  wedding: ["Mehndi", "Haldi", "Ceremony", "Reception", "Janti departure"],
  engagement: ["Tika", "Ring ceremony", "Dinner"],
  memorial: ["Funeral", "Prayers", "13th-day rites", "Remembrance meal"],
  sport: ["Opening ceremony", "Group games", "Semi-finals", "Final", "Prize-giving"],
  mela: ["Opening", "Cultural show", "Food stalls open", "Raffle draw"],
};

export function StepWhen({ d, update }: StepProps) {
  const community = d.scale === "community";
  const n = people(d);
  const overCapacity = d.venueCapacity !== null && n > d.venueCapacity;
  return (
    <div className="grid gap-6">
      <Group title="When">
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

      <Group title="Where">
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

      {d.scale !== "personal" && <Functions d={d} update={update} />}

      <Group title="How many people?" line="Count everyone, children too. It sets your price and tells the venue and caterer what to expect.">
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

function Functions({ d, update }: Pick<StepProps, "d" | "update">) {
  const suggestions = FUNCTION_SUGGESTIONS[d.eventType ?? ""] ?? ["Welcome", "Main event", "Dinner"];
  const edit = (i: number, key: "title" | "date" | "time" | "place", value: string) =>
    update((x) => ({ ...x, functions: x.functions.map((f, j) => (j === i ? { ...f, [key]: value } : f)) }));
  return (
    <Group title={d.scale === "community" ? "Programme" : "Functions"} line={d.scale === "community" ? "The main moments of the day, in order. Optional." : "Mehndi, ceremony, reception… each with its own time. Optional."}>
      <datalist id="function-names">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
      {d.functions.map((f, i) => (
        <div key={f.id} className="grid gap-3 rounded-2xl bg-wash/60 p-3 sm:grid-cols-2">
          <Field id={`fn-title-${i}`} label="What">
            <input id={`fn-title-${i}`} list="function-names" className={inputClass} value={f.title} maxLength={80} placeholder={suggestions[0]}
              onChange={(e) => edit(i, "title", e.target.value)} />
          </Field>
          <Field id={`fn-place-${i}`} label="Where (if different)">
            <input id={`fn-place-${i}`} className={inputClass} value={f.place} maxLength={120} onChange={(e) => edit(i, "place", e.target.value)} />
          </Field>
          <Field id={`fn-date-${i}`} label="Date">
            <input id={`fn-date-${i}`} type="date" className={inputClass} value={f.date} onChange={(e) => edit(i, "date", e.target.value)} />
          </Field>
          <Field id={`fn-time-${i}`} label="Time">
            <input id={`fn-time-${i}`} type="time" className={inputClass} value={f.time} onChange={(e) => edit(i, "time", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Button kind="quiet" onClick={() => update((x) => ({ ...x, functions: x.functions.filter((_, j) => j !== i) }))}>Remove</Button>
          </div>
        </div>
      ))}
      {d.functions.length < 8 && (
        <Button kind="ghost" onClick={() => {
          const id = Date.now().toString(36);
          update((x) => ({ ...x, functions: [...x.functions, { id, title: "", date: x.date, time: "", place: "" }] }));
        }}>
          {d.scale === "community" ? "Add to the programme" : "Add a function"}
        </Button>
      )}
    </Group>
  );
}

function PlanPicker({ d, update }: Pick<StepProps, "d" | "update">) {
  const n = people(d);
  return (
    <Group title="How long should the page stay online?" line="After the event, guests can still see the thank-you and everyone's photos. Every plan has every feature.">
      <Choices
        label="How long should the page stay online after the event?"
        value={d.plan}
        columns="grid-cols-1 sm:grid-cols-2"
        onChange={(k) => update(set("plan", k))}
        options={plansFor(d.scale).map((p) => {
          const q = quote(p.key, n);
          return {
            key: p.key,
            label: <span>{p.duration} after <span className="font-normal text-muted">· {p.name}</span></span>,
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
    <Group title="What it costs" line="No upfront cost. No guesswork. No cash flow needed.">
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

type WriteState = { busy: boolean; error: string | null; trimmed: string[] };

export function StepWords({ d, update }: StepProps) {
  const [w, setW] = useState<WriteState>({ busy: false, error: null, trimmed: [] });
  const main = language(d.languages[0]) ?? LANGUAGES[0];
  const second = language(d.languages[1]);
  const t = eventType(d.eventType);

  async function writeForMe() {
    setW({ busy: true, error: null, trimmed: [] });
    const fam = d.family.map((f) => [f.relation, f.names].filter(Boolean).join(": ")).filter(Boolean);
    const parking = PARKING_OPTIONS.find((p) => p.key === d.parking);
    const details = [
      d.stars.names && `${d.stars.relation || "For"}: ${d.stars.names}`,
      fam.length && `${t?.sensitive ? "With love from" : "With blessings from"} ${fam.join("; ")}`,
      parking && `Parking: ${parking.label}${d.parkingNote ? ` (${d.parkingNote})` : ""}`,
      d.functions.length && `Functions: ${d.functions.map((f) => [f.title, f.date && formatDate(f.date, false), f.time && formatTime(f.time)].filter(Boolean).join(" ")).join("; ")}`,
      d.scale === "community" && d.organiserName && `Organised by ${d.organiserName}`,
    ].filter(Boolean).join(". ");
    const body = {
      eventType: `${t?.label ?? "Event"}${t?.sensitive ? " (a funeral or memorial)" : ""}`.slice(0, 60),
      hostNames: [d.title, d.stars.names].filter(Boolean).join(" — ").slice(0, 120) || t?.label || "Our event",
      dateAndVenue: [d.date && formatDate(d.date), d.startTime && formatTime(d.startTime), d.venueName, d.venueAddress.split(/\n|,/)[0]]
        .filter(Boolean).join(", ").slice(0, 200) || "Date and venue to follow",
      languageMix: main.ai,
      tone: d.tone,
      secondLanguage: second?.ai,
      details: details.slice(0, 400) || undefined,
    };
    try {
      const res = await fetch("/api/generate-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as Partial<CopyResponse> & { error?: string };
      if (!res.ok) {
        setW({ busy: false, trimmed: [], error: res.status === 503
          ? "The AI writer isn't switched on yet: that's step 3 of the action plan (the Gemini key). You can type your own words below for now."
          : data.error ?? "Something went wrong. Please try again." });
        return;
      }
      update((x) => ({
        ...x,
        copy: Object.fromEntries(COPY_KEYS.map((k) => [k, data[k] ?? ""])) as Draft["copy"],
        translation: data.translation ? { ...x.translation, ...data.translation } : x.translation,
      }));
      setW({ busy: false, error: null, trimmed: res.headers.get("X-Copy-Trimmed")?.split(",").filter(Boolean) ?? [] });
    } catch {
      setW({ busy: false, trimmed: [], error: "Couldn't reach In2Min2. Check your signal and try again." });
    }
  }

  return (
    <div className="grid gap-6">
      <Group title="Languages" line="Up to two. Guests see both, one under the other.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="lang-main" label="Main language">
            <select id="lang-main" className={inputClass} value={main.code}
              onChange={(e) => update((x) => ({ ...x, languages: [e.target.value, ...x.languages.slice(1).filter((c) => c !== e.target.value)] }))}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}{l.ready ? "" : " (beta)"}</option>)}
            </select>
          </Field>
          <Field id="lang-second" label="Second language (optional)">
            <select id="lang-second" className={inputClass} value={second?.code ?? ""}
              onChange={(e) => update((x) => ({ ...x, languages: e.target.value ? [x.languages[0], e.target.value] : [x.languages[0]] }))}>
              <option value="">None</option>
              {LANGUAGES.filter((l) => l.code !== main.code).map((l) => <option key={l.code} value={l.code}>{l.name}{l.ready ? "" : " (beta)"}</option>)}
            </select>
          </Field>
        </div>
        {[main, second].some((l) => l && !l.ready) && (
          <Notice>Beta language: the AI writes it well, but please ask a native speaker to read it before you publish.</Notice>
        )}
        <Field id="tone" label="Tone">
          <select id="tone" className={inputClass} value={d.tone} onChange={(e) => update(set("tone", e.target.value))}>
            {TONES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Button kind="main" onClick={writeForMe} disabled={w.busy} className="w-full sm:w-auto">
          {w.busy ? "Writing…" : "Write it for me"}
        </Button>
        {w.error && <Notice tone="warn">{w.error}</Notice>}
        {w.trimmed.length > 0 && <Notice>Some boxes were a little long, so they were shortened to fit. Check them below.</Notice>}
      </Group>

      <div className="grid gap-5">
        <p className="text-[15px] text-muted">Edit anything. You approve every word before it goes live.</p>
        {COPY_KEYS.map((key) => (
          <CopyBox key={key} id={key} d={d} update={update} secondName={second?.name} secondCode={second?.code} />
        ))}
      </div>
    </div>
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

export function StepLook({ d, update, now }: StepProps) {
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const data = toViewData(d);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const url = await resizePhoto(file);
      update(set("cover", url));
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "That photo couldn't be used. Try another.");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Group title="Main photo" line="A photo of the stars, the venue or the team. It's made smaller on your phone, and its hidden location data is removed.">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-brand px-6 py-3 font-bold text-white hover:bg-brand-deep">
            {photoBusy ? "Preparing…" : d.cover ? "Change photo" : "Choose a photo"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {d.cover && <Button kind="quiet" onClick={() => update(set("cover", null))}>Remove photo</Button>}
        </div>
        {photoError && <Notice tone="warn">{photoError}</Notice>}
      </Group>

      <Group title="Template">
        <Choices<Template>
          label="Template"
          value={d.template}
          columns="grid-cols-2"
          onChange={(k) => update(set("template", k))}
          options={TEMPLATES.map((t) => ({
            key: t.key, label: t.name, line: t.line,
            visual: <Thumb><EventView data={{ ...data, template: t.key }} view="card" now={now} /></Thumb>,
          }))}
        />
      </Group>

      <Group title="Colours" line="Every set is checked so the words stay easy to read.">
        <div role="radiogroup" aria-label="Colours" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PALETTES.map((p) => {
            const on = d.palette === p.key;
            return (
              <button key={p.key} type="button" role="radio" aria-checked={on} onClick={() => update(set("palette", p.key))}
                className={`grid gap-2 rounded-2xl border-2 p-3 text-left transition ${on ? "border-brand bg-card" : "border-line bg-card/80 hover:border-brand/40"}`}>
                <span className="flex h-9 overflow-hidden rounded-lg" aria-hidden="true">
                  {[p.main, p.accent, p.soft, p.bg].map((c, i) => <i key={i} className="flex-1" style={{ background: c }} />)}
                </span>
                <span className="font-semibold leading-tight">{p.name}</span>
                {p.brand && <span className="text-xs font-bold text-muted">In2Min2 colours</span>}
              </button>
            );
          })}
          <label className={`grid cursor-pointer gap-2 rounded-2xl border-2 p-3 transition ${d.palette === "custom" ? "border-brand bg-card" : "border-line bg-card/80"}`}>
            <span className="relative flex h-9 overflow-hidden rounded-lg" style={{ background: d.customColor }}>
              <input type="color" value={d.customColor} aria-label="Your own colour" className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={(e) => update((x) => ({ ...x, customColor: e.target.value, palette: "custom" }))}
                onClick={() => update(set("palette", "custom"))} />
            </span>
            <span className="font-semibold leading-tight">Your own colour</span>
            <span className="text-xs font-bold text-muted">Text colour picked for you</span>
          </label>
        </div>
      </Group>

      <Group title="Text style">
        <Choices<TextStyle>
          label="Text style"
          value={d.textStyle}
          columns="grid-cols-2 sm:grid-cols-3"
          onChange={(k) => update(set("textStyle", k))}
          options={TEXT_STYLES.map((t) => ({
            key: t.key, label: t.name, line: t.feel,
            visual: <span className="text-3xl leading-none text-brand" style={{ fontFamily: t.display }} aria-hidden="true">Aa अ</span>,
          }))}
        />
      </Group>

      <Group title="Photo style">
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
    </div>
  );
}

function Thumb({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none block h-40 overflow-hidden rounded-xl" aria-hidden="true">
      {children}
    </span>
  );
}

function PhotoShape({ kind }: { kind: PhotoStyle }) {
  const box = "bg-rose";
  return (
    <span className="flex h-16 items-center justify-center rounded-xl bg-wash" aria-hidden="true">
      {kind === "hero" && <span className={`h-10 w-24 rounded-md ${box}`} />}
      {kind === "arch" && <span className={`h-12 w-9 rounded-t-full rounded-b-md ${box}`} />}
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

export function StepPublish({ d, update, onPreview, onStartAgain, goTo }: StepProps & {
  onPreview: (view: "card" | "page" | "live" | "after") => void; onStartAgain: () => void; goTo: (step: number) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const t = eventType(d.eventType);
  const slug = d.slug || slugify(d.title || d.stars.names);
  const community = d.scale === "community";
  const p = plan(d.plan);
  const q = quote(d.plan, people(d));

  const missing: { text: string; step: number }[] = [];
  if (!t) missing.push({ text: "What you're celebrating", step: 0 });
  if (!d.title.trim()) missing.push({ text: "The name of the event", step: 1 });
  if (community && !d.organiserName.trim()) missing.push({ text: "The organiser's name", step: 1 });
  if (community && !d.organiserType) missing.push({ text: "What kind of organiser", step: 1 });
  if (community && d.forProfit === null) missing.push({ text: "Whether anyone makes a profit", step: 1 });
  if (!d.date) missing.push({ text: "The date", step: 2 });
  if (!slugOk(slug)) missing.push({ text: "A web address (below)", step: 6 });

  return (
    <div className="grid gap-6">
      <Group title="See it as guests will" line="Tap to open full-screen.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["card", "Invitation card"], ["page", "Event page"], ["live", "On the day"], ["after", "After the event"]] as const).map(([v, label]) => (
            <Button key={v} kind="quiet" onClick={() => onPreview(v)}>{label}</Button>
          ))}
        </div>
      </Group>

      <Group title="Web address">
        <Field id="slug" label={<span>in2min2.com/{t?.key ?? "event"}/<strong className="text-brand">{slug || "…"}</strong></span>}
          hint="Small letters, numbers and hyphens. You can't change it once it's shared, so check it now.">
          <input id="slug" className={inputClass} value={d.slug} placeholder={slugify(d.title || d.stars.names) || "our-event"} maxLength={60}
            onChange={(e) => update(set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-")))} />
        </Field>
      </Group>

      <Group title="Price">
        {community ? (
          <p>Free to set up. 4% + 30p on each online order; nothing on cash or free events.</p>
        ) : (
          <div className="grid gap-1">
            <p className="flex items-baseline justify-between gap-4">
              <span>{p.name}: online {p.duration} after the event, up to {p.guestLimit} people</span>
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
          <Field id="offer" label="Have a code?" hint="For example LAUNCH50: a free Keepsake for the first 50 families. Checked when you publish.">
            <input id="offer" className={inputClass} value={d.offerCode} maxLength={20} placeholder="LAUNCH50"
              onChange={(e) => update(set("offerCode", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")))} />
          </Field>
        )}
      </Group>

      <Group title="Before you publish">
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
        <Button kind="main" disabled className="w-full">Publish</Button>
        <Notice>
          Publishing switches on as soon as In2Min2&apos;s database is connected (the Supabase step in your action plan).
          Until then, everything you do is saved on this phone and will be kept.
        </Notice>
      </Group>

      <div className="grid gap-3">
        {!confirmReset ? (
          <Button kind="quiet" onClick={() => setConfirmReset(true)} className="justify-self-start">Start again</Button>
        ) : (
          <div className="grid gap-3 rounded-2xl border-2 border-rose bg-card p-4">
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
