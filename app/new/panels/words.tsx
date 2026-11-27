"use client";

// The words on the invitation and the page. The AI writes all five boxes in
// up to two languages; each box can then be made shorter, warmer, more formal
// or more fun with one tap. Ready-made words are there without signing in.
// Nothing goes live until the host publishes (CONCEPT 7: AI suggests → host
// edits → host approves → publish).

import { useState } from "react";
import { ADJUSTMENTS, COPY_FIELDS, COPY_KEYS, charCount, type Adjustment, type CopyKey } from "@/lib/ai/copy";
import { Icon } from "@/components/icons";
import { LANGUAGES, TONES, language } from "@/lib/catalog";
import { boxBy, EMPTY_COPY, markBoxes, type Draft } from "@/lib/draft";
import { useB2 } from "../context";
import { PanelShell } from "../panels";
import { AiHead, Chips, Hint, markHint, Needed, Note, Section } from "../ui";

const TONE_SHORT: Record<string, string> = {
  "Warm and welcoming": "Warm", "Formal and elegant": "Formal", "Fun and playful": "Fun",
  "Festive and joyful": "Festive", "Sporty and energetic": "Sporty", "Gentle and respectful": "Gentle",
};
// The four tones most hosts want, shown as chips; the rest (kind defaults like Sporty for
// tournaments, Gentle for memorials) sit under "More…" so they're still reachable but don't
// crowd the row.
const TONE_MAIN = ["Warm and welcoming", "Formal and elegant", "Fun and playful", "Festive and joyful"];
const TONE_MORE = TONES.filter((t) => !TONE_MAIN.includes(t));
const MAIN_LANGS = ["en", "ne", "ne-Latn"];
// Lines families often put at the top of a card (Hindu, Buddhist); any other can be typed.
const TOP_LINES = ["॥ श्री गणेशाय नमः ॥", "॥ ॐ ॥", "ॐ मणि पद्मे हूँ"];
const short = (code: string) => (language(code)?.name ?? code).replace("Nepali in English letters", "Nepali (English letters)");

