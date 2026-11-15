"use client";

// The event Home (Design 2.0 prototype; CONCEPT 7e): after the Quick start,
// everything about the event is one tap away on big tiles with live numbers.
// Each tile opens one simple screen as a bottom sheet. Numbers here are
// pretend; the invitation is the one made in the Quick start (or a sample).

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import EventView from "@/components/event/event-view";
import { Icon, type IconName } from "@/components/icons";
import { QrCode } from "@/components/qr-code";
import { eventType, paletteFor } from "@/lib/catalog";
import { toViewData } from "@/lib/draft";
import { formatDate, formatTime } from "@/lib/event-view";
import { draftFrom, loadAnswers, looksFor, saturday, type Answers } from "../model";
import { Sheet, ThemeButton, spring, useToast } from "../ui";

type SheetKey = "share" | "replies" | "photos" | "invitation" | "day" | "look" | "settings" | null;

const SAMPLE: Answers = { type: "birthday", names: "Sita", date: "", time: "14:00", venue: "Village Hall", address: "", look: null, photo: null };

const GUESTS: [string, "Coming" | "Maybe" | "Can’t come", number][] = [
  ["Asha Gurung", "Coming", 4], ["Hari Thapa", "Coming", 2], ["Gita Rai", "Maybe", 3], ["Ram Limbu", "Coming", 5],
  ["Maya Tamang", "Can’t come", 1], ["Bikash Shrestha", "Coming", 2],
];

