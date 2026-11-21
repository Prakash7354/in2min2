import type { Metadata } from "next";
import Link from "next/link";
import EventView, { eventVars } from "@/components/event/event-view";
import { LegalLinks } from "@/components/legal/legal-page";
import { GuestDemoButton } from "@/components/site/guest-demo";
import { SiteHeader } from "@/components/site/header";
import { WheelDemo } from "@/components/site/wheel-demo";
import { TapHand } from "@/components/tap-hand";
import { formatPence, PLANS } from "@/lib/catalog";
import { heroSample, kindSample, wordsSample } from "@/lib/site-samples";
import "./site.css";

// in2min2.com: the website (owner, 21 Nov 2026). What In2Min2 does, shown
// with real examples: the photos are the owner's free stock photos
// (public/site, docs/reference/site-images.md), and the invitations and the
// photo wheel are the same code guests see. Simple British English, written
// for readers whose first language may not be English. Mobile first.

export const metadata: Metadata = {
  title: "in2min2 · Create, invite, celebrate. Your event online in two minutes",
  description: "Make a beautiful invitation and event page on your phone, free. Guests reply, share photos and leave messages on one link. English, Nepali and more.",
};

const FAMILY = [
  { type: "birthday", title: "Birthdays", line: "From the first birthday to the 60th, with cake, music and everyone’s photos.", photo: "birthday" },
  { type: "wedding", title: "Weddings and receptions", line: "Mehndi, ceremony and reception on one page, in two languages if you like.", photo: "wedding" },
  { type: "pasni", title: "Pasni and Bratabandha", line: "Family ceremonies, with the blessings, the day plan and the menu.", card: "pasni" },
  { type: "anniversary", title: "Anniversaries", line: "25 years, 50 years, or any year worth a party.", card: "anniversary" },
  { type: "christmas", title: "Christmas", line: "A family lunch or a big get-together.", photo: "christmas" },
  { type: "new-year", title: "New Year’s Eve", line: "Count down to midnight together, wherever everyone is.", photo: "newyear" },
  { type: "party", title: "Parties", line: "House-warming, graduation, or just because.", photo: "party" },
  { type: "memorial", title: "Memorials", line: "A funeral, prayers or a day of remembrance. Gentle, respectful, and always free for up to a year.", card: "memorial" },
] as const;
const COMMUNITY = [
  { type: "lhosar", title: "Lhosar", line: "Tamu, Sonam and Gyalpo Lhosar, for the whole community.", card: "lhosar" },
  { type: "mela", title: "Melas and festivals", line: "Music, food and stalls, with the programme for the day.", photo: "festival" },
  { type: "sport", title: "Tournaments", line: "Teams, supporters and the day’s fixtures, with live updates.", photo: "sport" },
  { type: "corporate", title: "Work and office parties", line: "Christmas parties, team dinners and away days.", photo: "office" },
  { type: "reunion", title: "Reunions and regimental days", line: "A 25th year, a regiment or a school: old friends, one link, a day to remember.", card: "reunion" },
] as const;

const STEPS = [
  { title: "Choose your event", line: "Birthday, wedding, Pasni, Lhosar, a party or a tournament. Each one comes with the right questions." },
  { title: "Answer a few questions", line: "Mostly taps: names, the date and the place. Then pick a look you like." },
  { title: "Let the AI write it", line: "In English, Nepali or both, warm, fun or formal. You check every word." },
  { title: "Share and celebrate", line: "Send one link. Guests open an envelope with their name on it, reply, and add photos on the day." },
];

const QUESTIONS = [
  { q: "Is it really free?", a: "Yes. Until 31 January 2027 every family event is free, for up to 300 people and 300 photos, and stays online for 90 days after the day. After that, a short Pop-Up page is still free, and longer plans start at £9. Memorials are always free." },
  { q: "Do my guests need an app or an account?", a: "No. They open your link on any phone, tablet or computer. Only you, the host, sign in, with a code we email you." },
  { q: "Which languages can I use?", a: "English and Nepali are ready, in Nepali script or in English letters. Hindi, Punjabi, Gujarati, Bengali, Tamil, Tagalog and Polish are in beta. You can put two languages on one invitation." },
  { q: "Can I change things after I’ve sent the link?", a: "Yes, any time. Change the time, the place or the words and press Update. The link stays the same." },
  { q: "Who can see my event?", a: "Only people you send the link to. For a private event, each guest gets their own link with their name on the envelope." },
  { q: "Can I use it for a big community event?", a: "Yes. Make the event page, share the programme, post updates on the day and collect photos. Ticketing, stalls and sponsors are coming soon." },
  { q: "How do I get help?", a: "Email hello@in2min2.com and a real person will reply." },
];

