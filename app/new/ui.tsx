"use client";

// Shared pieces of Design 2.0 (/new): the light/dark switch, the top bar
// with progress, the bottom sheet, and a short message. Motion (motion.dev,
// MIT; approved by the owner 15 Nov 2026) gives the springy movement; it
// follows the phone's "reduce motion" setting.

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/icons";

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

// ── Top bar: back, progress ("Step 3 of 6"), light/dark ──
export function TopBar({ step, of, onBack }: { step?: number; of?: number; onBack?: () => void }) {
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
      ) : <span />}
      <ThemeButton />
    </header>
  );
}

// ── Bottom sheet: slides up; drag down, tap outside or press Escape to close ──
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="overlay" className="b2-overlay" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div key="sheet" className="b2-sheet" role="dialog" aria-modal="true" aria-labelledby={id}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}>
            <span className="b2-handle" aria-hidden="true" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 id={id} ref={heading} tabIndex={-1} className="b2-h2" style={{ outline: "none" }}>{title}</h2>
              <button type="button" className="b2-round" onClick={onClose} aria-label="Close"><Icon name="close" className="" /></button>
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
    timer.current = window.setTimeout(() => setMsg(null), 2800);
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
