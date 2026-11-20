"use client";

// When, where and how many: quick choices for the usual dates, times,
// places, parking and numbers for this kind of event, and a box for anything else.

import { useState } from "react";
import { charCount } from "@/lib/ai/copy";
import { PARKING_OPTIONS, type Parking } from "@/lib/catalog";
import { people } from "@/lib/draft";
import { formatDate, formatTime } from "@/lib/event-view";
import { useB2 } from "../context";
import { addMinutes, dateChips, dateLine, kindOf } from "../kinds";
import { PanelShell } from "../panels";
import { time12, venueValue } from "../quick";
import { Chips, Field, Needed, Note, Section, useNeed } from "../ui";

const HEADCOUNTS = { personal: [20, 50, 100, 150, 200], celebration: [50, 100, 200, 300, 500], community: [100, 250, 500, 1000, 2000] } as const;
const num = (v: string) => (v ? Math.min(100000, Math.max(0, Math.floor(+v))) : null);

export function DetailsPanel() {
  const { d, update, flagMissing } = useB2();
  const need = useNeed(flagMissing);
  const k = kindOf(d.eventType);
  const [today] = useState(() => new Date());
  const dates = dateChips(d.eventType, today);
  const ends = d.startTime ? k.hours.map((h) => addMinutes(d.startTime, h * 60).time) : [];
  const n = people(d);
  const community = d.scale === "community";
  const over = d.venueCapacity !== null && n > d.venueCapacity;
  return (
    <PanelShell peek icon="calendar" title="When and where" line="Tap a quick choice, or type your own.">
      <Section icon="calendar" title="When">
        <div className="b2-field">
          <span className="b2-label">The day</span>
          <Chips label="Quick dates" small value={dates.find((x) => x.date === d.date)?.date ?? null}
            options={dates.map((x) => ({ key: x.date, label: x.label, line: dateLine(x.label, x.date) }))} onChange={(v) => v && update((x) => ({ ...x, date: v }))} />
          <input className="b2-input b2-input-sm" type="date" aria-label="The date" {...need(!d.date)} value={d.date} onChange={(e) => update((x) => ({ ...x, date: e.target.value }))} />
          <Needed show={flagMissing && !d.date} />
        </div>
        <div className="b2-field">
          <span className="b2-label">Starts</span>
          <Chips label="Usual start times" small value={k.times.includes(d.startTime) ? d.startTime : null}
            options={k.times.map((v) => ({ key: v, label: time12(v) }))} onChange={(v) => v && update((x) => ({ ...x, startTime: v }))} />
          <input className="b2-input b2-input-sm" type="time" aria-label="Start time" {...need(!d.startTime)} value={d.startTime} onChange={(e) => update((x) => ({ ...x, startTime: e.target.value }))} />
          <Needed show={flagMissing && !d.startTime} />
        </div>
        <div className="b2-field">
          <span className="b2-label">Ends <span style={{ fontWeight: 500 }}>(if you like)</span></span>
          {ends.length > 0 && (
            <Chips label="Usual end times" small clear value={ends.includes(d.endTime) ? d.endTime : null}
              options={ends.map((v, i) => ({ key: v, label: `${time12(v)} (${k.hours[i]} hours)` }))} onChange={(v) => update((x) => ({ ...x, endTime: v ?? "" }))} />
          )}
          <input className="b2-input b2-input-sm" type="time" aria-label="End time" value={d.endTime} onChange={(e) => update((x) => ({ ...x, endTime: e.target.value }))} />
        </div>
        {d.date && <p className="b2-small">Guests see: <strong style={{ color: "var(--b2-text)" }}>{formatDate(d.date)}{d.startTime ? `, ${formatTime(d.startTime)}` : ""}{d.endTime ? ` to ${formatTime(d.endTime)}` : ""}</strong></p>}
      </Section>

      <Section icon="pin" title="Where">
        <div className="b2-field">
          <span className="b2-label">The place</span>
          <Chips label="Popular places" small value={k.venues.map(venueValue).includes(d.venueName) ? d.venueName : null}
            options={k.venues.map((v) => ({ key: venueValue(v), label: v }))} onChange={(v) => v && update((x) => ({ ...x, venueName: v }))} />
          <input className="b2-input b2-input-sm" {...need(!d.venueName.trim())} value={d.venueName} maxLength={120} placeholder="The place's name" aria-label="The place's name"
            onChange={(e) => update((x) => ({ ...x, venueName: e.target.value }))} />
          <Needed show={flagMissing && !d.venueName.trim()} />
        </div>
        <Field label="Address and postcode" hint="Guests get a Directions button that opens maps on their phone.">
          <textarea className="b2-input b2-textarea" rows={2} value={d.venueAddress} maxLength={300} placeholder="Street, town and postcode"
            onChange={(e) => update((x) => ({ ...x, venueAddress: e.target.value }))} />
        </Field>
        <div className="b2-field">
          <span className="b2-label">Parking</span>
          <Chips label="Parking" small clear value={d.parking === "unknown" ? null : d.parking}
            options={PARKING_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
            onChange={(v) => update((x) => ({ ...x, parking: (v ?? "unknown") as Parking }))} />
          {d.parking !== "unknown" && (
            <input className="b2-input b2-input-sm" value={d.parkingNote} maxLength={140} aria-label="Parking note" placeholder="A note, e.g. 40 spaces behind the hall"
              onChange={(e) => update((x) => ({ ...x, parkingNote: e.target.value }))} />
          )}
          {d.parking !== "unknown" && d.parkingNote && <span className="b2-small">{charCount(d.parkingNote)}/140</span>}
        </div>
      </Section>

      <Section icon="people" title="How many people?" line="Count everyone, children too. It tells the venue and caterer what to expect.">
        <Chips label="About how many people?" small value={HEADCOUNTS[d.scale].includes(n as never) ? String(n) : null}
          options={HEADCOUNTS[d.scale].map((c) => ({ key: String(c), label: `About ${c.toLocaleString("en-GB")}` }))}
          onChange={(v) => update((x) => ({ ...x, expectedGuests: v ? Number(v) : null }))} />
        <input className="b2-input b2-input-sm" type="number" inputMode="numeric" min={1} max={100000} aria-label="About how many people"
          value={d.expectedGuests ?? ""} placeholder="Or type a number" onChange={(e) => update((x) => ({ ...x, expectedGuests: num(e.target.value) }))} />
        <Field label={community ? "The venue's safe capacity" : "The venue's safe capacity (if you know it)"} hint="Replies and tickets stop here, and a waiting list takes over.">
          <input className="b2-input b2-input-sm" type="number" inputMode="numeric" min={1} max={100000} value={d.venueCapacity ?? ""} placeholder="e.g. 250"
            onChange={(e) => update((x) => ({ ...x, venueCapacity: num(e.target.value) }))} />
        </Field>
        {over && <Note tone="warn">That’s more people than the venue holds safely. Check the number with the venue.</Note>}
      </Section>
    </PanelShell>
  );
}
