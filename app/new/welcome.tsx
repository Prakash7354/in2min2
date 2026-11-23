"use client";

// Welcome, the first time someone opens the builder (owner, 19 Nov 2026):
// what in2min2 does in one line, a button that plays what guests get (the
// envelope with their name, then the invitation, with music), and the three
// steps, each lit up in turn with a hand tapping it. Shown until they start.

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { TapHand } from "@/components/tap-hand";
import { toViewData } from "@/lib/draft";
import { useB2 } from "./context";
import { GuestDemo, sampleWedding } from "./demo";
import { YourEventsRow } from "./events";
import { AccountButton } from "./sheets";
import { BottomBar, HAND, Hint, markHint, ThemeButton } from "./ui";

export const WELCOMED = "welcome";

const STEPS: { icon: IconName; from: string; to: string; title: string; line: string }[] = [
  { icon: "cake", from: "#ff7a59", to: "#e5484d", title: "Tap what you’re celebrating", line: "Birthday, wedding, Pasni, Lhosar, a party and more." },
  { icon: "message", from: "#8b7cff", to: "#5e35b1", title: "Answer a few quick questions", line: "Mostly taps, hardly any typing. The AI can write the words." },
  { icon: "share", from: "#2fd27a", to: "#0b8a5f", title: "Share one link", line: "On WhatsApp or as a QR code. Replies and photos come back to you." },
];

export function Welcome() {
  const b = useB2();
  const [watching, setWatching] = useState(false);
  const [sample] = useState(() => toViewData(sampleWedding()));
  const start = () => { markHint(WELCOMED); b.go({ screen: "what" }); };
  return (
    <>
      <header className="b2-top b2-appbar">
        <span className="b2-brand">in2min2</span>
        <span style={{ display: "flex", gap: 8 }}><ThemeButton /><AccountButton /></span>
      </header>
      <section className="b2-screen b2-welcome">
        <p className="b2-kicker">Welcome</p>
        <h1 className="b2-h1">Invitations people love to open</h1>
        <p className="b2-lead">Make yours in about two minutes, on your phone. Free to start.</p>
        <YourEventsRow />

        <button type="button" className="b2-watch" onClick={() => { markHint("welcome-watch"); setWatching(true); }}>
          <span className="b2-watch-env" aria-hidden="true"><span>M</span></span>
          <span>
            <strong>See what your guests get</strong>
            <small>An envelope with their name on it, then your invitation, with music</small>
          </span>
          <span className="b2-watch-play" aria-hidden="true"><Icon name="play" className="" /></span>
          <Hint id="welcome-watch" label="Watch" />
        </button>

        <ol className="b2-wsteps" aria-label="How it works">
          {STEPS.map((s, i) => (
            <li key={s.title} className="b2-wstep" style={{ "--i": i } as CSSProperties}>
              <span className="b2-art" style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }} aria-hidden="true"><Icon name={s.icon} className="" /></span>
              <span><strong>{i + 1}. {s.title}</strong><small>{s.line}</small></span>
              <span className="b2-hint" data-kind="tap" aria-hidden="true"><span className="b2-hint-hand"><span className="b2-hint-ripple" /><TapHand fill={HAND} /></span></span>
            </li>
          ))}
        </ol>
      </section>
      <BottomBar>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={start}>Let’s start</button>
        <Link className="b2-btn b2-quiet" href="/new/guide">More about how it works</Link>
      </BottomBar>
      {watching && (
        <GuestDemo data={sample} title={sample.copy.card_headline || sample.title} to="Maya & family" now={b.now}
          onClose={() => setWatching(false)} action={{ label: "Make mine", run: () => { setWatching(false); start(); } }} />
      )}
    </>
  );
}
