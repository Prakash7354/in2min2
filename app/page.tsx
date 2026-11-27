import type { Metadata } from "next";
import Link from "next/link";
import EventView, { eventVars } from "@/components/event/event-view";
import { GuestDemoButton } from "@/components/site/guest-demo";
import { HeroDevices } from "@/components/site/hero-devices";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { ShareStrip } from "@/components/site/share-strip";
import { AutoPlayPhone } from "@/components/site/autoplay-phone";
import { TrustBand } from "@/components/site/trust";
import { PAY_ORDER, PayCard, StripeLogo } from "@/components/pay-icons";
import { WheelDemo } from "@/components/site/wheel-demo";
import { WhySection } from "@/components/site/why";
import { KIND_PAGES } from "@/lib/kind-pages";
import { TapHand } from "@/components/tap-hand";
import { FESTIVE_UNTIL, formatPence, PLANS, type Plan } from "@/lib/catalog";
import { bigDaySample, heroSample, heroShows, heroWedding, kindSample, wordsSample } from "@/lib/site-samples";
import { QUESTIONS, TAGLINE, siteJsonLd } from "@/lib/site-facts";
import { SHARE_DESCRIPTION, SHARE_IMAGE, SHARE_TITLE } from "@/lib/site-share";
import { PhoneChrome } from "@/components/site/phone-chrome";
import "./site.css";

// in2min2.com: the website (owner, 21 Nov 2026). What in2min2 does, shown
// with real examples: the photos are the owner's free stock photos
// (public/site, docs/reference/site-images.md), and the invitations and the
// photo wheel are the same code guests see. Simple British English, written
// for readers whose first language may not be English. Mobile first.

