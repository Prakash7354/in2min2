"use client";

// Cloudflare Turnstile: the free "are you a person?" check (CONCEPT 21), on
// "Email me a code", so nobody can make our sign-in send floods of emails.
// Most people never see it; a few get one tap. Supabase checks each token
// (Authentication › Attack Protection › Captcha, with Turnstile's secret key).
//
// The site key is public (it sits in the page): Cloudflare › Turnstile ›
// "in2min2 sign-in", made by the owner on 19 Nov 2026 for in2min2.com,
// www.in2min2.com and in2min2.pksgrg.workers.dev. The secret key goes only
// into Supabase. On this Mac (localhost) Cloudflare's always-pass test key is
// used instead, so test sign-ins need a stand-in database, not the real one.
// NEXT_PUBLIC_TURNSTILE_SITE_KEY=off turns the check off.

import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = "0x4AAAAAAGIljJ-nTdPB4yLq";
const TEST_KEY = "1x00000000000000000000AA";
const setting = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const TURNSTILE_SITE_KEY = setting === "off" ? "" : setting || SITE_KEY;

type Turnstile = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};
declare global {
  interface Window { turnstile?: Turnstile }
}

let loading: Promise<void> | null = null;
function load(): Promise<void> {
  loading ??= new Promise((ok, bad) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => { loading = null; bad(new Error("Turnstile didn't load")); };
    document.head.appendChild(s);
  });
  return loading;
}

// const c = useCaptcha(); put <div ref={c.box} /> in the form, then
// `const t = await c.token()` just before sending (it waits for the check,
// up to 15 seconds, and gives null if the check couldn't run), send t as
// captchaToken, then call c.used() (each token works once).
export function useCaptcha() {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const id = useRef<string | null>(null);
  const current = useRef<string | null>(null);
  const broken = useRef(false);
  const waiting = useRef<((t: string | null) => void)[]>([]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box) return;
    let gone = false;
    const give = (t: string | null) => { waiting.current.splice(0).forEach((w) => w(t)); };
    const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    load().then(() => {
      if (gone || !window.turnstile) return;
      id.current = window.turnstile.render(box, {
        sitekey: local ? TEST_KEY : TURNSTILE_SITE_KEY,
        appearance: "interaction-only",
        size: "flexible",
        callback: (t: string) => { current.current = t; broken.current = false; give(t); },
        "expired-callback": () => { current.current = null; },
        "error-callback": () => { current.current = null; broken.current = true; give(null); },
      });
    }).catch(() => { broken.current = true; give(null); });
    return () => {
      gone = true;
      if (id.current) window.turnstile?.remove(id.current);
      id.current = null;
    };
  }, [box]);

  const token = useCallback((): Promise<string | null> => {
    if (!TURNSTILE_SITE_KEY) return Promise.resolve(null);
    if (current.current) return Promise.resolve(current.current);
    if (broken.current) return Promise.resolve(null);
    return new Promise((done) => {
      waiting.current.push(done);
      window.setTimeout(() => { waiting.current = waiting.current.filter((w) => w !== done); done(null); }, 15000);
    });
  }, []);
  const used = useCallback(() => {
    current.current = null;
    if (id.current) window.turnstile?.reset(id.current);
  }, []);
  return { on: !!TURNSTILE_SITE_KEY, token, box: setBox, used };
}

// When Supabase turns a sign-in away because the check didn't pass.
export const CAPTCHA_FAILED = "The “are you a person?” check didn’t finish. Please try again. If it keeps happening, try another browser or turn off ad-blocking for in2min2.";