export default function EventHome() {
  const [a] = useState<Answers>(() => { const saved = loadAnswers(); return saved.type ? saved : { ...SAMPLE, date: saturday(1) }; });
  const [now] = useState(() => Date.now());
  const [open, setOpen] = useState<SheetKey>(null);
  const [toast, say] = useToast();
  const t = eventType(a.type);
  const looks = looksFor(a.type);
  const look = looks.find((l) => l.key === a.look) ?? looks[0];
  const d = draftFrom(a, look);
  const p = paletteFor(d.palette, d.customColor);
  const when = [a.date && formatDate(a.date), formatTime(a.time)].filter(Boolean).join(" · ");
  const pretend = () => say("Prototype: in the finished app this opens the real screen.");

  return (
    <MotionConfig reducedMotion="user">
      <div className="b2-shell" data-wide="">
        <header className="b2-top" style={{ gridTemplateColumns: "1fr auto" }}>
          <Link href="/new" className="b2-small" style={{ fontWeight: 800, color: "var(--b2-text)", textDecoration: "none" }}>‹ Quick start</Link>
          <ThemeButton />
        </header>

        <main className="b2-screen" style={{ paddingBottom: 60 }}>
          {/* The event, live, with its invitation floating in 3D */}
          <motion.section className="b2-card" style={{ display: "grid", gridTemplateColumns: "1fr 38%", gap: 16, alignItems: "center", overflow: "hidden" }}
            initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}>
            <div style={{ display: "grid", gap: 10 }}>
              <span className="b2-kicker" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--b2-ok)", boxShadow: "0 0 12px var(--b2-ok)" }} />Live
              </span>
              <h1 className="b2-h2">{d.copy.card_headline || d.title}</h1>
              <p className="b2-small">{when || "Date to be set"}{a.venue ? ` · ${a.venue}` : ""}</p>
              <button type="button" className="b2-btn b2-primary" style={{ justifySelf: "start", minHeight: 50 }} onClick={() => setOpen("share")}>
                <Icon name="share" className="" />Share
              </button>
            </div>
            <div className="b2-stage" style={{ padding: 0 }}>
              <div className="b2-float" style={{ width: "100%" }}><EventView data={toViewData(d)} view="card" now={now} thumb /></div>
            </div>
          </motion.section>

          <p className="b2-small" style={{ textAlign: "center" }}>Prototype: the numbers below are pretend.</p>

          <div className="b2-bento">
            <Tile icon="envelope" colour="#7c6bff" label="Replies" big="18" line="coming · 4 maybe" onClick={() => setOpen("replies")} delay={0.04} />
            <Tile icon="images" colour="#ff4f8b" label="Photos" big="86" line="on the wall" tag="+4 new" onClick={() => setOpen("photos")} delay={0.08} />
            <Tile span icon="pen" colour="#ffb627" label="Invitation" line="The words, the photo and the look" onClick={() => setOpen("invitation")} delay={0.12}>
              <span className="b2-small" style={{ display: "flex", alignItems: "center", gap: 6 }}>Open <Icon name="next" className="size-4" /></span>
            </Tile>
            <Tile icon="clock" colour="#22b8cf" label="Day plan" big="5" line="things · next: Cake at 3pm" onClick={() => setOpen("day")} delay={0.16} />
            <Tile icon="palette" colour="#45c486" label="Look" line={look?.name ?? "Your design"} onClick={() => setOpen("look")} delay={0.2}>
              <span style={{ display: "flex", gap: 6 }} aria-hidden="true">
                {[p.main, p.accent, p.soft].map((c) => <i key={c} style={{ width: 26, height: 26, borderRadius: 999, background: c, boxShadow: "0 0 0 2px rgba(255,255,255,.25)" }} />)}
              </span>
            </Tile>
            <Tile span icon="switches" colour="#8d8ab5" label="Settings" line="Privacy, replies, photos, co-hosts" onClick={() => setOpen("settings")} delay={0.24} />
          </div>
        </main>

        <Sheet open={open === "share"} title="Share" onClose={() => setOpen(null)}>
          <div style={{ display: "grid", justifyItems: "center", gap: 8 }}>
            <div style={{ width: 168, padding: 10, borderRadius: 20, background: "#fff" }}><QrCode text="https://in2min2.com/e/demo1" className="block w-full" label="Your event's QR code" /></div>
            <p className="b2-small">in2min2.com/e/demo1</p>
          </div>
          <Row icon="message" label="Send on WhatsApp" line="With your invitation ready to go" onClick={pretend} />
          <Row icon="copy" label="Copy the link" onClick={pretend} />
          <Row icon="printer" label="Print table cards" line="Four to a page, with the QR code" onClick={pretend} />
          <Row icon="tv" label="Show on a TV" line="The photo wheel in the night sky" onClick={pretend} />
        </Sheet>

        <Sheet open={open === "replies"} title="Replies" onClose={() => setOpen(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {([["18", "Coming"], ["4", "Maybe"], ["2", "Can’t come"]] as const).map(([n, l]) => (
              <div key={l} className="b2-card b2-raised" style={{ padding: 14, textAlign: "center" }}>
                <div className="b2-h1" style={{ fontSize: 34 }}>{n}</div><div className="b2-small">{l}</div>
              </div>
            ))}
          </div>
          {GUESTS.map(([name, status, n]) => (
            <div key={name} className="b2-row" style={{ cursor: "default" }}>
              <span className="b2-grow"><strong>{name}</strong><small>{status === "Can’t come" ? status : `${status} · ${n}`}</small></span>
            </div>
          ))}
          <button type="button" className="b2-btn b2-primary b2-block" onClick={pretend}><Icon name="message" className="" />Send a reminder</button>
        </Sheet>

        <Sheet open={open === "photos"} title="Photos" onClose={() => setOpen(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {SAMPLE_ART.map((bg, i) => <div key={i} style={{ aspectRatio: "1", borderRadius: 16, background: bg, boxShadow: "var(--b2-shadow)" }} />)}
          </div>
          <Row icon="tv" label="Open the TV wheel" onClick={pretend} />
          <Row icon="camera" label="Your photographer" line="Send them a private link" onClick={pretend} />
          <Row icon="star" label="Favourites and loves" line="Choose the photos that come round most" onClick={pretend} />
        </Sheet>

        <Sheet open={open === "invitation"} title="Invitation" onClose={() => setOpen(null)}>
          <Row icon="pen" label="The words" line="Written for you. Tap to change." onClick={pretend} />
          <Row icon="camera" label="The photo" line={a.photo ? "Your photo" : "No photo yet"} onClick={pretend} />
          <Row icon="calendar" label="Date and time" line={when || "Not set"} onClick={pretend} />
          <Row icon="pin" label="Place" line={a.venue || "Not set"} onClick={pretend} />
        </Sheet>

        <Sheet open={open === "day"} title="Day plan" onClose={() => setOpen(null)}>
          {([["2:00pm", "Guests arrive"], ["2:30pm", "Games"], ["3:00pm", "Cake"], ["3:30pm", "Food"], ["5:00pm", "Thank you and goodbye"]] as const).map(([tm, what]) => (
            <div key={tm} className="b2-row" style={{ cursor: "default" }}>
              <span className="b2-h3" style={{ minWidth: 76 }}>{tm}</span><span className="b2-grow"><strong>{what}</strong></span>
            </div>
          ))}
          <button type="button" className="b2-btn b2-secondary b2-block" onClick={pretend}><Icon name="plus" className="" />Add something</button>
        </Sheet>

        <Sheet open={open === "look"} title="Look" onClose={() => setOpen(null)}>
          <p className="b2-small">Swipe through complete looks, as in the Quick start, or fine-tune one part.</p>
          <Row icon="palette" label="Colours" onClick={pretend} />
          <Row icon="frame" label="Border" onClick={pretend} />
          <Row icon="type" label="Letters" onClick={pretend} />
          <Row icon="sparkle" label="Moving effect" line={t?.effect ? "On" : "Off"} onClick={pretend} />
        </Sheet>

        <Sheet open={open === "settings"} title="Settings" onClose={() => setOpen(null)}>
          {(["Private event", "Replies", "Photo wall", "Reminders"] as const).map((l, i) => <Toggle key={l} label={l} on={i > 0} />)}
          <Row icon="people" label="Co-hosts and helpers" onClick={pretend} />
        </Sheet>
        {toast}
      </div>
    </MotionConfig>
  );
}

const SAMPLE_ART = [
  "linear-gradient(160deg, #ff8a3d, #ff3d7f)", "radial-gradient(circle at 30% 30%, #ffe08a, #ff9f43 45%, #7b2cbf)",
  "linear-gradient(200deg, #22b8cf, #1e6fd9)", "radial-gradient(circle at 70% 40%, #ffd6e7, #ff4f8b 55%, #3a0ca3)",
  "linear-gradient(140deg, #45c486, #0b8a5f)", "radial-gradient(circle at 40% 60%, #fff3b0, #ffb627 40%, #9d4edd)",
];

function Tile({ icon, colour, label, big, line, tag, span, onClick, delay, children }: {
  icon: IconName; colour: string; label: string; big?: string; line?: string; tag?: string; span?: boolean;
  onClick: () => void; delay: number; children?: ReactNode;
}) {
  return (
    <motion.button type="button" className="b2-tile" data-span={span ? "2" : undefined} onClick={onClick}
      initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay }} whileTap={{ scale: 0.97 }}>
      {tag && <span className="b2-tag">{tag}</span>}
      <span className="b2-ico" style={{ background: `linear-gradient(135deg, ${colour}, color-mix(in srgb, ${colour} 55%, #000))` }}><Icon name={icon} className="" /></span>
      <span style={{ display: "grid", gap: 4 }}>
        {big && <span className="b2-big">{big}</span>}
        <strong style={{ fontSize: 19 }}>{label}</strong>
        {line && <span className="b2-small">{line}</span>}
        {children}
      </span>
    </motion.button>
  );
}

function Row({ icon, label, line, onClick }: { icon: IconName; label: string; line?: string; onClick: () => void }) {
  return (
    <button type="button" className="b2-row" onClick={onClick}>
      <span className="b2-ico" style={{ background: "var(--b2-s3)", color: "var(--b2-text)" }}><Icon name={icon} className="" /></span>
      <span className="b2-grow"><strong>{label}</strong>{line && <small>{line}</small>}</span>
      <Icon name="next" className="size-5" />
    </button>
  );
}

function Toggle({ label, on: start }: { label: string; on: boolean }) {
  const [on, setOn] = useState(start);
  return (
    <label className="b2-row" style={{ cursor: "pointer" }}>
      <span className="b2-grow"><strong>{label}</strong></span>
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="sr-only" />
      <span aria-hidden="true" style={{ width: 54, height: 32, borderRadius: 999, padding: 4, background: on ? "var(--b2-accent)" : "var(--b2-s3)", transition: "background .2s" }}>
        <span style={{ display: "block", width: 24, height: 24, borderRadius: 999, background: "#fff", transform: on ? "translateX(22px)" : "none", transition: "transform .2s" }} />
      </span>
    </label>
  );
}
