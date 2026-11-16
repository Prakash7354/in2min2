"use client";

// The style page (in2min2.com/new/style): Design 2.0 in one place, to judge
// on a phone: colours, letters, buttons, tiles, inputs, the bottom sheet,
// icons, and the frameless photo wheel in each sky. The sample "photos" are
// drawn here (no outside pictures).

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { eventVars } from "@/components/event/event-view";
import { ICON_NAMES, Icon } from "@/components/icons";
import { PhotoWheel } from "@/components/photos/photo-wheel";
import { SKIES, paletteFor, type Sky } from "@/lib/catalog";
import type { WallPhoto } from "@/lib/photos";
import { TYPE_ART } from "../kinds";
import { Sheet, ThemeButton, useToast } from "../ui";

// Sample photos for the wheel: small drawn scenes, landscape and portrait.
function svg(w: number, h: number, body: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`)}`;
}
const grad = (id: string, stops: string[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const SCENES: { w: number; h: number; src: string }[] = [
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("a", ["#2b1055", "#d4418e", "#ff9966"])}</defs><rect width="160" height="90" fill="url(#a)"/><circle cx="110" cy="52" r="14" fill="#ffd56b"/><path d="M0 90 L0 62 L30 40 L52 58 L80 30 L110 60 L135 44 L160 58 L160 90Z" fill="#1d0f3a"/>`) },
  { w: 900, h: 1600, src: svg(90, 160, `<rect width="90" height="160" fill="#140c2c"/>${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 37) % 90}" cy="${(i * 61) % 160}" r="${6 + (i % 5) * 3}" fill="${["#ffb627", "#ff4f8b", "#8b7cff", "#4fe3a6", "#6fb6ff"][i % 5]}" opacity="${0.25 + (i % 4) * 0.15}"/>`).join("")}`) },
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("b", ["#6fb6ff", "#cfe9fc"])}${grad("c", ["#2e9d5b", "#145c36"])}</defs><rect width="160" height="90" fill="url(#b)"/><path d="M0 60 Q40 35 80 55 T160 50 L160 90 L0 90Z" fill="url(#c)"/><rect y="70" width="160" height="20" fill="#3c8dd9" opacity=".6"/>`) },
  { w: 900, h: 1600, src: svg(90, 160, `<defs>${grad("d", ["#ffe0ec", "#ff8fb1"])}</defs><rect width="90" height="160" fill="url(#d)"/>${[0, 60, 120, 180, 240, 300].map((r) => `<ellipse cx="45" cy="62" rx="10" ry="24" fill="#e8336a" opacity=".8" transform="rotate(${r} 45 80)"/>`).join("")}<circle cx="45" cy="80" r="9" fill="#ffd56b"/><rect x="43" y="88" width="4" height="60" fill="#2e9d5b"/>`) },
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("e", ["#05051a", "#1d1450"])}</defs><rect width="160" height="90" fill="url(#e)"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${(i * 11) % 150}" y="${45 + ((i * 7) % 35)}" width="6" height="${10 + (i % 4) * 6}" fill="${["#ffb627", "#ffd56b", "#6fb6ff"][i % 3]}" opacity=".7"/>`).join("")}`) },
  { w: 900, h: 1600, src: svg(90, 160, `<defs>${grad("f", ["#5e35b1", "#22b8cf"])}</defs><rect width="90" height="160" fill="url(#f)"/>${[40, 70, 100, 130].map((y, i) => `<path d="M0 ${y} Q22 ${y - 14} 45 ${y} T90 ${y} L90 160 L0 160Z" fill="#ffffff" opacity="${0.08 + i * 0.05}"/>`).join("")}`) },
  { w: 1600, h: 900, src: svg(160, 90, `<defs>${grad("g", ["#9fd3ff", "#e8f4ff"])}</defs><rect width="160" height="90" fill="url(#g)"/><path d="M0 90 L20 50 L40 70 L70 20 L100 65 L125 35 L160 75 L160 90Z" fill="#5c6f8a"/><path d="M62 32 L70 20 L78 32 L72 30 L70 34 L67 30Z" fill="#fff"/>`) },
  { w: 900, h: 1600, src: svg(90, 160, `<rect width="90" height="160" fill="#0d1b3e"/>${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${15 + (i * 29) % 70}" cy="${20 + i * 15}" rx="8" ry="11" fill="#ff9f43" opacity=".85"/><ellipse cx="${15 + (i * 29) % 70}" cy="${20 + i * 15}" rx="16" ry="20" fill="#ffb627" opacity=".15"/>`).join("")}`) },
];
const PHOTOS: WallPhoto[] = SCENES.map((s, i) => ({
  id: `sample-${i}`, w: s.w, h: s.h, by: ["Sita", "Hari", "Ram Studio", "Gita", "Asha", "Maya", "Bikash", "Kamala"][i], at: "", loves: [12, 3, 0, 7, 1, 0, 5, 2][i], fav: i === 3,
}));

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
          <span className="b2-kicker">In2Min2 · New look</span>
          <ThemeButton />
        </header>
        <main className="b2-screen" style={{ gap: 30, paddingBottom: 80 }}>
          <section style={{ display: "grid", gap: 14 }}>
            <h1 className="b2-h1">Bold, simple, one thing per screen</h1>
            <p className="b2-lead">The new look for In2Min2, to judge on your phone. Tap the sun or moon at the top to switch between dark and light.</p>
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
                  <PhotoWheel key={sky} eventId="sample" photos={PHOTOS} stars={["sample-3", "sample-0"]} arrivals={{ ids: [], n: 0 }}
                    motion celebrate={false} sky={sky} srcOf={(p) => SCENES[Number(p.id.split("-")[1])].src} onLove={() => say("Loved")} onOpen={() => say("Opens the photo large")} />
                </div>
              </div>
            </div>
          </Part>

          <Part title="Icons" line="A picture beside every heading, drawn for In2Min2.">
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