function Photo({ name, alt, wide = false }: { name: string; alt: string; wide?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- pre-sized copies; Cloudflare has no image resizer here
  return <img src={`/site/${name}-s.jpg`} srcSet={`/site/${name}-s.jpg 600w, /site/${name}.jpg 1200w`} sizes={wide ? "(min-width: 900px) 50vw, 100vw" : "(min-width: 900px) 25vw, 50vw"} alt={alt} loading="lazy" decoding="async" />;
}

// The time this page was made (a function, so it isn't read during render).
function madeAt(): number {
  return Date.now();
}

export default function Home() {
  const now = madeAt();
  const hero = heroSample();
  const words = wordsSample();
  const family = PLANS.filter((p) => ["popup", "season", "half_year", "keepsake"].includes(p.key));
  return (
    <div className="s-site">
      <SiteHeader />

      <main>
        {/* ── Hero ── */}
        <section className="s-hero">
          <div className="s-wrap s-herogrid">
            <div className="s-herotext">
              <p className="s-pill">Free until 31 January 2027</p>
              <h1 className="s-h1">Create. Invite. <span>Celebrate.</span></h1>
              <p className="s-lead"><strong>Your event online in two minutes.</strong> Make a beautiful invitation and event page on your phone. Send one link on WhatsApp or Facebook. Guests reply, share photos and leave messages, all in one place.</p>
              <div className="s-btnrow">
                <Link href="/new" className="s-btn s-btn-go">Start free</Link>
                <GuestDemoButton data={hero} title={hero.copy.card_headline || hero.title} className="s-btn s-btn-line">
                  <span className="s-play" aria-hidden="true">▶</span>See what your guests get
                </GuestDemoButton>
              </div>
              <p className="s-small">No app to download. Works on any phone.</p>
            </div>
            <div className="s-heroart" aria-hidden="true">
              <div className="s-heropic"><Photo name="hero-birthday" alt="" wide /></div>
              <div className="s-phone s-herophone"><div className="s-phonescreen"><EventView data={hero} view="card" now={now} thumb /></div></div>
              <span className="s-chip s-chip-a">✓ 32 coming</span>
              <span className="s-chip s-chip-b">📷 128 photos</span>
              <span className="s-chip s-chip-c">💬 Happy birthday, Sita!</span>
            </div>
          </div>
        </section>

        {/* ── What you get ── */}
        <section className="s-strip" aria-label="What you get">
          <ul className="s-wrap s-striplist">
            <li><b>Two languages</b> English and Nepali, and more</li>
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
                    <p className="s-mini-h">What are you celebrating?</p>
                    <div className="s-mini-tiles">
                      <span className="s-mt s-mt-on"><i>🎂</i>Birthday</span><span className="s-mt"><i>💍</i>Wedding</span>
                      <span className="s-mt"><i>🍚</i>Pasni</span><span className="s-mt"><i>🎄</i>Christmas</span>
                    </div>
                    <span className="s-minihand"><TapHand fill="#FFC94A" /></span>
                  </div>
                  <div className="s-scene s-scene2">
                    <p className="s-mini-h">Whose birthday is it?</p>
                    <span className="s-mini-input"><span className="s-typed">Sita</span></span>
                    <div className="s-mini-chips"><span>21st</span><span className="s-on">23rd</span><span>30th</span></div>
                    <div className="s-mini-chips"><span className="s-on">Sat 12 Dec</span><span>7pm</span></div>
                  </div>
                  <div className="s-scene s-scene3">
                    <p className="s-mini-ai">✨ The AI is writing…</p>
                    <p className="s-mini-line s-l1">Join us for Sita’s 23rd birthday! Food, music and lots of dancing.</p>
                    <p className="s-mini-line s-l2" lang="ne">सीताको २३ औँ जन्मदिनमा तपाईंलाई हार्दिक निमन्त्रणा छ।</p>
                    <div className="s-mini-chips"><span>Warm</span><span className="s-on">Fun</span><span>Formal</span></div>
                  </div>
                  <div className="s-scene s-scene4">
                    <div className="s-wa">
                      <div className="s-wa-card"><span className="s-wa-pic" /><span><b>Sita’s 23rd birthday</b><small>in2min2.com</small></span></div>
                      <p>You’re invited! Please reply here 👇</p>
                    </div>
                    <p className="s-mini-ok">✓ Asha: Yes, 3 of us</p>
                    <p className="s-mini-ok">✓ Hari: Yes, 2 of us</p>
                    <p className="s-mini-ok s-maybe">? Gita: Maybe</p>
                  </div>
                </div>
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
          </div>
        </section>

        {/* ── Words ── */}
        <section className="s-section">
          <div className="s-wrap s-split">
            <div>
              <p className="s-kicker">Your words, your way</p>
              <h2 className="s-h2">Written for you, in your languages</h2>
              <p className="s-lead">The AI writes your invitation in seconds. Then you make it yours.</p>
              <ul className="s-ticks">
                <li><b>Two languages on one card,</b> for example English with Nepali underneath, so grandparents and grandchildren can both read it.</li>
                <li><b>Choose the tone:</b> warm, formal, fun or festive.</li>
                <li><b>Ready to send:</b> messages for WhatsApp, Facebook and text, with the right link, for each step from the invitation to the thank-you.</li>
                <li><b>You’re in charge.</b> The AI only suggests. Nothing goes live until you check it and press Publish.</li>
              </ul>
            </div>
            <div className="s-wordsart" aria-hidden="true">
              <div className="s-phone"><div className="s-phonescreen"><EventView data={words} view="card" now={now} thumb /></div></div>
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
            <WheelDemo vars={eventVars(words.palette, words.textStyle)} />
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
                <li><b>Online for 90 days</b> during our festive offer, and longer plans from February.</li>
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
            <h2 className="s-h2">Simple and fair</h2>
            <div className="s-offer">
              <span className="s-offer-tag">Festive offer</span>
              <p className="s-offer-h">Completely free until 31 January 2027</p>
              <p>Every family event, for up to 300 people and 300 photos, online for 90 days after the day. No card needed.</p>
              <Link href="/new" className="s-btn s-btn-go">Start free</Link>
            </div>
            <h3 className="s-h3">From 1 February 2027</h3>
            <div className="s-plans">
              {family.map((p) => (
                <div key={p.key} className="s-plan" data-best={p.key === "season" ? "" : undefined}>
                  {p.key === "season" && <span className="s-plan-best">Our pick</span>}
                  <p className="s-plan-name">{p.name}</p>
                  <p className="s-plan-price">{p.pricePence ? formatPence(p.pricePence) : "Free"}</p>
                  <p className="s-plan-line">Online {p.duration} after the event</p>
                  <p className="s-plan-line">{p.guestLimit} people · {p.photoLimit?.toLocaleString("en-GB")} photos</p>
                  <p className="s-plan-for">{p.bestFor}</p>
                </div>
              ))}
            </div>
            <p className="s-small s-center-text">Need room for more people? Add 100 for £3. Pay once per event, no subscription. Memorials are always free. Community events: a free page, and a small fee only on online ticket sales (coming soon).</p>
          </div>
        </section>

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

      <footer className="s-footer">
        <div className="s-wrap s-footgrid">
          <div className="s-footbrand">
            {/* eslint-disable-next-line @next/next/no-img-element -- the logo */}
            <img src="/brand/logo.png" alt="in2min2: Create, Invite, Celebrate" width={640} height={330} />
            <p>Beautiful invitations and event pages, from the invitation to the thank-you.</p>
          </div>
          <nav aria-label="Make an event">
            <p className="s-foothead">Make an event</p>
            <Link href="/new">Start free</Link>
            <a href="#how">How it works</a>
            <a href="#events">Events</a>
            <a href="#prices">Prices</a>
          </nav>
          <nav aria-label="Help">
            <p className="s-foothead">Help</p>
            <a href="#questions">Questions</a>
            <Link href="/new/guide">Step-by-step guide</Link>
            <a href="mailto:hello@in2min2.com">hello@in2min2.com</a>
          </nav>
        </div>
        <div className="s-wrap s-footlow">
          <p>© 2026 in2min2 · A GoChuchuro product · Made in the UK</p>
          <LegalLinks className="s-legal" />
        </div>
      </footer>
    </div>
  );
}

function EventCard({ e, now }: { e: { type: string; title: string; line: string; photo?: string; card?: string }; now: number }) {
  return (
    <Link href={`/new?type=${e.type}`} className="s-card">
      <span className="s-cardpic" data-kind={e.card ? "card" : "photo"}>
        {e.photo ? <Photo name={e.photo} alt="" /> : <span className="s-cardinv"><EventView data={kindSample(e.card!)} view="card" now={now} thumb /></span>}
      </span>
      <span className="s-cardtext">
        <b>{e.title}</b>
        <span>{e.line}</span>
        <span className="s-cardgo">Start one →</span>
      </span>
    </Link>
  );
}
