// in2min2.com/help/{article}: one help article (owner, 27 Nov 2026). Made at
// build time from lib/help.ts. The date-based wording (the festive offer)
// is as of the build.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { HelpBody } from "@/components/site/help-body";
import { ARTICLES, HELP_EMAIL, HELP_UPDATED, articleOf, bodyOf, groupOf, plainText } from "@/lib/help";
import { SITE } from "@/lib/site-facts";
import { SHARE_IMAGE } from "@/lib/site-share";
import "../../site.css";

export const dynamicParams = false;
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/help/[slug]">): Promise<Metadata> {
  const a = articleOf((await params).slug);
  if (!a) return {};
  return {
    title: `${a.title} · in2min2 help`,
    description: a.summary,
    alternates: { canonical: `/help/${a.slug}` },
    openGraph: { type: "article", siteName: "in2min2", locale: "en_GB", url: `/help/${a.slug}`, title: a.title, description: a.summary, images: [SHARE_IMAGE] },
  };
}

// When the page was made (at build time), for date-based wording.
function madeAt(): number {
  return Date.now();
}

export default async function HelpArticle({ params }: PageProps<"/help/[slug]">) {
  const a = articleOf((await params).slug);
  if (!a) notFound();
  const blocks = bodyOf(a, madeAt());
  const group = groupOf(a.group);
  const related = (a.related ?? []).map(articleOf).filter((x) => !!x);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "in2min2", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Help", item: `${SITE}/help` },
        { "@type": "ListItem", position: 3, name: a.title, item: `${SITE}/help/${a.slug}` },
      ] },
      { "@type": "Article", headline: a.title, description: a.summary, articleBody: plainText(blocks), inLanguage: "en-GB",
        dateModified: "2026-11-27", mainEntityOfPage: `${SITE}/help/${a.slug}`, author: { "@type": "Organization", name: "in2min2" }, publisher: { "@type": "Organization", name: "in2min2", url: `${SITE}/` } },
    ],
  };
  return (
    <div className="s-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SiteHeader />
      <main>
        <section className="s-section">
          <div className="s-wrap s-narrow">
            <nav className="s-crumbs" aria-label="You are here"><Link href="/">in2min2</Link> › <Link href="/help">Help</Link> › <span>{group.title}</span></nav>
            <h1 className="s-h1 s-h1-kind">{a.title}</h1>
            <p className="s-lead">{a.summary}</p>
            <HelpBody blocks={blocks} />
            <p className="s-hupdated">Updated {HELP_UPDATED}</p>

            <div className="s-hstuck">
              <h2>Still stuck?</h2>
              <p>Write to <a className="s-hmail" href={`mailto:${HELP_EMAIL}`}>{HELP_EMAIL}</a> or use the <Link href="/contact" className="s-hmail">contact form</Link>. A real person will reply.</p>
            </div>

            {related.length > 0 && (
              <nav className="s-hmore" aria-label="Related answers">
                <h2>Related answers</h2>
                <ul>{related.map((r) => <li key={r.slug}><Link href={`/help/${r.slug}`}>{r.title}</Link></li>)}</ul>
              </nav>
            )}
            <p className="s-btnrow"><Link href="/new" className="s-btn s-btn-go">Start free</Link><Link href="/help" className="s-btn s-btn-line">All help</Link></p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
