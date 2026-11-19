"use client";

// Tells us when a page breaks on someone's phone (for the owner's hourly
// alert email; app/api/report-error). Only errors from our own code count,
// not from browser add-ons, and at most three from one visit.

import { useEffect } from "react";

export default function ErrorReporter() {
  useEffect(() => {
    let sent = 0;
    const ours = (s: string | undefined) => !!s && s.includes(`${location.origin}/_next/`);
    const send = (message: string) => {
      if (++sent > 3) return;
      const body = JSON.stringify({ where: location.pathname, message: message.slice(0, 600) });
      if (!navigator.sendBeacon?.("/api/report-error", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/report-error", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    };
    const onError = (e: ErrorEvent) => {
      if (ours(e.filename) || ours((e.error as Error | undefined)?.stack)) send(`${e.message}${e.error?.stack ? ` | ${String(e.error.stack).split("\n").slice(1, 3).join(" ")}` : ""}`);
    };
    const onReject = (e: PromiseRejectionEvent) => {
      const err = e.reason as Error | undefined;
      if (ours(err?.stack)) send(`Unhandled: ${err?.message ?? String(e.reason)}`);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onReject); };
  }, []);
  return null;
}
