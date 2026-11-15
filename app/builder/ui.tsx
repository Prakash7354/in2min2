"use client";

// Small building blocks for the builder: big tap targets, clear labels, and one
// line under each choice saying what it does (docs/CONCEPT.md, section 7).

import type { ReactNode } from "react";
import { TAG_LABELS, type Tag } from "@/lib/catalog";
import { Icon, type IconName } from "@/components/icons";

export const inputClass =
  "w-full rounded-xl border-2 border-line bg-card px-4 py-3 text-[17px] text-ink placeholder:text-muted/70 outline-none transition focus:border-brand";

export function Field({ id, label, hint, aside, children }: {
  id: string; label: ReactNode; hint?: ReactNode; aside?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold">{label}</label>
        {aside && <span className="text-sm tabular-nums text-muted">{aside}</span>}
      </div>
      {children}
      {hint && <p className="text-[15px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export function Group({ title, line, icon, children }: { title: string; line?: string; icon?: IconName; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-3xl border border-line bg-card/70 p-4 sm:p-6">
      <div className="grid gap-1">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-brand">
          {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-wash text-brand"><Icon name={icon} /></span>}
          {title}
        </h2>
        {line && <p className="text-[15px] text-muted">{line}</p>}
      </div>
      {children}
    </section>
  );
}

export type Choice<K extends string> = { key: K; label: ReactNode; line?: ReactNode; visual?: ReactNode; badge?: ReactNode };

// A set of big tiles where exactly one is chosen.
export function Choices<K extends string>({ label, value, options, onChange, columns = "grid-cols-2" }: {
  label: string; value: K | null; options: Choice<K>[]; onChange: (k: K) => void; columns?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-3 ${columns}`}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.key)}
            className={`relative grid min-h-14 content-start gap-1 rounded-2xl border-2 p-3 text-left transition ${
              on ? "border-brand bg-card shadow-[0_6px_18px_-10px_rgba(46,42,110,0.6)]" : "border-line bg-card/80 hover:border-brand/40"
            }`}
          >
            {o.visual}
            <span className="flex items-start justify-between gap-2">
              <span className="font-semibold leading-tight">{o.label}</span>
              {on && <Tick />}
            </span>
            {o.line && <span className="text-sm leading-snug text-muted">{o.line}</span>}
            {o.badge}
          </button>
        );
      })}
    </div>
  );
}

export function Tick() {
  return (
    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-white">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  );
}

export function Switch({ id, checked, onChange, label, line, badge }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string; line?: string; badge?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-card p-4">
      <div className="grid gap-0.5">
        <label htmlFor={id} className="flex flex-wrap items-center gap-2 font-semibold">{label}{badge}</label>
        {line && <p className="text-[15px] leading-snug text-muted">{line}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-8 w-14 shrink-0 rounded-full transition ${checked ? "bg-brand" : "bg-line"}`}
      >
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${checked ? "left-7" : "left-1"}`} />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export function Button({ children, onClick, kind = "main", disabled, type = "button", className = "" }: {
  children: ReactNode; onClick?: () => void; kind?: "main" | "brand" | "ghost" | "quiet"; disabled?: boolean;
  type?: "button" | "submit"; className?: string;
}) {
  const styles = {
    main: "bg-brand text-white hover:bg-brand-deep",
    brand: "bg-brand text-white hover:bg-brand-deep",
    ghost: "bg-transparent text-brand ring-2 ring-inset ring-brand hover:bg-brand/5",
    quiet: "bg-wash text-ink hover:bg-line",
  }[kind];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  return (
    <p
      role={tone === "warn" ? "alert" : undefined}
      className={`rounded-2xl border-l-4 px-4 py-3 text-[15px] leading-snug ${tone === "warn" ? "border-marigold-deep bg-amber-wash text-ink" : "border-brand/30 bg-wash text-ink"}`}
    >
      {children}
    </p>
  );
}

export function Soon({ when }: { when: string }) {
  return <span className="rounded-full bg-wash px-2 py-0.5 text-xs font-bold text-muted">Works from {when}</span>;
}

// "Popular", "New" or "Coming soon" on a tile.
export function Badge({ tag, className = "" }: { tag?: Tag; className?: string }) {
  if (!tag) return null;
  const look = { popular: "bg-brand text-white", new: "bg-marigold text-ink", soon: "bg-ink/80 text-white" }[tag];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${look} ${className}`}>{TAG_LABELS[tag]}</span>;
}
