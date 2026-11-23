"use client";

// How in2min2 works (in2min2.com/new/guide; owner, 16 Nov 2026: "demo pages
// for people to get an idea from: how to create an event page, edit and
// refine, send the invite, where the replies arrive, the day with comments
// and the wheel, and the thank-you"). Six short steps, each with a real,
// working example drawn by the same code guests see, and a button to try
// it. Sample event: "Sita's 50th birthday"; pictures are drawn scenes of
// hills, rivers and flowers (components/photos/samples.ts), never real people.
// Bigger and ticketed events get their own guide in the second build.

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { MotionConfig } from "motion/react";
import EventView, { eventVars } from "@/components/event/event-view";
import { Icon, type IconName } from "@/components/icons";
import { CheerFloats, LiveOverlay, Notices } from "@/components/live/cheers";
import { PreviewWheel } from "@/components/photos/preview-wheel";
import { applyType, newDraft, toViewData, type Draft } from "@/lib/draft";
import type { Cheer, CheerEmoji, Float } from "@/lib/live";
import { applyLook, looksFor, saturday, suggestedWords } from "../kinds";
import { ThemeButton } from "../ui";

function sample(): Draft {
  const d0 = applyType(newDraft(), "birthday");
  const look = looksFor("birthday").find((l) => l.key === "sindoor") ?? looksFor("birthday")[0];
  const d: Draft = {
    ...applyLook(d0, look), title: "Sita’s 50th birthday", milestone: "50th", stars: { ...d0.stars, names: "Sita" },
    date: saturday(1), startTime: "14:00", endTime: "18:00", venueName: "Riverside Community Hall", venueAddress: "1 Station Road",
    family: [{ relation: "Parents", names: "Ram & Gita Gurung" }], topLine: "॥ श्री गणेशाय नमः ॥",
    functions: [
      { id: "g1", title: "Guests arrive", time: "14:00", date: "", place: "", note: "", meal: false, menu: [] },
      { id: "g2", title: "Lunch", time: "15:00", date: "", place: "", note: "", meal: true, menu: [{ course: "Main", dish: "Dal bhat" }, { course: "Dessert", dish: "Cake" }] },
      { id: "g3", title: "Cake and dancing", time: "16:30", date: "", place: "", note: "", meal: false, menu: [] },
    ],
  };
  return {
    ...d, copy: {
      ...suggestedWords(d),
      post_event_thank_you: "Thank you for making Sita’s 50th so special! Every hug, every dance and every photo meant the world to us.",
    },
  };
}

const CHEERS: Cheer[] = [
  { id: "c3", name: "Maya", body: "Dancing all night! 💃", emoji: "fire", at: "" },
  { id: "c2", name: "Hari", body: "What a party! The cake was amazing", emoji: "party", at: "" },
  { id: "c1", name: "Asha", body: "Happy birthday Sita! 🎂", emoji: "love", at: "" },
];

// Cheers float up now and then, as they do on the day.
function useDemoFloats(): Float[] {
  const [floats, setFloats] = useState<Float[]>([]);
  useEffect(() => {
    const kinds: CheerEmoji[] = ["clap", "love", "party", "wow", "tears", "fire"];
    let n = 0;
    const t = window.setInterval(() => {
      n++;
      const f = { key: `d${n}`, emoji: kinds[n % kinds.length] };
      setFloats((x) => [...x.slice(-8), f]);
      window.setTimeout(() => setFloats((x) => x.filter((y) => y.key !== f.key)), 4200);
    }, 1300);
    return () => window.clearInterval(t);
  }, []);
  return floats;
}

