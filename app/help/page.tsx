// in2min2.com/help: the help library (owner, 27 Nov 2026). Short answers to
// every "how do I…", grouped, with a search box. Made once at build time.
// Articles are in lib/help.ts.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { HelpSearch, type HelpEntry } from "@/components/site/help-search";
import { ARTICLES, GROUPS, HELP_EMAIL } from "@/lib/help";
import { SITE } from "@/lib/site-facts";
import "../site.css";

export const metadata: Metadata = {
  title: "Help library · in2min2",
  description: "Quick answers to every how-to: make your invitation, share it, see replies, add photos, plans and privacy.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  const entries: HelpEntry[] = ARTICLES.map((a) => ({
    slug: a.slug, group: a.group, title: a.title, summary: a.summary,
    text: `${a.title} ${a.summary} ${a.also ?? ""}`.toLowerCase(),
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "in2min2", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Help", item: `${SITE}/help` },
      ] },
      { "@type": "CollectionPage", name: "in2min2 help library", url: `${SITE}/help`, hasPart: ARTICLES.map((a) => ({ "@type": "WebPage", name: a.title, url: `${SITE}/help/${a.slug}` })) },
    ],
  };
  return (
    <div className="s-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SiteHeader />
      <main>
        <section className="s-section">
          <div className="s-wrap" style={{ maxWidth: 1000 }}>
            <p className="s-kicker">Help library</p>
            <h1 className="s-h1 s-h1-kind">How can we help?</h1>
            <p className="s-lead">Quick answers, step by step. Search, or pick a group.</p>
            <HelpSearch groups={GROUPS} entries={entries} />
            <div className="s-hstuck">
              <h2>Can&apos;t find it?</h2>
              <p>Write to us and a real person will reply: <a className="s-hmail" href={`mailto:${HELP_EMAIL}`}>{HELP_EMAIL}</a> or use the <Link href="/contact" className="s-hmail">contact form</Link>.</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
