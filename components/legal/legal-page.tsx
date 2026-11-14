// The frame for In2Min2's own documents: the privacy notice, the terms, and
// prices and fair fees (owner's request, 14 Nov 2026: easy to read and use,
// with working links between them). Each starts with "The short version".
//
// DRAFT is true until the owner approves the wording. While it is, every page
// says so at the top, search engines are told not to list it, and nothing in
// the app links to it yet. Approving: set DRAFT to false, fill in the marked
// gaps, and link the pages from sign-in, publishing and the page footers.

import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export const DRAFT = true;
export const UPDATED = "14 November 2026";
export const CONTACT = "hello@in2min2.com";
// The owner's details, until GoChuchuro is incorporated (owner, 14 Nov 2026).
// The address is his home for now; swap in the virtual business address when he has one.
export const OWNER = "Prakash Gurung";
export const ADDRESS = "1 Rake Way, Andover SP11 6FX";

const PAGES = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/pricing", label: "Prices and fair fees" },
] as const;

export function LegalPage({ current, title, intro, short, children }: {
  current: (typeof PAGES)[number]["href"]; title: string; intro: ReactNode; short: ReactNode[]; children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label="In2Min2 home"><Wordmark className="text-[24px]" /></Link>
          <nav aria-label="In2Min2 documents" className="flex flex-wrap gap-1.5">
            {PAGES.map((p) => (
              <Link key={p.href} href={p.href} aria-current={p.href === current ? "page" : undefined}
                className="rounded-full px-3 py-1.5 text-sm font-bold text-brand hover:bg-wash aria-[current=page]:bg-brand aria-[current=page]:text-white">
                {p.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6 sm:pt-10">
        {DRAFT && (
          <p className="mb-6 rounded-2xl border-l-4 border-marigold-deep bg-amber-wash px-4 py-3 text-[15px] leading-snug">
            <strong>Draft for approval, {UPDATED}.</strong> Not in force yet. Questions for the owner are in yellow boxes.
          </p>
        )}
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-brand sm:text-5xl">{title}</h1>
        <p className="mt-2 text-muted">Last updated {UPDATED}</p>
        <div className="mt-4 text-lg">{intro}</div>

        <section aria-labelledby="short" className="mt-6 rounded-3xl border border-line bg-card p-5 sm:p-6">
          <h2 id="short" className="font-display text-xl font-extrabold text-brand">The short version</h2>
          <ul className="mt-3 grid gap-2.5">
            {short.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-2 size-2.5 shrink-0 rounded-full bg-marigold" aria-hidden="true" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="legal mt-4">{children}</div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-muted">
          <span>In2Min2 is a GoChuchuro product</span>
          <a href={`mailto:${CONTACT}`} className="font-semibold text-brand underline underline-offset-4">{CONTACT}</a>
        </div>
      </footer>
    </div>
  );
}

// A gap the owner still has to fill (an address, a number).
export function Fill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-marigold/35 px-1 font-semibold text-ink">[{children}]</mark>;
}

// A decision for the owner, shown only while the page is a draft.
export function Ask({ children }: { children: ReactNode }) {
  if (!DRAFT) return null;
  return (
    <div className="my-4 rounded-2xl border-2 border-marigold bg-amber-wash px-4 py-3 text-[15px] leading-snug">
      <strong>Owner&apos;s decision needed: </strong>{children}
    </div>
  );
}

// "What, why, how long" as stacked cards: easier on a phone than a wide table.
export function Items({ items }: { items: { what: string; lines: [string, ReactNode][] }[] }) {
  return (
    <div className="my-4 grid gap-3">
      {items.map((it) => (
        <div key={it.what} className="rounded-2xl border border-line bg-card p-4">
          <h3 className="!mt-0 font-bold">{it.what}</h3>
          <dl className="mt-1 grid gap-1 text-[16px]">
            {it.lines.map(([k, v]) => (
              <div key={k} className="grid gap-x-3 sm:grid-cols-[9rem_1fr]">
                <dt className="font-semibold text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export const legalMetadata = (title: string, description: string) => ({
  title: `${title} · In2Min2`,
  description,
  robots: DRAFT ? { index: false, follow: false } : undefined,
});
