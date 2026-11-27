"use client";

// The envelope guests tap to open the invitation (owner, 19 Nov 2026).
//
// First they see its FRONT, like real post: who it's from (top left, like a
// return address), a stamp and postmark with the date, and who it's to: the
// guest's own name from their personal link, or the host's line for a shared
// or open invitation ("Our family and friends", "Teams, stalls and sponsors").
// The event's title sits above it, so it's plain who and what it's about.
// A hand shows where to tap, but a tap anywhere opens it (people act before
// they read). Then it turns over, the wax seal with the initials breaks, the
// flap lifts, the card slides out, and the music (if any) fades in: phones
// only allow sound after a tap, so this tap is also what starts the music.
//
// Shown once per visit: if the guest comes back in the same tab, the page
// opens straight away (page.tsx hides the envelope before it appears) and the
// music waits for the music button. Phones set to reduce motion get a simple
// fade. Without JavaScript the page shows as normal.

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/icons";
import { TapHand } from "@/components/tap-hand";
import { backdropImage, backdropOf, envelopeColourOf, washCss, washOf } from "@/lib/catalog";
import { envelopeFrom, envelopeTo, formatDate, openedKey, type EventViewData } from "@/lib/event-view";
import { eventVars } from "./event-view";
import { eventFontVariables } from "./fonts";
import { useMusic } from "./music";
import "./opening.css";

// Read once per page, so marking it opened mid-animation doesn't cut it short.
const seenCache = new Map<string, boolean>();
function seen(id: string): boolean {
  if (!seenCache.has(id)) {
    let v = false;
    try { v = !!sessionStorage.getItem(openedKey(id)); } catch { /* private mode */ }
    seenCache.set(id, v);
  }
  return seenCache.get(id)!;
}
const noop = () => () => {};

// "Meenu & Jose" → "M & J"; "Sita" → "S"; otherwise the title's first letter.
export function initials(d: EventViewData, title: string): string {
  const names = (d.stars?.names || d.organiser?.name || "").split(/\s*(?:&|\band\b|,|\+)\s*/i).map((s) => s.trim()).filter(Boolean);
  const first = (s: string) => Array.from(s.replace(/^[^\p{L}\p{N}]+/u, ""))[0]?.toUpperCase() ?? "";
  if (names.length >= 2) return `${first(names[0])} & ${first(names[1])}`;
  return first(names[0] ?? "") || first(title) || "♥";
}

// The picture on the stamp.
const STAMP: Record<string, IconName> = {
  birthday: "cake", wedding: "rings", engagement: "rings", anniversary: "rings", christmas: "tree", "new-year": "star",
  memorial: "flower", pasni: "bowl", lhosar: "sun", party: "balloon", ceremony: "flower", bratabandha: "flower",
  reunion: "flag", corporate: "briefcase", sport: "trophy",
};
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

type Props = {
  data: EventViewData;
  title: string;
  to?: string | null;        // the guest's name, from their personal link
  id: string;                // "type/slug": remembers it was opened this visit
  preview?: () => void;      // the builder's "See the envelope": always shows, then calls this
  // The website (owner, 23 Nov 2026): plays inside a phone picture. Opens by
  // itself after autoOpen ms, with no music, no page lock, nothing remembered,
  // then calls onDone.
  embedded?: boolean;
  autoOpen?: number;
  onDone?: () => void;
};