export const metadata: Metadata = {
  title: "in2min2 · Create, invite, celebrate. Your event online in two minutes",
  description: TAGLINE,
  alternates: { canonical: "/" },
  // What WhatsApp, Viber and Facebook show (lib/site-share.ts).
  openGraph: { type: "website", siteName: "in2min2", locale: "en_GB", url: "/", title: SHARE_TITLE, description: SHARE_DESCRIPTION, images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", title: SHARE_TITLE, description: SHARE_DESCRIPTION, images: [SHARE_IMAGE.url] },
};

const FAMILY = [
  { type: "birthday", title: "Birthdays", line: "From the first birthday to the 60th, with cake, music and everyone’s photos.", photo: "birthday" },
  { type: "wedding", title: "Weddings and receptions", line: "Mehndi, ceremony and reception on one page, in two languages if you like.", photo: "wedding" },
  { type: "pasni", title: "Pasni and family ceremonies", line: "Pasni (Annaprashan), Bratabandha, naming ceremonies and pujas, with the day plan and the menu.", card: "pasni" },
  { type: "anniversary", title: "Anniversaries", line: "25 years, 50 years, or any year worth a party.", card: "anniversary" },
  { type: "christmas", title: "Christmas", line: "A family lunch or a big get-together.", photo: "christmas" },
  { type: "new-year", title: "New Year’s Eve", line: "Count down to midnight together, wherever everyone is.", photo: "newyear" },
  { type: "party", title: "Parties", line: "House-warming, graduation, or just because.", photo: "party" },
  { type: "memorial", title: "Memorials", line: "A funeral, prayers or a day of remembrance. Gentle, respectful, and always free.", card: "memorial" },
] as const;
const COMMUNITY = [
  { type: "lhosar", title: "Lhosar", line: "Tamu, Sonam and Gyalpo Lhosar, for the whole community.", card: "lhosar" },
  { type: "mela", title: "Melas and festivals", line: "Music, food and stalls, with the programme for the day.", photo: "festival" },
  { type: "sport", title: "Tournaments", line: "Teams, supporters and the day’s fixtures, with live updates.", photo: "sport" },
  { type: "corporate", title: "Work and office parties", line: "Christmas parties, team dinners and away days.", photo: "office" },
  { type: "reunion", title: "Reunions and regimental days", line: "A 25th year, a regiment or a school: old friends, one link, a day to remember.", card: "reunion" },
] as const;

// The photos turning at the top (the owner's eight, 22 Nov 2026), with where
// to keep the middle when a phone cuts them narrow. Light and dark take turns.
// Eight here means eight nth-child rules in site.css (.s-heroshow).
const HERO_PHOTOS: [string, string][] = [
  ["show-party", "58% 50%"], ["show-mist", "64% 50%"], ["show-lhosar", "62% 40%"], ["show-concert", "50% 50%"],
  ["show-bench", "52% 50%"], ["show-football", "40% 50%"], ["show-reception", "60% 50%"], ["show-bride", "50% 50%"],
];

const STEPS = [
  { title: "Choose your event", line: "Birthday, wedding, mehndi, Pasni, a Diwali or Eid party, Lhosar or a tournament. Each one comes with the right questions." },
  { title: "Answer a few questions", line: "Mostly taps: names, the date and the place. Then pick a look you like." },
  { title: "Let the AI write it", line: "In English, your language or both, warm, fun or formal. You check every word." },
  { title: "Share and celebrate", line: "Send one link. Guests open an envelope with their name on it, reply, and add photos on the day." },
];


function Photo({ name, alt, wide = false }: { name: string; alt: string; wide?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- pre-sized copies; Cloudflare has no image resizer here
  return <img src={`/site/${name}-s.jpg`} srcSet={`/site/${name}-s.jpg 600w, /site/${name}.jpg 1200w`} sizes={wide ? "(min-width: 900px) 50vw, 100vw" : "(min-width: 900px) 25vw, 50vw"} alt={alt} loading="lazy" decoding="async" />;
}

// The time this page was made (a function, so it isn't read during render).
function madeAt(): number {
  return Date.now();
}

// What each price card ticks (every one is built; the numbers are PLANS').
function planTicks(p: Plan): string[] {
  const online = p.fromPublish ? `${p.duration} online from publishing` : `Online until ${p.duration} after the event`;
  const last = p.key === "keepsake" ? "Full-quality download, no in2min2 badge"
    : p.key === "popup" ? "Every design, envelope and music" : p.key === "season" ? "Everything in Free" : "Everything in Season";
  return [online, `${p.guestLimit} people`, `${p.photoLimit?.toLocaleString("en-GB")} photos`, `${p.aiWrites} AI writes`, last];
}

export default function Home() {
  const now = madeAt();
  const hero = heroSample();
  const words = wordsSample();
  const shows = heroShows();
  const bigDay = bigDaySample();
  const wedding = heroWedding();
  const family = PLANS.filter((p) => ["popup", "season", "half_year", "keepsake"].includes(p.key));
  return (
    <div className="s-site">
      {/* What in2min2 is, for Google, Bing and AI assistants (lib/site-facts.ts). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(now)).replace(/</g, "\\u003c") }} />
      <SiteHeader />

      <main>
        {/* ── Hero: the owner's photos turning behind (zooming gently, the
             next sliding in), the words on a shade only where they sit, and
             the tablet and phone changing together through six events. ── */}
        <section className="s-hero">
          <div className="s-heroshow" aria-hidden="true">
            {HERO_PHOTOS.map(([name, at], i) => (
              // eslint-disable-next-line @next/next/no-img-element -- pre-sized copies; Cloudflare has no image resizer here
              <img key={name} src={`/site/${name}-s.jpg`} srcSet={`/site/${name}-s.jpg 900w, /site/${name}.jpg 1600w`} sizes="100vw" alt=""
                style={{ objectPosition: at }} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "low"} decoding="async" />
            ))}
          </div>
          <div className="s-heroshade" aria-hidden="true" />
          <div className="s-wrap s-herogrid">
            <div className="s-herotext">
              <p className="s-pill">Free until 31 January 2027</p>
              <h1 className="s-h1">Create. Invite. <span>Celebrate.</span></h1>
              <p className="s-lead"><strong>Your event online in two minutes.</strong> Make a beautiful invitation and event page on your phone. Send one link on WhatsApp, Viber or Facebook. Guests reply, share photos and leave messages, all in one place.</p>
              <div className="s-btnrow">
                <Link href="/new" className="s-btn s-btn-go">Start free</Link>
                <GuestDemoButton data={hero} title={hero.copy.card_headline || hero.title} className="s-btn s-btn-ghost-light">
                  <span className="s-play" aria-hidden="true">▶</span>See what your guests get
                </GuestDemoButton>
              </div>
              <ShareStrip compact />
              <p className="s-small">No app to download. Works on any phone.</p>
            </div>
            <HeroDevices shows={shows} now={now} />
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="s-strip" aria-label="What you get">
          <ul className="s-wrap s-striplist">
            <li><b>Your languages</b> English, Nepali, Hindi, Punjabi and more</li>
            <li><b>AI writer</b> Your first draft in seconds</li>
            <li><b>On the day</b> Photos, comments and the TV wheel</li>
            <li><b>Fair price</b> Free to start, from £9 to keep longer</li>
          </ul>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="s-section">
          <div className="s-wrap">
            <p className="s-kicker">How it works</p>
            <h2 className="s-h2">Four simple steps</h2>
            <p className="s-lead s-narrow">You don’t need to be good with computers. The builder asks one thing at a time, and most answers are a tap.</p>
            <div className="s-howgrid">
              <div className="s-phone s-howphone" aria-hidden="true">
                <div className="s-phonescreen s-howscreen">
                                    <div className="s-scene s-scene1">
                    <p className="s-mini-step">Step 1 of 4</p>
                    <p className="s-mini-h">What are you celebrating?</p>
                    <div className="s-mini-tiles">
                      <span className="s-mt s-mt-on s-c1"><i>🎂</i>Birthday</span><span className="s-mt s-c2"><i>💍</i>Wedding</span>
                      <span className="s-mt s-c3"><i>🍚</i>Pasni</span><span className="s-mt s-c4"><i>🎄</i>Christmas</span>
                    </div>
                    <span className="s-minihand"><TapHand fill="#FFC94A" /></span>
                  </div>
                  <div className="s-scene s-scene2">
                    <p className="s-mini-step">Step 2 of 4</p>
                    <p className="s-mini-h">Whose birthday is it?</p>
                    <span className="s-mini-input"><span className="s-typed">Sagar</span></span>
                    <p className="s-mini-lab">Age</p>
                    <div className="s-mini-chips"><span>21st</span><span className="s-on">23rd</span><span>30th</span></div>
                    <p className="s-mini-lab">When</p>
                    <div className="s-mini-chips"><span className="s-on">Sat 12 Dec</span><span>7pm</span></div>
                  </div>
                  <div className="s-scene s-scene3">
                    <p className="s-mini-step">Step 3 of 4</p>
                    <p className="s-mini-ai">✨ The AI is writing…</p>
                    <p className="s-mini-line s-l1">Join us for Sagar’s 23rd birthday! Food, music and lots of dancing.</p>
                    <p className="s-mini-line s-l2" lang="ne">सागरको २३ औँ जन्मदिनमा तपाईंलाई हार्दिक निमन्त्रणा छ।</p>
                    <div className="s-mini-chips"><span>Warm</span><span className="s-on">Fun</span><span>Formal</span></div>
                  </div>
                  <div className="s-scene s-scene4">
                    <p className="s-mini-step">You’re live! 🎉</p>
                    <div className="s-wa">
                      <div className="s-wa-card"><span className="s-wa-pic" /><span><b>Sagar’s 23rd birthday</b><small>in2min2.com</small></span></div>
                      <p>You’re invited! Please reply here 👇</p>
                    </div>
                    <p className="s-mini-ok">✓ Asha: Yes, 3 of us</p>
                    <p className="s-mini-ok">✓ Hari: Yes, 2 of us</p>
                    <p className="s-mini-ok s-maybe">? Gita: Maybe</p>
                  </div>
                </div>
                <PhoneChrome dark={false} />
              </div>
              <ol className="s-steps">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="s-step" style={{ ["--i" as string]: i }}>
                    <span className="s-stepnum">{i + 1}</span>
                    <span><b>{s.title}</b><span>{s.line}</span></span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="s-center"><Link href="/new" className="s-btn s-btn-go">Try it now, it’s free</Link></div>
          </div>
        </section>

        {/* ── Events ── */}
        <section id="events" className="s-section s-tint">
          <div className="s-wrap">
            <p className="s-kicker">Events</p>
            <h2 className="s-h2">For every kind of celebration</h2>
            <p className="s-lead s-narrow">Each kind of event comes ready: the right questions, a design to match, the day plan and words you can share. Change anything you like.</p>
            <h3 className="s-h3">For you and your family</h3>
            <div className="s-cards">
              {FAMILY.map((e) => <EventCard key={e.type} e={e} now={now} />)}
            </div>
            <h3 className="s-h3">For communities and organisations</h3>
            <div className="s-cards s-cards-5">
              {COMMUNITY.map((e) => <EventCard key={e.type} e={e} now={now} />)}
            </div>
            <nav className="s-related" aria-label="Also made for">
              <span>Also made for:</span>
              {KIND_PAGES.filter((k) => ![...FAMILY, ...COMMUNITY].some((e) => e.type === k.type)).map((k) => <Link key={k.type} href={`/${k.type}`}>{k.name}</Link>)}
            </nav>
          </div>
        </section>

        <WhySection />

        {/* ── Words ── */}
        <section className="s-section">
          <div className="s-wrap s-split">
            <div>
              <p className="s-kicker">Your words, your way</p>
              <h2 className="s-h2">Written for you, in your languages</h2>
              <p className="s-lead">The AI writes your invitation in seconds. Then you make it yours.</p>
              <ul className="s-ticks">
                <li><b>Two languages on one card,</b> for example English with Nepali, Hindi or Punjabi underneath, so grandparents and grandchildren can both read it.</li>
                <li><b>Choose the tone:</b> warm, formal, fun or festive.</li>
                <li><b>Ready to send:</b> messages for WhatsApp, Facebook and text, with the right link, for each step from the invitation to the thank-you.</li>
                <li><b>You’re in charge.</b> The AI only suggests. Nothing goes live until you check it and press Publish.</li>
              </ul>
            </div>
            <div className="s-wordsart" aria-hidden="true">
              <div className="s-phone"><div className="s-phonescreen"><EventView data={words} view="card" now={now} thumb /></div><PhoneChrome bg={words.palette.bg} battery={64} /></div>
            </div>
          </div>
        </section>

        {/* ── The big days (owner, 23 Nov 2026): weddings and other big
             celebrations, where the season brings hundreds of guests, shown as
             "big celebrations" rather than weddings alone. ── */}
        <section className="s-section s-tint">
          <div className="s-wrap s-split">
            <div className="s-fullphone">
              <AutoPlayPhone data={bigDay} title={bigDay.copy.card_headline || bigDay.title} now={now} label="A wedding invitation opening, then the whole page, as guests see it" />
            </div>
            <div>
              <p className="s-kicker">The big days</p>
              <h2 className="s-h2">Made for big celebrations</h2>
              <p className="s-lead">Weddings, receptions, engagements and milestone anniversaries bring hundreds of guests and more than one event. in2min2 keeps it all on one link, and looks the part.</p>
              <ul className="s-ticks">
                <li><b>Every event, one link:</b> mehndi, sangeet, haldi, the ceremony and the reception, each with its own day, time and place.</li>
                <li><b>Every guest by name:</b> personal invitations with their name on the envelope, and replies counted in people, with food needs for the caterer.</li>
                <li><b>Both families, both languages:</b> English with Nepali, Hindi or Punjabi on the same invitation.</li>
                <li><b>On the day:</b> everyone’s photos on the big screen at the reception, your photographer’s work with their name, and a thank-you page to keep.</li>
                <li><b>Room for everyone:</b> plans for 300, 400 or 500 guests, more at £3 for each 100, and your page and photos kept for up to 12 months.</li>
              </ul>
              <div className="s-btnrow">
                <Link href="/wedding" className="s-btn s-btn-go">See wedding pages</Link>
                <Link href="/engagement" className="s-btn s-btn-line">Engagements</Link>
                <Link href="/anniversary" className="s-btn s-btn-line">Anniversaries</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── On the day ── */}
        <section className="s-section s-night">
          <div className="s-wrap s-split s-split-rev">
            <div>
              <p className="s-kicker">On the day</p>
              <h2 className="s-h2">Everyone joins in</h2>
              <p className="s-lead">Guests add photos from their own phones. No app, no sign-up.</p>
              <ul className="s-ticks">
                <li><b>The photo wheel:</b> everyone’s photos turn on a wheel. Tap the heart to love one.</li>
                <li><b>Comments and cheers</b> float up live, like on a video.</li>
                <li><b>On the big screen:</b> put the wheel or a slideshow on the TV at the venue, with a QR code so more guests join in.</li>
                <li><b>Updates:</b> “Food is served”, “Car park full”: guests see it straight away.</li>
              </ul>
            </div>
            <WheelDemo vars={eventVars(wedding.palette, wedding.textStyle)} />
          </div>
        </section>

        {/* ── Afterwards ── */}
        <section className="s-section">
          <div className="s-wrap s-split">
            <div className="s-mosaic" aria-hidden="true">
              <Photo name="marquee" alt="" /><Photo name="christmas" alt="" /><Photo name="wedding" alt="" /><Photo name="newyear" alt="" />
            </div>
            <div>
              <p className="s-kicker">Afterwards</p>
              <h2 className="s-h2">A memory to keep</h2>
              <p className="s-lead">The day after, your page turns into a thank-you page by itself, with your message and everyone’s photos in one gallery.</p>
              <ul className="s-ticks">
                <li><b>Save any photo</b> to your phone, free.</li>
                <li><b>Guests’ messages</b> stay with the photos, to read again later.</li>
                <li><b>Online until 90 days after the day,</b> free. Longer plans from February.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Bigger events ── */}
        <section className="s-section s-tint">
          <div className="s-wrap s-split s-split-rev">
            <div>
              <p className="s-kicker">Bigger events</p>
              <h2 className="s-h2">For societies, clubs and organisers</h2>
              <p className="s-lead">Melas, tournaments, charity days and cultural shows can already have their own page, programme, updates and photo wall.</p>
              <div className="s-soon">
                <span>Online tickets</span><span>Business stalls</span><span>Sponsors</span><span>Team entries and fixtures</span>
              </div>
              <p className="s-small">These are coming soon. Running a big event in 2027? Email <a href="mailto:hello@in2min2.com">hello@in2min2.com</a> and we’ll help you set it up.</p>
            </div>
            <div className="s-bigpic"><Photo name="sport" alt="A football tournament with teams, tents and supporters" wide /></div>
          </div>
        </section>

        {/* ── Prices ── */}
        <section id="prices" className="s-section">
          <div className="s-wrap">
            <p className="s-kicker">Prices</p>
            <h2 className="s-h2">Prices</h2>
            <p className="s-lead">Pay once per event. No subscription.</p>
            <div className="s-offer">
              <span className="s-offer-tag">Festive offer</span>
              <p className="s-offer-h">Completely free until 31 January 2027</p>
              <p>Every family event, for up to 300 people and 300 photos, online for 90 days after the day. No card needed.</p>
              <Link href="/new" className="s-btn s-btn-go">Start free</Link>
            </div>
            <h3 className="s-h3">From 1 February 2027</h3>
            <div className="s-plans">
              {family.map((p) => {
                const offer = p.key === "season" && now < FESTIVE_UNTIL; // the festive offer gives exactly Season's allowance
                return (
                  <div key={p.key} className="s-plan" data-best={p.key === "season" ? "" : undefined}>
                    {p.key === "season" && <span className="s-plan-best">Our pick</span>}
                    <p className="s-plan-name">{p.name}</p>
                    {offer ? (
                      <>
                        <p className="s-plan-price"><s>{formatPence(p.pricePence)}</s></p>
                        <p className="s-plan-offer">Free until 31 January</p>
                        <p className="s-plan-from">then {formatPence(p.pricePence)}</p>
                      </>
                    ) : (
                      <>
                        <p className="s-plan-price">{p.pricePence ? formatPence(p.pricePence) : "Free"}</p>
                        <p className="s-plan-from">{p.pricePence ? "from 1 February" : "always"}</p>
                      </>
                    )}
                    <ul className="s-plan-ticks">
                      {planTicks(p).map((t) => <li key={t}>{t}</li>)}
                    </ul>
                    <p className="s-plan-for">Best for: {p.bestFor}</p>
                  </div>
                );
              })}
            </div>
            <p className="s-small s-center-text">Run out on the day? Add 100 people for {formatPence(PLANS[0].packPence ?? 300)}, or move up a plan and pay only the difference. Memorials are always free. Community events: a free page, and a small fee only on online ticket sales (coming soon).</p>
            {/* Paying, with the same trust as sharing (owner, 23 Nov 2026). Payments open in February. */}
            <div className="s-paytrust">
              <div className="s-payhead">
                <span className="s-paylock" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
                </span>
                <div>
                  <p className="s-payh">Safe, simple payments</p>
                  <p className="s-paysub">Paid plans open in February 2027</p>
                </div>
              </div>
              <div className="s-paycards" role="list" aria-label="Ways to pay">
                {PAY_ORDER.map((k) => <span key={k} role="listitem"><PayCard pay={k} /></span>)}
              </div>
              <p className="s-paystripe">Secure checkout by <StripeLogo height={20} />. Your card details go straight to Stripe: we never see them.</p>
              <ul className="s-payticks">
                <li>Pay once per event, no subscription</li>
                <li>No card needed to start</li>
                <li>Cancel within 14 days, as UK law allows</li>
                <li>If we let you down, you may get your money back</li>
              </ul>
            </div>
          </div>
        </section>

        <TrustBand tint />

        {/* ── Why ── */}
        <section className="s-section s-why">
          <div className="s-wrap s-narrow s-center-text">
            <p className="s-kicker">Why we made in2min2</p>
            <h2 className="s-h2">Your special day shouldn’t be hard work</h2>
            <p className="s-lead">We love a good celebration. But planning one can be expensive and complicated. in2min2 helps you make the invitation, set the mood on the day, and keep the memories, without the cost and without the stress.</p>
            <p className="s-lead">We keep it simple, creative and fun, and we add new features all the time.</p>
            {/* The owner's banner (21 Nov 2026), with what the logo means. */}
            <div className="s-logomean">
              {/* eslint-disable-next-line @next/next/no-img-element -- the banner, already sized */}
              <img src="/brand/logo-banner.png" alt="in2min2: a stopwatch, a ticket and people celebrating. Create, Invite, Celebrate" width={476} height={226} loading="lazy" />
              <h3 className="s-h3">What our logo means</h3>
              <ul className="s-meanlist">
                <li><i aria-hidden="true">⏱️</i><span><b>The stopwatch:</b> your invitation ready in about two minutes.</span></li>
                <li><i aria-hidden="true">🎟️</i><span><b>The ticket:</b> your invitation, shared with one link.</span></li>
                <li><i aria-hidden="true">🙌</i><span><b>The people and the star:</b> everyone together, celebrating.</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Questions ── */}
        <section id="questions" className="s-section s-tint">
          <div className="s-wrap s-narrow">
            <p className="s-kicker">Questions</p>
            <h2 className="s-h2">Good to know</h2>
            <div className="s-faq">
              {QUESTIONS.map((x) => (
                <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Last call ── */}
        <section className="s-section s-final">
          <div className="s-wrap s-center-text">
            <h2 className="s-h2">Ready when you are</h2>
            <p className="s-lead">Your first invitation takes about two minutes. It’s free.</p>
            <Link href="/new" className="s-btn s-btn-go s-btn-big">Start free</Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function EventCard({ e, now }: { e: { type: string; title: string; line: string; photo?: string; card?: string }; now: number }) {
  return (
    <Link href={`/${e.type}`} className="s-card">
      <span className="s-cardpic" data-kind={e.card ? "card" : "photo"}>
        {e.photo ? <Photo name={e.photo} alt="" /> : <span className="s-cardinv"><EventView data={kindSample(e.card!)} view="card" now={now} thumb /></span>}
      </span>
      <span className="s-cardtext">
        <b>{e.title}</b>
        <span>{e.line}</span>
        <span className="s-cardgo">See more →</span>
      </span>
    </Link>
  );
}
