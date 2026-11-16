"use client";

// Shared pieces of Design 2.0 (/new): the light/dark switch, the top bars,
// the bottom sheet, quick-choice chips, switches, fields and short messages.
// Motion (motion.dev, MIT; approved by the owner 15 Nov 2026) gives the
// springy movement; it follows the phone's "reduce motion" setting.

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { Icon, type IconName } from "@/components/icons";

export const spring = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } as const;

// ── Light or dark ──
type Theme = "dark" | "light";
const EVENT = "b2-theme";
function readTheme(): Theme {
  const el = document.getElementById("b2");
  return el?.dataset.theme === "light" ? "light" : "dark";
}
function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);
  const toggle = useCallback(() => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    const el = document.getElementById("b2");
    if (el) el.dataset.theme = next;
    try { window.localStorage.setItem("in2min2.theme", next); } catch { /* fine */ }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [theme, toggle];
}

export function ThemeButton() {
  const [theme, toggle] = useTheme();
  return (
    <button type="button" className="b2-round" onClick={toggle} aria-label={theme === "dark" ? "Switch to the light look" : "Switch to the dark look"}>
      <Icon name={theme === "dark" ? "sun" : "moon"} className="" />
    </button>
  );
}

// ── Top bar: back, progress ("Step 3 of 6") or a title, and one button on the right ──
export function TopBar({ step, of, title, onBack, right }: {
  step?: number; of?: number; title?: string; onBack?: () => void; right?: ReactNode;
}) {
  return (
    <header className="b2-top">
      {onBack ? (
        <button type="button" className="b2-round" onClick={onBack} aria-label="Back"><Icon name="back" className="" /></button>
      ) : <span />}
      {step && of ? (
        <div className="b2-progress" role="progressbar" aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} aria-label={`Step ${step} of ${of}`}>
          <small>Step {step} of {of}</small>
          <div className="b2-bar"><i style={{ width: `${(step / of) * 100}%` }} /></div>
        </div>
      ) : title ? <p className="b2-toptitle">{title}</p> : <span />}
      {right ?? <ThemeButton />}
    </header>
  );
}

// A round button with an optional number on it (the bell).
export function RoundButton({ icon, label, badge, onClick, children }: {
  icon?: IconName; label: string; badge?: number; onClick: () => void; children?: ReactNode;
}) {
  return (
    <button type="button" className="b2-round" onClick={onClick} aria-label={badge ? `${label} (${badge})` : label}>
      {children ?? (icon && <Icon name={icon} className="" />)}
      {!!badge && <span className="b2-badge" aria-hidden="true">{badge > 9 ? "9+" : badge}</span>}
    </button>
  );
}

// ── Bottom sheet: slides up; drag down, tap outside or press Escape to close ──
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const id = useId();
  const drag = useDragControls();
  const heading = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", key);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => heading.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", key);
      document.documentElement.style.overflow = prev;
      window.clearTimeout(t);
      back?.focus?.();
    };
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="overlay" className="b2-overlay" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div key="sheet" className="b2-sheet" role="dialog" aria-modal="true" aria-labelledby={id}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
            drag="y" dragControls={drag} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}>
            {/* Drag the top of the sheet down to close it; the rest scrolls as normal. */}
            <div className="b2-sheethead" onPointerDown={(e) => drag.start(e)}>
              <span className="b2-handle" aria-hidden="true" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <h2 id={id} ref={heading} tabIndex={-1} className="b2-h2" style={{ outline: "none" }}>{title}</h2>
                <button type="button" className="b2-round" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Close"><Icon name="close" className="" /></button>
              </div>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── A short message at the bottom ──
export function useToast(): [ReactNode, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const say = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), Math.min(7000, 2600 + m.length * 25));
  }, []);
  const node = (
    <AnimatePresence>
      {msg && (
        <motion.p key={msg} className="b2-toast" role="status"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={spring}>
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
  return [node, say];
}

// A small confetti burst in brand colours.
export function Pop() {
  const colours = ["#ffb627", "#a99dff", "#ff6b9a", "#4fe3a6", "#ffffff", "#6fb6ff"];
  return (
    <div className="b2-pop" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2;
        const r = 110 + ((i * 53) % 90);
        return (
          <i key={i} style={{
            background: colours[i % colours.length],
            ["--dx" as string]: `${Math.round(Math.cos(a) * r)}px`,
            ["--dy" as string]: `${Math.round(Math.sin(a) * r * 0.9 + 60)}px`,
            ["--r" as string]: `${(i * 67) % 360}deg`,
          }} />
        );
      })}
    </div>
  );
}

// ── Building blocks for the screens and panels ──