export function Opening({ data, title, to, id, preview, embedded = false, autoOpen, onDone }: Props) {
  const already = useSyncExternalStore(noop, () => !preview && !embedded && seen(id), () => false);
  const [phase, setPhase] = useState<"closed" | "opening" | "gone">("closed");
  const music = useMusic(data.music);
  const showEnvelope = (data.envelope || !!preview) && !already && phase !== "gone";
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showEnvelope || embedded) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    button.current?.focus({ preventScroll: true });
    return () => { html.style.overflow = before; };
  }, [showEnvelope, embedded]);

  function open() {
    if (phase !== "closed") return;
    if (data.music && !embedded) music.start(); // inside the tap, so phones allow it
    setPhase("opening");
    const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      if (embedded) { setPhase("gone"); onDone?.(); return; }
      if (!preview) { try { sessionStorage.setItem(openedKey(id), "1"); } catch { /* fine */ } }
      setPhase(preview ? "closed" : "gone");
      preview?.();
    }, quick ? 450 : 2800);
  }

  // The website's phone opens by itself (embedded).
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; });
  useEffect(() => {
    if (!embedded || autoOpen === undefined) return;
    const t = window.setTimeout(() => openRef.current(), autoOpen);
    return () => window.clearTimeout(t);
  }, [embedded, autoOpen]);

  const p = data.palette;
  const bd = backdropOf(data.backdrop);
  const env = envelopeColourOf(data.envColour);
  // Painted backgrounds that already have a frame or a trellis keep it; plain glows get ours.
  const ownArt = !!bd && (!!bd.frame || bd.group === "traditional" || bd.group === "yours" && !!bd.file && /frame/.test(bd.key));
  const vars = {
    ...eventVars(p, data.textStyle, data.wash),
    "--op-sky": bd ? backdropImage(bd) : washCss(p, washOf(data.wash)) ?? (p.gradient ? `radial-gradient(ellipse 90% 70% at 50% 42%, ${p.soft}d9, ${p.bg}f2), ${p.gradient}` : `radial-gradient(ellipse 90% 70% at 50% 42%, ${p.soft}, ${p.bg})`),
    "--op-text": bd ? (bd.dark ? "#FFFFFF" : p.ink) : p.ink,
    // The envelope: a rich colour with gold writing, a gold seal and a gold
    // lining (catalog ENVELOPE_COLOURS; Royal red unless the host chose
    // another), whatever the page's colours (owner, 23 Nov 2026). Memorials
    // keep their own calm colours unless the family picks one.
    "--op-env": data.sensitive && !data.envColour ? p.main : env.paper,
    "--op-env-ink": data.sensitive && !data.envColour ? p.onMain : env.ink,
    "--op-wax": data.sensitive && !data.envColour ? (p.dark ? p.bg : p.accent) : env.wax,
    "--op-wax-text": data.sensitive && !data.envColour ? (p.dark ? p.main : p.onAccent) : env.waxText,
  } as CSSProperties;
  const guest = to?.trim() || null;
  const toLine = envelopeTo(data, guest);
  const fromLine = envelopeFrom(data);
  const seal = initials(data, title);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.date);
  const postmark = m ? [`${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}`, m[1]] : null;

  const envelope = showEnvelope ? (
    <div className={`op ${eventFontVariables}`} data-op={preview ? "preview" : id} data-phase={phase} data-embedded={embedded ? "" : undefined} style={vars}
      role="dialog" aria-modal="true" aria-label="Your invitation">
      <div className="op-sky" aria-hidden="true" data-deco={ownArt ? undefined : data.sensitive ? "calm" : "on"}>
        {!data.sensitive && <span className="op-glints" />}
        {!ownArt && <span className="op-frame"><i /><i /><i /><i /></span>}
      </div>
      {/* The whole screen is the button: a tap anywhere opens it. */}
      <button ref={button} type="button" className="op-tap" onClick={open}
        aria-label={`Open the invitation${guest ? ` for ${guest}` : ""}${fromLine ? ` from ${fromLine}` : ""}${data.music ? ", with music" : ""}`}>
        <span className="op-head" aria-hidden="true">
          <span className="op-kicker">{data.sensitive ? "Please open" : "You’re invited"}</span>
          <span className="op-title" data-long={Array.from(title).length > 34 ? "" : undefined}>{title}</span>
        </span>
        <span className="op-env" aria-hidden="true">
          {/* The back: what opens */}
          <span className="op-backside">
            <span className="op-back" />
            <span className="op-card">
              <span className="op-card-kicker">{data.sensitive ? "Please join us" : "You’re invited"}</span>
              <span className="op-card-title">{title}</span>
              {data.date && <span className="op-card-date">{formatDate(data.date)}</span>}
            </span>
            <span className="op-pocket op-pocket-l" />
            <span className="op-pocket op-pocket-r" />
            <span className="op-pocket op-pocket-b" />
            <span className="op-flap"><span className="op-flap-out" /><span className="op-flap-in" /></span>
            <span className="op-seal"><span data-two={seal.length > 2 ? "" : undefined}>{seal}</span></span>
          </span>
          {/* The front: what's seen first */}
          <span className="op-front">
            {fromLine && <span className="op-from"><small>From</small><span>{fromLine}</span></span>}
            {/* The stamp: the initials (owner, 23 Nov 2026: "S&V in the middle"), or a picture for a memorial. */}
            <span className="op-stamp"><span className="op-stamp-art">
              {data.sensitive || seal === "♥" ? <Icon name={STAMP[data.typeKey] ?? "heart"} className="" /> : <span className="op-stamp-ini" data-one={seal.length === 1 ? "" : undefined}>{seal.replace(/\s+/g, "")}</span>}
            </span></span>
            <span className="op-corner op-corner-l" />
            <span className="op-corner op-corner-r" />
            {postmark && <span className="op-postmark"><span>{postmark[0]}</span><span>{postmark[1]}</span></span>}
            <span className="op-waves" />
            <span className="op-address" data-long={Array.from(toLine).length > 24 ? "" : undefined}>
              <small>To</small>
              <span>{toLine}</span>
            </span>
          </span>
          <span className="op-hand">
            <span className="op-ripple" />
            <TapHand />
          </span>
        </span>
        <span className="op-hint" aria-hidden="true">
          Tap anywhere to open{data.music ? <span className="op-hint-music"> · with music ♪</span> : null}
        </span>
      </button>
    </div>
  ) : null;

  return (
    <>
      {preview ? (envelope && typeof document !== "undefined" ? createPortal(envelope, document.body) : null) : envelope}
      {!preview && !embedded && data.music && !showEnvelope && (
        <MusicButton state={music.state} onTap={music.toggle} colour={p.main} textColour={p.onMain} />
      )}
    </>
  );
}

// Bottom left: on/off. Before the first tap it says "Play music" in words.
function MusicButton({ state, onTap, colour, textColour }: { state: ReturnType<typeof useMusic>["state"]; onTap: () => void; colour: string; textColour: string }) {
  const playing = state === "on" || state === "loading";
  const wide = state === "off" || state === "failed";
  return (
    <button type="button" className="op-music" data-wide={wide ? "" : undefined} data-state={state} onClick={onTap}
      style={{ background: colour, color: textColour }}
      aria-label={playing ? "Turn the music off" : state === "failed" ? "The music couldn't play. Try again" : "Play the music"} aria-pressed={playing}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 17.5V6l10-2v11.5" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="15.5" r="2.5" />
        {!playing && <path d="M3.5 3.5l17 17" />}
      </svg>
      {wide && <span>{state === "failed" ? "Music didn't load" : "Play music"}</span>}
    </button>
  );
}
