"use client";

// Signing in: type your email, get a 6-digit code, type the code. No password
// to remember or lose. The session stays on this device until signing out.

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { Button, Field, Notice, inputClass } from "./ui";

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
  if (m.includes("not authorized") || m.includes("not allowed")) {
    return "While In2Min2 is being tested, codes are only sent to its own team's email addresses. This opens to everyone before the pilot.";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) {
    return "Too many codes asked for just now. Please wait a few minutes and try again.";
  }
  if (m.includes("expired") || m.includes("invalid")) return "That code didn't work. Check it, or ask for a new one.";
  if (m.includes("email")) return "Please check the email address.";
  return "Something went wrong. Please try again.";
}

export function SignIn({ why }: { why: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { setError("Please check the email address."); return; }
    setBusy(true); setError(null);
    const { error: e } = await supabase().auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    setBusy(false);
    if (e) { setError(friendly(e.message)); return; }
    setEmail(clean);
    setStage("code");
  }

  async function checkCode() {
    setBusy(true); setError(null);
    const { error: e } = await supabase().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (e) setError(friendly(e.message));
  }

  return (
    <div className="grid gap-3 rounded-2xl border-2 border-brand/30 bg-card p-4">
      <p className="font-semibold">{why}</p>
      {stage === "email" ? (
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void sendCode(); }}>
          <Field id="signin-email" label="Your email" hint="We'll email you a 6-digit code. No password needed.">
            <input id="signin-email" type="email" inputMode="email" autoComplete="email" className={inputClass} value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Button type="submit" kind="brand" disabled={busy || !email.trim()}>{busy ? "Sending…" : "Email me a code"}</Button>
        </form>
      ) : (
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void checkCode(); }}>
          <Field id="signin-code" label={`The code we sent to ${email}`} hint="It can take a minute to arrive. Check your junk folder too.">
            <input id="signin-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} className={`${inputClass} tracking-[0.3em]`}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
          </Field>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" kind="brand" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Sign in"}</Button>
            <Button kind="quiet" onClick={() => { setStage("email"); setCode(""); setError(null); }}>Use another email</Button>
          </div>
        </form>
      )}
      {error && <Notice tone="warn">{error}</Notice>}
    </div>
  );
}

export function SignedInAs({ session }: { session: Session }) {
  return (
    <span className="flex items-center gap-2 text-sm text-muted">
      <span className="hidden max-w-[16ch] truncate sm:inline">{session.user.email}</span>
      <button type="button" className="font-semibold text-brand underline underline-offset-4"
        onClick={() => { void supabase().auth.signOut(); }}>
        Sign out
      </button>
    </span>
  );
}