export default function Guide() {
  const [d] = useState(sample);
  const [now] = useState(() => Date.now());
  const view = toViewData(d);
  const floats = useDemoFloats();
  const t = (n: number) => `Step ${n} of 6`;
  return (
    <MotionConfig reducedMotion="user">
      <div className="b2-shell">
        <header className="b2-top b2-appbar">
          <Link href="/new" className="b2-brand" style={{ color: "inherit", textDecoration: "none" }}>in2min2</Link>
          <ThemeButton />
        </header>
        <main className="b2-screen" style={{ gap: 26, paddingBottom: 60 }}>
          <section className="b2-guidehero">
            <Hills />
            <div style={{ display: "grid", gap: 10 }}>
              <p className="b2-kicker">How it works</p>
              <h1 className="b2-h1">From invitation to thank-you</h1>
              <p className="b2-lead">Six short steps, with real examples. Everything here works the same on your own event.</p>
            </div>
          </section>

          <Step n={1} tag={t(1)} icon="sparkle" title="Make your event in two minutes"
            line="Tap what you’re celebrating, then answer a few quick questions. The words are written for you; pick a look you like."
            try={{ href: "/new", label: "Start an event" }}>
            <div className="b2-guidecard"><EventView data={view} view="card" now={now} /></div>
            <p className="b2-small">This is “Royal red & gold”, with a blessing at the top. Every look takes your own colours.</p>
          </Step>

          <Step n={2} tag={t(2)} icon="pen" title="Change anything, any time"
            line="Your event home has a tile for everything: the words, when and where, the day plan, the look, people. Tap one, change it, tap Done."
            try={{ href: "/new", label: "Open my event" }}>
            <div className="b2-guidetiles" aria-hidden="true">
              {([["pen", "Invitation words", "#ffb627"], ["calendar", "When and where", "#22b8cf"], ["clock", "Day plan", "#45c486"], ["palette", "Look", "#a99dff"]] as [IconName, string, string][]).map(([i, l, c]) => (
                <span key={l}><i style={{ background: c }}><Icon name={i} className="" /></i>{l}</span>
              ))}
            </div>
            <div className="b2-chips" aria-hidden="true">
              {["Shorter", "Warmer", "More formal", "More fun"].map((x) => <span key={x} className="b2-chip b2-chip-sm b2-chip-ai">{x}</span>)}
            </div>
            <p className="b2-small">Not happy with a sentence? One tap and the AI makes it shorter, warmer, more formal or more fun. The little card at the bottom shows every change as you make it.</p>
          </Step>

          <Step n={3} tag={t(3)} icon="share" title="Send the invitation"
            line="Publish, then tap Share. The invitation is at the top: send it on WhatsApp, as a text, or print its QR code on a card."
            try={{ href: "/new", label: "Go to Share" }}>
            <div className="b2-chat" aria-hidden="true">
              <p>You’re invited: Sita’s 50th birthday<br />Saturday, 2pm · Riverside Community Hall<br />All the details, and please reply here:</p>
              <div className="b2-chatlink">
                <div className="b2-chatcard"><EventView data={view} view="card" now={now} thumb /></div>
                <span><strong>Sita is 50!</strong><small>in2min2.com</small></span>
              </div>
            </div>
            <p className="b2-small">Later messages wait in Share with their dates: the running order the week before, a reminder the day before, the photo link on the day, and the thank-you afterwards.</p>
          </Step>

          <Step n={4} tag={t(4)} icon="envelope" title="Replies come to you"
            line="Guests reply on the invitation: yes, no or maybe, and how many. You see every reply on Replies, and the bell tells you when new ones arrive."
            try={{ href: "/new", label: "See Replies" }}>
            <div className="b2-guidelist" aria-hidden="true">
              <p><strong>12</strong> coming · 3 maybe · 2 can’t come</p>
              {[["Asha Gurung", "Coming · 3", "Can’t wait! We’ll bring the cake."], ["Hari Thapa", "Maybe · 2", ""], ["Gita Rai", "Can’t come", "Sorry, away that weekend"]].map(([n, s, m]) => (
                <div key={n}><strong>{n}</strong><span className="b2-pill">{s}</span>{m && <small>“{m}”</small>}</div>
              ))}
            </div>
          </Step>

          <Step n={5} tag={t(5)} icon="images" title="On the day: photos, comments and the TV"
            line="Guests add photos from their phones, with no app. They turn on this wheel, with everyone’s comments and cheers. Post news like “Car park full” with Announce."
            try={{ href: "/new", label: "Try the photo wheel" }}>
            <div className="ev-frame b2-guidewheel">
              <div className="ev-root" style={eventVars(view.palette, view.textStyle)} data-motion="on">
                <Notices list={[{ id: "a1", kind: "urgent", body: "The car park is full. Please park at the school on Station Road.", at: new Date(now).toISOString() }]} />
                <div className="ev-wheelHold" style={{ padding: "0 min(calc(var(--u) * 6), 36px)" }}>
                  <PreviewWheel d={{ ...view, cover: null, moreCovers: [] }} />
                  <LiveOverlay cheers={CHEERS} />
                  <CheerFloats floats={floats} />
                </div>
              </div>
            </div>
            <p className="b2-small">Put it on the venue’s TV too: comments run down the side, and the QR code invites everyone to join in.</p>
          </Step>

          <Step n={6} tag={t(6)} icon="heart" title="Say thank you"
            line="After the event, your page turns into a thank-you page by itself, with your message and everyone’s photos. Share unlocks the thank-you message then."
            try={{ href: "/new", label: "Preview my thank-you page" }}>
            <div className="b2-guidecard b2-guideclip"><EventView data={view} view="after" now={now} /></div>
          </Step>

          <section className="b2-section" style={{ textAlign: "center", justifyItems: "center" }}>
            <h2 className="b2-h2">Ready?</h2>
            <p className="b2-lead">It’s free to start. Bigger and ticketed events get their own guide soon.</p>
            <Link href="/new" className="b2-btn b2-primary">Make my event</Link>
          </section>
        </main>
      </div>
    </MotionConfig>
  );
}