export function WordsPanel() {
  const b = useB2();
  const { d, update, ai } = b;
  const main = language(d.languages[0]) ?? LANGUAGES[0];
  const second = language(d.languages[1]);
  const busyAll = ai.busy === "all";
  // Three ways to write: English only, your language only, or both together. A mix always
  // pairs English with one other language; whichever was the host's single language stays
  // first when they switch to a mix, so the AI keeps writing that one as the lead text.
  const mode: "en" | "other" | "mix" = d.languages.length > 1 ? "mix" : d.languages[0] === "en" ? "en" : "other";
  const ownLangCode = d.languages.find((c) => c !== "en") ?? "ne";
  const setMode = (m: "en" | "other" | "mix") => update((x) => {
    const own = x.languages.find((c) => c !== "en") ?? "ne";
    if (m === "en") return { ...x, languages: ["en"] };
    if (m === "other") return { ...x, languages: [own] };
    const ownWasFirst = x.languages.length === 1 && x.languages[0] !== "en";
    return { ...x, languages: ownWasFirst ? [own, "en"] : ["en", own] };
  });
  const setOwnLang = (code: string) => update((x) => ({ ...x, languages: x.languages.length > 1 ? x.languages.map((c) => (c === "en" ? c : code)) : [code] }));
  // Every language beyond the quick chips sits under "More…".
  const [allOwn, setAllOwn] = useState(() => !MAIN_LANGS.includes(ownLangCode));
  const [allTone, setAllTone] = useState(() => !TONE_MAIN.includes(d.tone));
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <PanelShell peek icon="pen" title="The words" line="Shown on the invitation and the page. Changes stay in draft until you publish.">
      <section className="b2-ai" aria-label="AI writing assistant">
        <AiHead title="AI writing assistant" line="Generates all five text boxes from your event details." />
        <div className="b2-field">
          <span className="b2-label">Language</span>
          <span className="b2-small">English only, your language only, or both together.</span>
          <Chips label="Language" small value={mode}
            options={[{ key: "en", label: "English only" }, { key: "other", label: "Your language only" }, { key: "mix", label: "English + your language" }]}
            onChange={(m) => m && setMode(m as "en" | "other" | "mix")} />
        </div>
        {mode !== "en" && (
          <div className="b2-field">
            <span className="b2-label">Your language</span>
            <Chips label="Your language" small value={allOwn ? "more" : ownLangCode}
              options={[...MAIN_LANGS.filter((c) => c !== "en").map((c) => ({ key: c, label: short(c) })), { key: "more", label: "More…" }]}
              onChange={(c) => { if (c === "more") setAllOwn(true); else if (c) { setAllOwn(false); setOwnLang(c); } }} />
            {allOwn && (
              <select className="b2-input b2-input-sm" aria-label="Your language" value={ownLangCode} onChange={(e) => setOwnLang(e.target.value)}>
                {LANGUAGES.filter((l) => l.code !== "en").map((l) => <option key={l.code} value={l.code}>{l.name}{l.ready ? "" : " (beta)"}</option>)}
              </select>
            )}
          </div>
        )}
        <div className="b2-field">
          <span className="b2-label">Tone</span>
          <Chips label="Tone" small value={allTone ? "more" : d.tone}
            options={[...TONE_MAIN.map((t) => ({ key: t, label: TONE_SHORT[t] ?? t })), { key: "more", label: "More…" }]}
            onChange={(t) => { if (t === "more") setAllTone(true); else if (t) { setAllTone(false); update((x) => ({ ...x, tone: t })); } }} />
          {allTone && (
            <Chips label="More tones" small value={d.tone} options={TONE_MORE.map((t) => ({ key: t, label: TONE_SHORT[t] ?? t }))}
              onChange={(t) => t && update((x) => ({ ...x, tone: t }))} />
          )}
        </div>
        {[main, second].some((l) => l && !l.ready) && (
          <p className="b2-small">Beta language: the AI writes it well, but please ask a native speaker to review it before you publish.</p>
        )}
        <button type="button" className="b2-btn b2-primary b2-block" disabled={!!ai.busy} style={{ position: "relative" }}
          onClick={() => { markHint("words-ai"); void b.writeAll(); }}>
          {d.wordsBy !== "ai" && !ai.busy && <Hint id="words-ai" label="Let the AI write" style={{ right: 16, bottom: 4 }} />}
          <Icon name="sparkle" className="" />
          {busyAll ? "Generating…" : !b.session ? "Sign in to generate text" : d.wordsBy === "ai" ? "Regenerate all text" : "Generate text"}
        </button>
        <p className="b2-small">{b.session ? "Free · up to 20 generations a day · about 10 seconds." : "Signing in is free and takes about a minute."}</p>
        {ai.error && ai.at !== undefined && ai.at !== "all" ? null : ai.error && <Note tone="warn">{ai.error}</Note>}
        {ai.done && !ai.error && !busyAll && <Note tone="ok">Done. Review each text box below and edit anything you like.</Note>}
        {ai.trimmed && <Note>Some boxes were over the length limit, so they were shortened to fit. Please review them below.</Note>}
      </section>

      <Section icon="pen" title="Text content" line="Edit any field directly, or refine it with the AI shortcuts underneath each box."
        action={d.wordsBy !== "suggested" && !confirmReset ? (
          <button type="button" className="b2-chip b2-chip-sm" onClick={() => setConfirmReset(true)}>Restore defaults</button>
        ) : undefined}>
        {confirmReset && (
          <div className="b2-note" data-tone="warn" style={{ display: "grid", gap: 10 }}>
            <span>Restore the default text? This replaces all the text below{second ? `, and clears the ${second}` : ""}.</span>
            <span className="b2-chips">
              <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={() => {
                update((x) => ({ ...x, wordsBy: "suggested", copyBy: undefined, translation: { ...EMPTY_COPY } }));
                setConfirmReset(false);
                b.say("Default text restored.");
              }}>Yes, restore</button>
              <button type="button" className="b2-chip b2-chip-sm" onClick={() => setConfirmReset(false)}>Keep my text</button>
            </span>
          </div>
        )}
        <p className="b2-key" aria-hidden="true">
          <span><i style={{ background: "var(--b2-ai-edge)" }} />AI-generated</span>
          <span><i style={{ background: "var(--b2-mine-edge)" }} />Written by you</span>
          <span><i style={{ background: "var(--b2-ready-edge)" }} />Default</span>
        </p>
        {COPY_KEYS.map((key) => <WordBox key={key} k={key} d={d} second={second?.name} secondCode={second?.code} />)}
      </Section>

      <Section icon="sparkle" title="Opening blessing" line="Optional. A short line above everything else, as on printed cards.">
        <Chips label="A blessing at the top" small value={TOP_LINES.includes(d.topLine ?? "") ? d.topLine ?? "" : d.topLine ? "own" : ""}
          options={[{ key: "", label: "None" }, ...TOP_LINES.map((t) => ({ key: t, label: t })), { key: "own", label: "My own" }]}
          onChange={(v) => update((x) => ({ ...x, topLine: v === "own" ? (x.topLine && !TOP_LINES.includes(x.topLine) ? x.topLine : " ") : v ?? "" }))} />
        {!!d.topLine && !TOP_LINES.includes(d.topLine) && (
          <input className="b2-input b2-input-sm" value={d.topLine.trimStart()} maxLength={40} aria-label="Your own line at the top" placeholder="e.g. ॥ जय श्री राम ॥"
            onChange={(e) => update((x) => ({ ...x, topLine: e.target.value || " " }))} />
        )}
      </Section>
    </PanelShell>
  );
}

