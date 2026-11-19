"use client";

// Cloudflare Turnstile: the free "are you a person?" check (CONCEPT 21), on
// "Email me a code", so nobody can make our sign-in send floods of emails.
// Most people never see it; a few get one tap. Supabase checks each token
// (Authentication › Attack Protection › Captcha, with Turnstile's secret key).
//
// Off until the site key below is filled in. The site key is public (it sits
// in the page); the secret key goes only into Supabase. Switch it on in this
// order: 1) site key here and deployed, 2) then the secret key in Supabase.

import { useCallback, useEffect, useRef, useState } from "react";

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

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

// const c = useCaptcha(); put <div ref={c.box} /> in the form, send
// c.token as captchaToken, then call c.used() (each token works once).
export function useCaptcha() {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const id = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !box) return;
    let gone = false;
    load().then(() => {
      if (gone || !window.turnstile) return;
      id.current = window.turnstile.render(box, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: "interaction-only",
        size: "flexible",
        callback: (t: string) => setToken(t),
        "expired-callback": () => setToken(null),
        "error-callback": () => setToken(null),
      });
    }).catch(() => {});
    return () => {
      gone = true;
      if (id.current) window.turnstile?.remove(id.current);
      id.current = null;
    };
  }, [box]);
  const used = useCallback(() => {
    setToken(null);
    if (id.current) window.turnstile?.reset(id.current);
  }, []);
  return { on: !!TURNSTILE_SITE_KEY, token, box: setBox, used };
}

export const CAPTCHA_WAIT = "One moment: checking you're a person. Then tap again.";