// Rendered straight into #b2 (not inside the sliding screen), so it stays
// fixed to the bottom of the phone while screens slide. `aside` sits to the
// left of the buttons (the live little card, see peek.tsx).
export function BottomBar({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  const bar = (
    <div className="b2-bottom">
      {aside ? <div data-aside="">{aside}<div className="b2-bottom-btns">{children}</div></div> : <div>{children}</div>}
    </div>
  );
  const root = typeof document !== "undefined" ? document.getElementById("b2") : null;
  return root ? createPortal(bar, root) : bar;
}

// A heading with its icon, then what's inside.
export function Section({ icon, title, line, children, action }: { icon?: IconName; title: string; line?: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <section className="b2-section">
      <div className="b2-sectionhead">
        {icon && <span className="b2-sicon" aria-hidden="true"><Icon name={icon} className="" /></span>}
        <div style={{ display: "grid", gap: 2, flex: 1, minWidth: 0 }}>
          <h2 className="b2-h3">{title}</h2>
          {line && <p className="b2-small">{line}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, hint, aside, children }: { label: ReactNode; hint?: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <label className="b2-field">
      <span className="b2-label" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span>{label}</span>
        {aside && <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{aside}</span>}
      </span>
      {children}
      {hint && <span className="b2-small">{hint}</span>}
    </label>
  );
}

// Quick choices: tap one (or tap it again to clear, when `clear` is set).
// A chip can carry an icon, and a short second line ("21 Nov" under "This Saturday").
export type ChipOption<K extends string> = { key: K; label: ReactNode; icon?: IconName; line?: ReactNode };
export function Chips<K extends string>({ label, options, value, onChange, clear = false, small = false }: {
  label: string; options: ChipOption<K>[]; value: K | null | undefined; onChange: (k: K | null) => void; clear?: boolean; small?: boolean;
}) {
  return (
    <div className="b2-chips" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = value === o.key;
        return (
          <button key={o.key} type="button" role="radio" aria-checked={on} className={`b2-chip${small ? " b2-chip-sm" : ""}${o.line ? " b2-chip-two" : ""}`}
            onClick={() => onChange(on && clear ? null : o.key)}>
            {o.icon && <Icon name={o.icon} className="" />}
            {o.line ? <span className="b2-chiptext"><span>{o.label}</span><small>{o.line}</small></span> : o.label}
          </button>
        );
      })}
    </div>
  );
}

// Chips that add something each time (quick add); no "chosen" state.
export function AddChips({ label, items, onAdd }: { label: string; items: string[]; onAdd: (s: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="b2-chips" role="group" aria-label={label}>
      {items.map((s) => (
        <button key={s} type="button" className="b2-chip b2-chip-sm" onClick={() => onAdd(s)}>
          <Icon name="plus" className="" />{s}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, line, checked, onChange, icon, badge }: {
  label: string; line?: ReactNode; checked: boolean; onChange: (v: boolean) => void; icon?: IconName; badge?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="b2-row b2-switchrow">
      {icon && <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name={icon} className="" /></span>}
      <span className="b2-grow">
        <label htmlFor={id} style={{ cursor: "pointer" }}><strong>{label}</strong>{badge}</label>
        {line && <small>{line}</small>}
      </span>
      <button id={id} type="button" role="switch" aria-checked={checked} className="b2-switch" onClick={() => onChange(!checked)}>
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

export function Note({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: ReactNode }) {
  return <p className="b2-note" data-tone={tone} role={tone === "warn" ? "alert" : undefined}>{children}</p>;
}

// A tappable row with an icon, a label and a line, leading somewhere.
export function Row({ icon, label, line, onClick, href, tone, end }: {
  icon: IconName; label: ReactNode; line?: ReactNode; onClick?: () => void; href?: string; tone?: string; end?: ReactNode;
}) {
  const inner = (
    <>
      <span className="b2-ico" style={{ background: tone ?? "var(--b2-s3)", color: tone ? "#fff" : "var(--b2-text)" }} aria-hidden="true"><Icon name={icon} className="" /></span>
      <span className="b2-grow"><strong>{label}</strong>{line && <small>{line}</small>}</span>
      {end ?? <Icon name="next" className="size-5" />}
    </>
  );
  return href
    ? <a className="b2-row" href={href} target="_blank" rel="noreferrer">{inner}</a>
    : <button type="button" className="b2-row" onClick={onClick}>{inner}</button>;
}

// A full-screen panel's heading line, under its top bar.
export function PanelHead({ icon, title, line }: { icon: IconName; title: string; line?: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="b2-sicon b2-sicon-lg" aria-hidden="true"><Icon name={icon} className="" /></span>
        <h1 className="b2-h1" style={{ fontSize: "clamp(28px, 7.5vw, 36px)" }}>{title}</h1>
      </div>
      {line && <p className="b2-lead" style={{ fontSize: 17 }}>{line}</p>}
    </div>
  );
}
