"use client";

// Signing in: type your email, get a 6-digit code, type the code. No password
// to remember or lose. The session stays on this device until signing out.

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { Button, Field, Notice, inputClass } from "./ui";
import { CAPTCHA_FAILED, useCaptcha } from "@/components/captcha";

export function useSession(): { session: Session | null; ready: boolean } {
  const [state, setState] = useState<{ session: Session | null; ready: boolean }>({ session: null, ready: false });
  useEffect(() => {
    const sb = supabase();
    let live = true;
    sb.auth.getSession().then(({ data }) => { if (live) setState({ session: data.session, ready: true }); });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => setState({ session, ready: true }));
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);
  return state;
}

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("captcha")) return CAPTCHA_FAILED;
  if (m.includes("fetch") || m.includes("load failed") || m.includes("network")) {
    return "Couldn't connect to the sign-in service. Check your signal and try again.";
  }
  if (m.includes("sending")) {
    return "The email with your code couldn't be sent. in2min2's own email sender is being set up (see the action plan); until then codes only reach the Supabase team's address.";
  }
  if (m.includes("not authorized") || m.includes("not allowed")) {
    return "While in2min2 is being tested, codes are only sent to its own team's email addresses. This opens to everyone before the pilot.";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) {
    return "Too many codes asked for just now. Please wait a few minutes and try again.";
  }
  if (m.includes("expired") || m.includes("invalid")) return "That code didn't work. Check it, or ask for a new one.";
  if (m.includes("email")) return "Please check the email address.";
  return "Something went wrong. Please try again.";
}

// The sign-in window. It opens over the page (a sheet from the bottom on a
// phone) so it never looks like just another section of the builder.
export function SignInDialog({ why, onClose, onDone }: { why: string; onClose: () => void; onDone: () => void }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="signin-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card shadow-[0_-10px_40px_-10px_rgba(28,26,58,0.6)] sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="relative grid gap-2 bg-brand px-5 pb-5 pt-6 text-white">
          <span className="grid size-12 place-items-center rounded-2xl bg-marigold text-ink" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <h2 id="signin-title" className="font-display text-2xl font-extrabold leading-tight">Sign in to in2min2</h2>
          <p className="text-[15px] leading-snug text-white/85">{why}</p>
          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="p-5">
          <SignInForm onDone={onDone} />
        </div>
      </div>
    </div>
  );
}

function SignInForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const fail = (e: { message: string; status?: number }) => {
    setError(friendly(e.message));
    setDetail(`${e.message}${e.status ? ` (${e.status})` : ""}`);
  };
  const { box: captchaBox, token: captchaToken, used: captchaUsed } = useCaptcha();

  async function sendCode() {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { setError("Please check the email address."); return; }
    setBusy(true); setError(null); setDetail(null);
    // Waits for the "are you a person?" check (components/captcha.tsx).
    const captcha = await captchaToken();
    const { error: e } = await supabase().auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true, captchaToken: captcha ?? undefined } });
    captchaUsed();
    setBusy(false);
    if (e) { fail(e); return; }
    setEmail(clean);
    setStage("code");
  }

  async function checkCode() {
    setBusy(true); setError(null); setDetail(null);
    const { error: e } = await supabase().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (e) { fail(e); return; }
    onDone();
  }

  return (
    <div className="grid gap-4">
      <ol className="flex items-center gap-2 text-sm font-bold" aria-label="Two steps">
        <li className={`flex items-center gap-1.5 ${stage === "email" ? "text-ink" : "text-muted"}`}>
          <span className={`grid size-6 place-items-center rounded-full text-xs ${stage === "email" ? "bg-marigold text-ink" : "bg-brand text-white"}`}>{stage === "email" ? "1" : "✓"}</span>
          Your email
        </li>
        <li className="h-0.5 w-6 rounded bg-line" aria-hidden="true" />
        <li className={`flex items-center gap-1.5 ${stage === "code" ? "text-ink" : "text-muted"}`}>
          <span className={`grid size-6 place-items-center rounded-full text-xs ${stage === "code" ? "bg-marigold text-ink" : "border-2 border-line"}`}>2</span>
          The code we email you
        </li>
      </ol>
      {stage === "email" ? (
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void sendCode(); }}>
          <Field id="signin-email" label="Your email" hint="We'll email you a 6-digit code. No password to remember.">
            <input id="signin-email" type="email" inputMode="email" autoComplete="email" autoFocus className={inputClass} value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Button type="submit" kind="brand" disabled={busy || !email.trim()} className="w-full">{busy ? "Sending…" : "Email me a code"}</Button>
        </form>
      ) : (
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void checkCode(); }}>
          <Field id="signin-code" label={`The code we sent to ${email}`} hint="It can take a minute to arrive. Check your junk folder too.">
            <input id="signin-code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8}
              className={`${inputClass} text-center font-display text-2xl tracking-[0.4em]`}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
          </Field>
          <Button type="submit" kind="brand" disabled={busy || code.length < 6} className="w-full">{busy ? "Checking…" : "Sign in"}</Button>
          <Button kind="quiet" onClick={() => { setStage("email"); setCode(""); setError(null); }}>Use another email</Button>
        </form>
      )}
      <div ref={captchaBox} />
      {error && <Notice tone="warn">{error}</Notice>}
      {detail && <p className="text-xs text-muted">Details for Claude Code: {detail}</p>}
      <p className="text-sm text-muted">Free. Your event is kept safe in your account, and you can sign in on any phone.</p>
    </div>
  );
}