function Step({ n, tag, icon, title, line, try: tryIt, children }: {
  n: number; tag: string; icon: IconName; title: string; line: string; try: { href: string; label: string }; children: ReactNode;
}) {
  return (
    <section className="b2-section b2-step" aria-labelledby={`step-${n}`}>
      <div className="b2-sectionhead">
        <span className="b2-sicon b2-sicon-lg" aria-hidden="true"><Icon name={icon} className="" /></span>
        <div style={{ display: "grid", gap: 2 }}>
          <span className="b2-kicker">{tag}</span>
          <h2 id={`step-${n}`} className="b2-h3" style={{ fontSize: 21 }}>{title}</h2>
        </div>
      </div>
      <p className="b2-small" style={{ fontSize: 16, color: "var(--b2-text)" }}>{line}</p>
      {children}
      <Link href={tryIt.href} className="b2-btn b2-secondary" style={{ justifySelf: "start", minHeight: 48 }}>{tryIt.label}<Icon name="next" className="" /></Link>
    </section>
  );
}

// Hills, a river and a rising sun: the guide's own drawing.
function Hills() {
  return (
    <svg viewBox="0 0 360 150" className="b2-guideart" aria-hidden="true">
      <defs>
        <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5d7dd0" /><stop offset="0.6" stopColor="#c1bce8" /><stop offset="1" stopColor="#f9dfd0" /></linearGradient>
        <linearGradient id="g-river" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fd3ff" /><stop offset="1" stopColor="#3c8dd9" /></linearGradient>
      </defs>
      <rect width="360" height="150" fill="url(#g-sky)" />
      <circle cx="318" cy="52" r="36" fill="#ffd9a0" opacity="0.3" />
      <circle cx="318" cy="52" r="17" fill="#fff6e0" opacity="0.95" />
      <path d="M0 110 L50 62 L84 90 L130 40 L172 88 L214 56 L262 96 L300 74 L360 104 V150 H0Z" fill="#7b6fb0" opacity="0.75" />
      <path d="M118 52 L130 40 L142 52 L134 50 L130 56 L126 50Z" fill="#fff" />
      <path d="M0 124 Q60 100 120 116 T240 112 T360 120 V150 H0Z" fill="#2e7d4f" />
      <path d="M150 150 C170 136 190 132 230 128 C200 136 190 142 186 150Z" fill="url(#g-river)" />
      {[[30, 132], [60, 138], [92, 134], [270, 136], [320, 140]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="3.4" fill={["#ff6b9a", "#ffb627", "#ffffff", "#ff6b9a", "#ffd56b"][i]} />
          <circle r="1.3" fill="#c0163d" />
        </g>
      ))}
    </svg>
  );
}
