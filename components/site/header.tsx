"use client";

// The website's top bar, in navy: the logo, the menu and Start free. On a
// phone the menu folds into a button; on a laptop the links sit in a row.

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#events", label: "Events" },
  { href: "#prices", label: "Prices" },
  { href: "#questions", label: "Questions" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="s-header">
      <div className="s-wrap s-headrow">
        <Link href="/" className="s-logo" aria-label="in2min2 home">
          {/* The light logo, for the navy bar (scripts/art/dark-to-light.swift). */}
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo, already sized */}
          <img src="/brand/logo-light.png" alt="in2min2: Create, Invite, Celebrate" width={640} height={330} />
        </Link>
        <nav className="s-nav" aria-label="Main">
          {LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="s-headbtns">
          <Link href="/new" className="s-signin">Sign in</Link>
          <Link href="/new" className="s-btn s-btn-go s-btn-sm">Start free</Link>
          <button type="button" className="s-menubtn" aria-expanded={open} aria-controls="s-menu" aria-label={open ? "Close the menu" : "Open the menu"}
            onClick={() => setOpen(!open)}>
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
      </div>
      <nav id="s-menu" className="s-menu" data-open={open ? "" : undefined} aria-label="Menu">
        {LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>)}
        <Link href="/new" onClick={() => setOpen(false)}>Sign in</Link>
      </nav>
    </header>
  );
}
