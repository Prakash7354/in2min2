"use client";

// Two small pieces that keep quick choices adjustable (owner, 16 Nov 2026:
// "what if they are not that exact year? how can I change to 11th birthday?").
//
// MilestonePicker: the popular birthdays or years as chips, then "Another
// age", which opens a number box with − and + (it starts from the chosen
// chip, so 50th → 51st is one tap).
// TitleLine: what the invitation will say, with Change to type your own.

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { useB2 } from "./context";
import { ordinal, titleFor, type Kind } from "./kinds";
import { Chips } from "./ui";

const OTHER = "__other";

export function MilestonePicker({ m, small = false }: { m: NonNullable<Kind["milestone"]>; small?: boolean }) {
  const { d, update } = useB2();
  const value = d.milestone ?? null;
  const custom = !!value && !m.chips.includes(value);
  const [open, setOpen] = useState(custom);
  const n = value ? parseInt(value, 10) : NaN;
  const [text, setText] = useState(() => (Number.isFinite(n) ? String(n) : ""));
  const box = useRef<HTMLInputElement>(null);
  const set = (v: number | null) => {
    const ok = v !== null && v >= 1 && v <= m.max;
    update((x) => ({ ...x, milestone: ok ? ordinal(v) : undefined }));
  };
  const step = (by: number) => {
    const v = Math.min(m.max, Math.max(1, (Number.isFinite(n) ? n : 0) + by));
    setText(String(v));
    set(v);
  };
  const shown = parseInt(text, 10);
  return (
    <div className="b2-field">
      <span className="b2-label">{m.label}</span>
      <Chips label={m.label} small={small} clear value={value && m.chips.includes(value) ? value : open ? OTHER : value}
        options={[
          ...m.chips.map((c) => ({ key: c, label: c })),
          { key: OTHER, label: custom ? value : m.other, icon: custom ? "pen" as const : "plus" as const },
        ]}
        onChange={(c) => {
          if (c === OTHER) {
            setOpen(true);
            setText(Number.isFinite(n) ? String(n) : "");
            window.setTimeout(() => box.current?.focus(), 60);
            return;
          }
          setOpen(false);
          setText(c ? String(parseInt(c, 10)) : "");
          update((x) => ({ ...x, milestone: c ?? undefined }));
        }} />
      {open && (
        <div className="b2-stepper">
          <button type="button" className="b2-round b2-round-sm" aria-label="One less" onClick={() => step(-1)}><Icon name="minus" className="" /></button>
          <label className="b2-stepper-box">
            <input ref={box} inputMode="numeric" pattern="[0-9]*" maxLength={3} value={text} placeholder="11" aria-label={`${m.label}: type the number`}
              style={{ width: `${Math.max(2, text.length)}ch` }}
              onChange={(e) => {
                const t = e.target.value.replace(/\D/g, "").slice(0, 3);
                setText(t);
                set(t ? parseInt(t, 10) : null);
              }} />
            <span aria-hidden="true">{Number.isFinite(shown) && shown >= 1 ? ordinal(shown).replace(/^\d+/, "") : "th"}</span>
          </label>
          <button type="button" className="b2-round b2-round-sm" aria-label="One more" onClick={() => step(1)}><Icon name="plus" className="" /></button>
          {Number.isFinite(shown) && shown > m.max && <span className="b2-small">Up to {m.max}</span>}
        </div>
      )}
    </div>
  );
}

// "On the invitation: Sita's 11th birthday" with Change. Once the host types
// their own, the name stops following the names and the age; one tap puts
// the suggested one back.
export function TitleLine() {
  const { d, update } = useB2();
  const [edit, setEdit] = useState(false);
  const auto = titleFor(d);
  const own = !!auto && d.title !== auto;
  return (
    <div className="b2-titleline" aria-live="polite">
      <span className="b2-small">On the invitation</span>
      {edit ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input className="b2-input b2-input-sm" value={d.title} maxLength={120} autoFocus aria-label="The event's name" enterKeyHint="done"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setEdit(false); } }}
            onChange={(e) => update((x) => ({ ...x, title: e.target.value }))} />
          <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={() => setEdit(false)}>Done</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
          <strong className="b2-titletext">{d.title || auto}</strong>
          <button type="button" className="b2-chip b2-chip-sm" onClick={() => setEdit(true)}><Icon name="pen" className="" />Change</button>
        </div>
      )}
      {own && (
        <button type="button" className="b2-link" style={{ justifySelf: "start" }} onClick={() => update((x) => ({ ...x, title: titleFor(x) }))}>
          Use “{auto}” instead
        </button>
      )}
    </div>
  );
}