function WordBox({ k, d, second, secondCode }: { k: CopyKey; d: Draft; second?: string; secondCode?: string }) {
  const b = useB2();
  const f = COPY_FIELDS[k];
  const long = k !== "card_headline";
  const busy = b.ai.busy === k || b.ai.busy === "all";
  const clip = (v: string) => Array.from(v).slice(0, f.max).join("");
  const set = (which: "copy" | "translation", v: string) =>
    b.update((x) => ({ ...x, wordsBy: "host", copyBy: markBoxes(x, [k], "host"), [which]: { ...x[which], [k]: clip(v) } }));
  const by = boxBy(d, k);
  const box = (which: "copy" | "translation", lang?: string, label?: string) => {
    const value = d[which][k];
    // While the AI writes into it, the box is read-only, so typing can't fight the words arriving.
    const needed = b.flagMissing && which === "copy" && (k === "card_headline" || k === "card_invite_body") && !value.trim();
    const props = { className: `b2-input ${long ? "b2-textarea" : "b2-input-sm"}`, value, lang, readOnly: busy, "aria-busy": busy, "aria-label": label ?? f.label,
      ...(needed ? { "data-missing": "" } : {}), onChange: (e: { target: { value: string } }) => set(which, e.target.value) };
    return long ? <textarea rows={k === "landing_page_story" ? 9 : k === "guest_note_box" ? 3 : 5} {...props} /> : <input {...props} />;
  };
  return (
    <div className="b2-wordbox" data-busy={busy ? "" : undefined} data-by={by}>
      <p className="b2-label" style={{ margin: 0 }}>{f.label}</p>
      {box("copy", d.languages[0])}
      <p className="b2-byline">
        <span className="b2-by" data-by={by}>
          {by === "ai" ? <><Icon name="sparkle" className="" />AI-generated</> : by === "host" ? <><Icon name="pen" className="" />Written by you</> : "Default"}
        </span>
        <span>{charCount(d.copy[k])}/{f.max}</span>
      </p>
      {second && (
        <>
          <p className="b2-label" style={{ margin: 0 }}>{second} version <span className="b2-caption" style={{ display: "inline" }}>{charCount(d.translation[k])}/{f.max}</span></p>
          {box("translation", secondCode, `${f.label} in ${second}`)}
        </>
      )}
      <div className="b2-chips b2-chips-scroll" role="group" aria-label={`Change the ${f.label.toLowerCase()} with the AI`}>
        {(Object.keys(ADJUSTMENTS) as Adjustment[]).filter((a) => a !== "shorter" || charCount(d.copy[k]) > 20).map((a) => (
          <button key={a} type="button" className="b2-chip b2-chip-sm b2-chip-ai" disabled={!!b.ai.busy} onClick={() => void b.writeOne(k, a)}>
            {a === "again" ? <Icon name="sparkle" className="" /> : null}{ADJUSTMENTS[a].label}
          </button>
        ))}
      </div>
      {busy && <span className="b2-writing" style={{ position: "static" }}><Icon name="sparkle" className="" />Writing…</span>}
      {!busy && b.ai.error && b.ai.at === k && <Note tone="warn">{b.ai.error}</Note>}
      <Needed show={b.flagMissing && (k === "card_headline" || k === "card_invite_body") && !d.copy[k].trim()} />
    </div>
  );
}
