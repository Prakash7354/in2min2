"use client";

// The style page (in2min2.com/new/style): Design 2.0 in one place, to judge
// on a phone: colours, letters, buttons, tiles, inputs, the bottom sheet,
// icons, and the frameless photo wheel in each sky. The sample "photos" are
// drawn scenes (components/photos/samples.ts; no outside pictures).

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { eventVars } from "@/components/event/event-view";
import { ICON_NAMES, Icon } from "@/components/icons";
import { PhotoWheel } from "@/components/photos/photo-wheel";
import { SAMPLE_PHOTOS, sampleSrc } from "@/components/photos/samples";
import { SKIES, paletteFor, type Sky } from "@/lib/catalog";
import { TYPE_ART } from "../kinds";
import { Sheet, ThemeButton, useToast } from "../ui";

export default function StyleGuide() {
  const [sheet, setSheet] = useState(false);
  const [sky, setSky] = useState<Sky>("night");
  const [picked, setPicked] = useState("birthday");
  const [toast, say] = useToast();
  const palette = paletteFor("marigold_indigo");
  return (
    <MotionConfig reducedMotion="user">
      <div className="b2-shell" data-wide="">
        <header className="b2-top" style={{ gridTemplateColumns: "1fr auto" }}>
          <span className="b2-kicker">in2min2 · New look</span>
          <ThemeButton />
        </header>
        <main className="b2-screen" style={{ gap: 30, paddingBottom: 80 }}>
          <section style={{ display: "grid", gap: 14 }}>
            <h1 className="b2-h1">Bold, simple, one thing per screen</h1>
            <p className="b2-lead">The new look for in2min2, to judge on your phone. Tap the sun or moon at the top to switch between dark and light.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/new" className="b2-btn b2-primary">Try the Quick start</Link>
              <Link href="/new/home" className="b2-btn b2-secondary">See an event Home</Link>
            </div>
          </section>

          <Part title="Colours" line="A deep indigo-black page; each card a shade lighter; one bright marigold for the main action.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {([["--b2-bg", "Page"], ["--b2-s1", "Card"], ["--b2-s2", "Raised"], ["--b2-s3", "Pressed"], ["--b2-text", "Words"], ["--b2-text-2", "Quiet words"], ["--b2-accent", "Main action"], ["--b2-violet", "Highlight"]] as const).map(([v, n]) => (
                <div key={v} className="b2-card" style={{ padding: 12, display: "grid", gap: 8 }}>
                  <span style={{ height: 54, borderRadius: 14, background: `var(${v})`, boxShadow: "inset 0 0 0 1px rgba(127,127,127,.25)" }} />
                  <strong style={{ fontSize: 16 }}>{n}</strong>
                </div>
              ))}
            </div>
            <p className="b2-small">Every pair of words and background passes the WCAG AA readability standard in both looks.</p>
          </Part>

          <Part title="Letters" line="Big and bold, with few words on each screen.">
            <div className="b2-card" style={{ display: "grid", gap: 12 }}>
              <p className="b2-kicker">Kicker</p>
              <p className="b2-h1">Headline</p>
              <p className="b2-h2">Section title</p>
              <p className="b2-h3">Small title</p>
              <p className="b2-lead">Lead text, for one helpful sentence.</p>
              <p className="b2-small">Small print and hints.</p>
            </div>
          </Part>

          <Part title="Buttons" line="One bright button per screen, at the bottom where your thumb is.">
            <div style={{ display: "grid", gap: 10 }}>
              <button type="button" className="b2-btn b2-primary b2-block" onClick={() => say("The main action")}>Next</button>
              <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => say("A second choice")}>Skip for now</button>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button type="button" className="b2-btn b2-quiet">Quiet</button>
                <button type="button" className="b2-round" aria-label="Back"><Icon name="back" className="" /></button>
                <button type="button" className="b2-round" aria-label="Share"><Icon name="share" className="" /></button>
              </div>
            </div>
          </Part>

          <Part title="Big choices" line="Pictures and words together, easy to tap.">
            <div className="b2-choices">
              {(["birthday", "wedding"] as const).map((k) => (
                <button key={k} type="button" className="b2-choice" aria-pressed={picked === k} onClick={() => setPicked(k)}>
                  <span className="b2-art" style={{ background: `linear-gradient(135deg, ${TYPE_ART[k].from}, ${TYPE_ART[k].to})` }}><Icon name={TYPE_ART[k].icon} className="" /></span>
                  <span style={{ display: "grid", gap: 4 }}><strong>{k === "birthday" ? "Birthday" : "Wedding"}</strong><span>Tap to choose</span></span>
                </button>
              ))}
            </div>
            <div className="b2-chips"><button type="button" className="b2-chip" aria-pressed>This Saturday</button><button type="button" className="b2-chip">Next Saturday</button><button type="button" className="b2-chip">6pm</button></div>
            <label className="b2-field"><span className="b2-label">A big input</span><input className="b2-input" placeholder="e.g. Sita" /></label>
            <div className="b2-progress" style={{ maxWidth: 280 }}><small>Step 3 of 6</small><div className="b2-bar"><i style={{ width: "50%" }} /></div></div>
          </Part>

          <Part title="Tiles with live numbers" line="The event Home: everything one tap away.">
            <div className="b2-bento">
              <div className="b2-tile"><span className="b2-ico" style={{ background: "linear-gradient(135deg,#7c6bff,#3d2fb0)" }}><Icon name="envelope" className="" /></span><span style={{ display: "grid", gap: 4 }}><span className="b2-big">18</span><strong>Replies</strong><span className="b2-small">coming · 4 maybe</span></span></div>
              <div className="b2-tile"><span className="b2-tag">+4 new</span><span className="b2-ico" style={{ background: "linear-gradient(135deg,#ff4f8b,#a3164d)" }}><Icon name="images" className="" /></span><span style={{ display: "grid", gap: 4 }}><span className="b2-big">86</span><strong>Photos</strong><span className="b2-small">on the wall</span></span></div>
            </div>
            <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => setSheet(true)}>Open a bottom sheet</button>
          </Part>

          <Part title="The photo wheel" line="No frames, clear space between photos, a soft glow. Pick a sky.">
            <div className="b2-chips" role="radiogroup" aria-label="Sky">
              {SKIES.filter((k) => k.key !== "auto").map((k) => (
                <button key={k.key} type="button" role="radio" aria-checked={sky === k.key} className="b2-chip" onClick={() => setSky(k.key as Sky)}>{k.name}</button>
              ))}
            </div>
            <div className="ev-frame" style={{ borderRadius: 26, overflow: "hidden" }}>
              <div className="ev-root" style={eventVars(palette, "classic")} data-motion="on">
                <div style={{ padding: "0 min(calc(var(--u) * 6), 36px)" }}>
                  <PhotoWheel key={sky} eventId="sample" photos={SAMPLE_PHOTOS} stars={["sample-3", "sample-0"]} arrivals={{ ids: [], n: 0 }}
                    motion celebrate={false} sky={sky} srcOf={(p) => sampleSrc(p.id)} onLove={() => say("Loved")} onOpen={() => say("Opens the photo large")} />
                </div>
              </div>
            </div>
          </Part>

          <Part title="Icons" line="A picture beside every heading, drawn for in2min2.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 10 }}>
              {ICON_NAMES.map((n) => (
                <div key={n} title={n} className="b2-card" style={{ padding: 12, display: "grid", placeItems: "center" }}><Icon name={n} className="size-7" /></div>
              ))}
            </div>
          </Part>
        </main>

        <Sheet open={sheet} title="A bottom sheet" onClose={() => setSheet(false)}>
          <p className="b2-lead">One simple screen at a time. Drag it down, tap outside or press Close.</p>
          <button type="button" className="b2-row" onClick={() => say("A row")}><span className="b2-ico" style={{ background: "var(--b2-s3)", color: "var(--b2-text)" }}><Icon name="message" className="" /></span><span className="b2-grow"><strong>A row</strong><small>With a hint</small></span><Icon name="next" className="size-5" /></button>
          <button type="button" className="b2-btn b2-primary b2-block" onClick={() => setSheet(false)}>Done</button>
        </Sheet>
        {toast}
      </div>
    </MotionConfig>
  );
}

function Part({ title, line, children }: { title: string; line: string; children: ReactNode }) {
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <h2 className="b2-h2">{title}</h2>
        <p className="b2-small">{line}</p>
      </div>
      {children}
    </section>
  );
}
