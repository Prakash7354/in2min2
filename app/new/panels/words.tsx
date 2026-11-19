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
import { Chips, Note, Section } from "../ui";

const TONE_SHORT: Record<string, string> = {
  "Warm and welcoming": "Warm", "Formal and elegant": "Formal", "Fun and playful": "Fun",
  "Festive and joyful": "Festive", "Sporty and energetic": "Sporty", "Gentle and respectful": "Gentle",
};
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
  const setMain = (code: string) => update((x) => ({ ...x, languages: [code, ...x.languages.slice(1).filter((c) => c !== code)] }));
  const setSecond = (code: string | null) => update((x) => ({ ...x, languages: code ? [x.languages[0], code] : [x.languages[0]] }));
  // The three most used languages as chips; every other one under "More…".
  const [allMain, setAllMain] = useState(() => !MAIN_LANGS.includes(main.code));
  const [allSecond, setAllSecond] = useState(() => !!second && !MAIN_LANGS.includes(second.code));
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <PanelShell peek icon="pen" title="The words" line="On the invitation and the page. Change any word; nothing goes live until you publish.">
      <section className="b2-ai" aria-label="AI writer">
        <p className="b2-h3"><Icon name="sparkle" className="b2-inline" /> AI writer</p>
        <div className="b2-field">
          <span className="b2-label">Tone</span>
          <Chips label="Tone" small value={d.tone} options={TONES.map((t) => ({ key: t, label: TONE_SHORT[t] ?? t }))}
            onChange={(t) => t && update((x) => ({ ...x, tone: t }))} />
        </div>
        <div className="b2-field">
          <span className="b2-label">Language</span>
          <Chips label="Language" small value={allMain ? "more" : main.code}
            options={[...MAIN_LANGS.map((c) => ({ key: c, label: short(c) })), { key: "more", label: "More…" }]}
            onChange={(c) => { if (c === "more") setAllMain(true); else if (c) { setAllMain(false); setMain(c); } }} />
          {allMain && (
            <select className="b2-input b2-input-sm" aria-label="Main language" value={main.code} onChange={(e) => setMain(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}{l.ready ? "" : " (beta)"}</option>)}
            </select>
          )}
        </div>
        <div className="b2-field">
          <span className="b2-label">A second language too? <span style={{ fontWeight: 500 }}>(shown underneath)</span></span>
          <Chips label="Second language" small value={allSecond ? "more" : second?.code ?? "none"}
            options={[{ key: "none", label: "No" }, ...MAIN_LANGS.filter((c) => c !== main.code).map((c) => ({ key: c, label: short(c) })), { key: "more", label: "More…" }]}
            onChange={(c) => { if (c === "more") setAllSecond(true); else { setAllSecond(false); setSecond(!c || c === "none" ? null : c); } }} />
          {allSecond && (
            <select className="b2-input b2-input-sm" aria-label="Second language" value={second?.code ?? ""} onChange={(e) => setSecond(e.target.value || null)}>
              <option value="">None</option>
              {LANGUAGES.filter((l) => l.code !== main.code).map((l) => <option key={l.code} value={l.code}>{l.name}{l.ready ? "" : " (beta)"}</option>)}
            </select>
          )}
        </div>
        {[main, second].some((l) => l && !l.ready) && (
          <p className="b2-small">Beta language: the AI writes it well, but please ask a native speaker to read it before you publish.</p>
        )}
        <button type="button" className="b2-btn b2-primary b2-block" disabled={!!ai.busy} onClick={() => void b.writeAll()}>
          <Icon name="sparkle" className="" />
          {busyAll ? "Writing your words…" : !b.session ? "Sign in and write it for me" : d.wordsBy === "ai" ? "Write it all again" : "Write it for me"}
        </button>
        <p className="b2-small">{b.session ? "Free, up to 20 times a day. About ten seconds." : "Signing in is free and takes a minute."}</p>
        {ai.error && ai.at !== undefined && ai.at !== "all" ? null : ai.error && <Note tone="warn">{ai.error}</Note>}
        {ai.done && !ai.error && !busyAll && <Note tone="ok">Done! Read every word below and change anything you like.</Note>}
        {ai.trimmed && <Note>Some boxes were a little long, so they were shortened to fit. Check them below.</Note>}
      </section>

      <Section icon="pen" title="Your words" line="Type your own, or change what was written for you."
        action={d.wordsBy !== "suggested" && !confirmReset ? (
          <button type="button" className="b2-chip b2-chip-sm" onClick={() => setConfirmReset(true)}>Use ready-made</button>
        ) : undefined}>
        {confirmReset && (
          <div className="b2-note" data-tone="warn" style={{ display: "grid", gap: 10 }}>
            <span>Put back the ready-made words? This replaces the words below{second ? `, and clears the ${second}` : ""}.</span>
            <span className="b2-chips">
              <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={() => {
                update((x) => ({ ...x, wordsBy: "suggested", copyBy: undefined, translation: { ...EMPTY_COPY } }));
                setConfirmReset(false);
                b.say("Ready-made words put back.");
              }}>Yes, put them back</button>
              <button type="button" className="b2-chip b2-chip-sm" onClick={() => setConfirmReset(false)}>Keep mine</button>
            </span>
          </div>
        )}
        <p className="b2-key" aria-hidden="true">
          <span><i style={{ background: "var(--b2-ai-edge)" }} />The AI wrote it</span>
          <span><i style={{ background: "var(--b2-mine-edge)" }} />You wrote it</span>
          <span><i style={{ background: "var(--b2-ready-edge)" }} />Ready-made</span>
        </p>
        {COPY_KEYS.map((key) => <WordBox key={key} k={key} d={d} second={second?.name} secondCode={second?.code} />)}
      </Section>

      <Section icon="sparkle" title="A blessing at the very top" line="A short line above everything else, as on printed cards. If you like.">
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
    const props = { className: `b2-input ${long ? "b2-textarea" : "b2-input-sm"}`, value, lang, readOnly: busy, "aria-busy": busy, "aria-label": label ?? f.label, onChange: (e: { target: { value: string } }) => set(which, e.target.value) };
    return long ? <textarea rows={k === "landing_page_story" ? 9 : k === "guest_note_box" ? 3 : 5} {...props} /> : <input {...props} />;
  };
  return (
    <div className="b2-wordbox" data-busy={busy ? "" : undefined} data-by={by}>
      <p className="b2-label" style={{ margin: 0 }}>{f.label}</p>
      {box("copy", d.languages[0])}
      <p className="b2-byline">
        <span className="b2-by" data-by={by}>
          {by === "ai" ? <><Icon name="sparkle" className="" />The AI wrote this</> : by === "host" ? <><Icon name="pen" className="" />You wrote this</> : "Ready-made"}
        </span>
        <span>{charCount(d.copy[k])}/{f.max}</span>
      </p>
      {second && (
        <>
          <p className="b2-small" style={{ margin: 0 }}>In {second} · {charCount(d.translation[k])}/{f.max}</p>
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
    </div>
  );
}
