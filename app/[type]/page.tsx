// The website's page for each kind of event (owner, 23 Nov 2026), e.g.
// in2min2.com/pasni, above the guests' own pages at /pasni/{slug}. The words
// are in lib/kind-pages.ts; the invitation and the full page are the
// builder's own sample for that kind (lib/site-samples.ts), so visitors see
// exactly what guests get: the card first, then the page with the time,
// place, directions, day plan, menu and the reply. Made once at build time.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DISHES, KINDS, kindOf } from "@/app/new/kinds";
import EventView from "@/components/event/event-view";
import { SiteFooter } from "@/components/site/footer";
import { GuestDemoButton } from "@/components/site/guest-demo";
import { SiteHeader } from "@/components/site/header";
import { WhySection } from "@/components/site/why";
import { asksFood } from "@/lib/event-view";
import { EVENT_TYPES } from "@/lib/catalog";
import { KIND_PAGES, kindPage } from "@/lib/kind-pages";
import { QUESTIONS, SITE } from "@/lib/site-facts";
import { fullSample, kindSample } from "@/lib/site-samples";
import { SHARE_IMAGE } from "@/lib/site-share";
import "../site.css";

export const dynamicParams = false;
export function generateStaticParams() {
  return KIND_PAGES.map((k) => ({ type: k.type }));
}

export async function generateMetadata({ params }: PageProps<"/[type]">): Promise<Metadata> {
  const k = kindPage((await params).type);
  if (!k) return {};
  return {
    title: k.title,
    description: k.description,
    alternates: { canonical: `/${k.type}` },
    openGraph: { type: "website", siteName: "in2min2", locale: "en_GB", url: `/${k.type}`, title: k.h1, description: k.description, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title: k.h1, description: k.description, images: [SHARE_IMAGE.url] },
  };
}

const shared = (q: string) => QUESTIONS.find((x) => x.q === q)!;
// When the page was made (at build time), for the samples' dates.
function madeAt(): number {
  return Date.now();
}

export default async function KindPage({ params }: PageProps<"/[type]">) {
  const k = kindPage((await params).type);
  if (!k) notFound();
  const now = madeAt();
  const card = kindSample(k.type);
  const full = fullSample(k.type);
  const plan = (KINDS[k.type] ?? kindOf(k.type)).plan;
  const meal = plan.some(([, , m]) => m);
  const dishes = DISHES[kindOf(k.type).dishes].map(([, dish]) => dish).slice(0, 5);
  const food = asksFood(undefined, EVENT_TYPES.find((t) => t.key === k.type)?.sensitive ?? false);
  const questions = [...k.questions, ...(k.noFree ? [] : [shared("Is it really free?")]), shared("Do my guests need an app or an account?"),
    shared("Can I still use WhatsApp, Viber or text messages?"),
    ...(k.type === "memorial" ? [] : [shared("How long does my page stay online, and can I close it sooner?")])];
  const related = k.related.map((t) => kindPage(t)).filter((x) => !!x);
  const title = full.copy.card_headline || full.title;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "in2min2", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: k.name, item: `${SITE}/${k.type}` },
      ] },
      { "@type": "FAQPage", mainEntity: questions.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) },
    ],
  };

  return (
    <div className="s-site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SiteHeader />
      <main>
        {/* ── The top: what it is, and the invitation itself ── */}
        <section className="s-section s-kindtop">
          <div className="s-wrap s-split">
            <div>
              <nav className="s-crumbs" aria-label="You are here"><Link href="/">in2min2</Link> › <span>{k.name}</span></nav>
              <p className="s-kicker">{k.kicker}</p>
              <h1 className="s-h1 s-h1-kind">{k.h1}</h1>
              <p className="s-lead">{k.intro}</p>
              <div className="s-btnrow">
                <Link href={`/new?type=${k.type}`} className="s-btn s-btn-go">Start free</Link>
                <GuestDemoButton data={full} title={title} className="s-btn s-btn-line">
                  <span className="s-play" aria-hidden="true">▶</span>See it as a guest
                </GuestDemoButton>
              </div>
              <p className="s-small">No app to download. Works on any phone.</p>
            </div>
            <div className="s-wordsart" aria-hidden="true">
              <div className="s-phone"><div className="s-phonescreen"><EventView data={card} view="card" now={now} thumb /></div></div>
            </div>
          </div>
        </section>

        {/* ── The whole page guests get (owner, 23 Nov: show the details too) ── */}
        <section className="s-section s-tint">
          <div className="s-wrap s-split s-split-rev">
            <div>
              <p className="s-kicker">What guests get</p>
              <h2 className="s-h2">The invitation, then everything they need</h2>
              <p className="s-lead">Guests open the envelope, see the invitation, then scroll for the rest. This is the real page: scroll the phone.</p>
              <ul className="s-ticks">
                <li><b>When and where:</b> the date, the time and the place, with directions in one tap, and parking if you add it.</li>
                <li><b>The day plan:</b> {plan.map(([t]) => t).join(", ")}, each with its time.</li>
                {meal && k.type !== "memorial" && <li><b>The menu:</b> for example {dishes.join(", ")}.</li>}
                <li><b>The reply:</b> yes, maybe or no, how many people and a message{food ? ", with food needs such as vegetarian, halal or a nut allergy" : ""}.</li>
                <li><b>On the day and after:</b> everyone’s photos, comments, and a thank-you page.</li>
              </ul>
            </div>
            <div className="s-fullphone">
              <div className="s-phone"><div className="s-phonescreen" tabIndex={0} aria-label={`The full page for ${title}, as guests see it`}>
                <EventView data={full} view="page" now={now} />
              </div></div>
            </div>
          </div>
        </section>

        {/* ── Made for this kind of day ── */}
        <section className="s-section">
          <div className="s-wrap">
            <p className="s-kicker">Made for the day</p>
            <h2 className="s-h2">Ready for your {k.name === "Memorials" ? "family" : "day"}, in two minutes</h2>
            <ul className="s-kpoints">
              {k.points.map(([t, line]) => <li key={t}><b>{t}</b><span>{line}</span></li>)}
            </ul>
          </div>
        </section>

        {k.type !== "memorial" && <WhySection tint />}

        {/* ── Questions ── */}
        <section className={`s-section${k.type === "memorial" ? " s-tint" : ""}`}>
          <div className="s-wrap s-narrow">
            <p className="s-kicker">Questions</p>
            <h2 className="s-h2">Good to know</h2>
            <div className="s-faq">
              {questions.map((x) => <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}
            </div>
          </div>
        </section>

        {/* ── Other kinds, and the last call ── */}
        <section className="s-section s-final">
          <div className="s-wrap s-center-text">
            <h2 className="s-h2">Ready when you are</h2>
            <p className="s-lead">Your first invitation takes about two minutes. It’s free.</p>
            <Link href={`/new?type=${k.type}`} className="s-btn s-btn-go s-btn-big">Start free</Link>
            {related.length > 0 && (
              <nav className="s-related" aria-label="Also made for">
                <span>Also made for:</span>
                {related.map((r) => <Link key={r.type} href={`/${r.type}`}>{r.name}</Link>)}
              </nav>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
