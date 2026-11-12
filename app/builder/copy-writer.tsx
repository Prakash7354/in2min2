"use client";

// The AI writing panel of the event builder. The host fills in a few facts,
// presses Generate, and the reply from /api/generate-copy lands in `copy`,
// one React state value per text box. Every box stays editable.

import { useState } from "react";
import { COPY_FIELDS, COPY_KEYS, charCount, type CopyRequest, type EventCopy } from "@/lib/ai/copy";

const EMPTY_COPY: EventCopy = {
  card_headline: "",
  card_invite_body: "",
  landing_page_story: "",
  guest_note_box: "",
  post_event_thank_you: "",
};

const EVENT_TYPES = ["Wedding", "Birthday", "Subha Pasni (rice feeding)", "Bratabandha", "Mela / festival", "Sports tournament", "Corporate event", "Party"];
const TONES = ["Warm and welcoming", "Formal and elegant", "Fun and playful", "Festive and joyful", "Sporty and energetic"];

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-base text-neutral-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-100";

export default function CopyWriter() {
  const [facts, setFacts] = useState<CopyRequest>({
    eventType: "",
    hostNames: "",
    dateAndVenue: "",
    languageMix: "English",
    tone: TONES[0],
  });
  const [copy, setCopy] = useState<EventCopy>(EMPTY_COPY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trimmed, setTrimmed] = useState<string[]>([]);

  const ready = facts.eventType.trim() && facts.hostNames.trim() && facts.dateAndVenue.trim();

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facts),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setCopy({ ...EMPTY_COPY, ...(data as EventCopy) });
      setTrimmed(res.headers.get("X-Copy-Trimmed")?.split(",").filter(Boolean) ?? []);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <form onSubmit={generate} className="space-y-4">
        <h2 className="text-lg font-semibold">1. The facts</h2>
        <Field label="Event type">
          <input
            className={inputClass}
            list="event-types"
            value={facts.eventType}
            onChange={(e) => setFacts({ ...facts, eventType: e.target.value })}
            placeholder="e.g. Wedding"
            maxLength={60}
            required
          />
          <datalist id="event-types">
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field label="Names">
          <input
            className={inputClass}
            value={facts.hostNames}
            onChange={(e) => setFacts({ ...facts, hostNames: e.target.value })}
            placeholder="e.g. James & Angeeta"
            maxLength={120}
            required
          />
        </Field>
        <Field label="Date and venue">
          <input
            className={inputClass}
            value={facts.dateAndVenue}
            onChange={(e) => setFacts({ ...facts, dateAndVenue: e.target.value })}
            placeholder="e.g. Saturday 14 March 2027, The Old Barn, Andover"
            maxLength={200}
            required
          />
        </Field>
        <Field label="Language">
          <input
            className={inputClass}
            value={facts.languageMix}
            onChange={(e) => setFacts({ ...facts, languageMix: e.target.value })}
            placeholder="e.g. English with Nepali phrases"
            maxLength={80}
          />
        </Field>
        <Field label="Tone">
          <select
            className={inputClass}
            value={facts.tone}
            onChange={(e) => setFacts({ ...facts, tone: e.target.value })}
          >
            {TONES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          disabled={!ready || busy}
          className="w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Writing…" : "Generate text"}
        </button>
        {error && (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {error}
          </p>
        )}
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">2. Check and edit</h2>
        {COPY_KEYS.map((key) => {
          const { label, max } = COPY_FIELDS[key];
          const count = charCount(copy[key]);
          const long = key === "landing_page_story" || key === "post_event_thank_you" || key === "card_invite_body";
          return (
            <Field
              key={key}
              label={label}
              aside={
                <span className={count > max ? "text-red-600" : "text-neutral-500"}>
                  {count}/{max}
                  {trimmed.includes(key) ? " · shortened" : ""}
                </span>
              }
            >
              {long ? (
                <textarea
                  className={`${inputClass} min-h-24`}
                  rows={key === "landing_page_story" ? 7 : 3}
                  value={copy[key]}
                  onChange={(e) => setCopy({ ...copy, [key]: e.target.value })}
                />
              ) : (
                <input
                  className={inputClass}
                  value={copy[key]}
                  onChange={(e) => setCopy({ ...copy, [key]: e.target.value })}
                />
              )}
            </Field>
          );
        })}
      </section>
    </div>
  );
}

function Field({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="flex items-baseline justify-between text-sm font-medium">
        {label}
        {aside && <span className="text-xs font-normal tabular-nums">{aside}</span>}
      </span>
      {children}
    </label>
  );
}
