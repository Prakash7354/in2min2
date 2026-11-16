"use client";

// Guests' comments and cheers on the photo show (0011), and the hosts'
// announcements, drawn in the event's own colours (inside .ev-root).
//
// - CheerFloats: emojis rising up the screen, as on live video shows.
// - LiveOverlay: the newest comments drifting over the wheel on a phone.
// - CheerBar: right under the wheel: one-tap emojis, a comment box,
//   ready-made words, and Share. CheerList: every comment, to read later.
// - TvCheers: on the TV, a column on the right that scrolls up as new
//   comments arrive, or a band along the bottom that moves right to left.
// - Notices: the hosts' announcements, newest first, at the top of a page.

import { useEffect, useRef, useState } from "react";
import {
  CHEER_EMOJI, CHEER_MESSAGES, CHEER_ORDER, GENTLE_ORDER, cheerPhrases, postCheer, timeAgo,
  type Announcement, type Cheer, type CheerEmoji, type CheerRules, type Float,
} from "@/lib/live";
import { shareLink } from "@/lib/share";

const s = (k: string) => `ev-${k}`;

// fixed: over the whole phone screen, so a guest sees cheers rise wherever they've scrolled.
export function CheerFloats({ floats, fixed = false }: { floats: Float[]; fixed?: boolean }) {
  return (
    <div className={s("floats")} data-fixed={fixed ? "" : undefined} aria-hidden="true">
      {floats.map((f, i) => (
        <span key={f.key} style={{ ["--x" as string]: `${(i * 37) % 60}%`, ["--d" as string]: `${(i * 0.13) % 0.6}s` }}>
          {CHEER_EMOJI[f.emoji].char}
        </span>
      ))}
    </div>
  );
}

function Bubble({ c, now }: { c: Cheer; now?: number }) {
  const who = c.name?.trim() || "A guest";
  return (
    <li className={s("cheer")}>
      <span className={s("cheerAvatar")} aria-hidden="true">{c.emoji && !c.body ? CHEER_EMOJI[c.emoji].char : who.slice(0, 1).toUpperCase()}</span>
      <span className={s("cheerText")}>
        <strong>{who}</strong>
        {c.body ? <span>{c.body}{c.emoji ? ` ${CHEER_EMOJI[c.emoji].char}` : ""}</span> : <span>sent {c.emoji ? CHEER_EMOJI[c.emoji].char : ""}</span>}
        {now !== undefined && <small>{timeAgo(c.at, now)}</small>}
      </span>
    </li>
  );
}

// Over the wheel on a phone: the newest few comments drift up in the empty
// sky under the photos, as on a live video (owner, 16 Nov 2026: comments
// "next to the photo display or underneath").
export function LiveOverlay({ cheers }: { cheers: Cheer[] }) {
  const list = cheers.filter((c) => c.body).slice(0, 3).reverse();
  if (!list.length) return null;
  return (
    <ul className={s("liveOverlay")} aria-hidden="true">
      {list.map((c) => (
        <li key={c.id}><strong>{c.name?.trim() || "A guest"}</strong> {c.body}{c.emoji ? ` ${CHEER_EMOJI[c.emoji].char}` : ""}</li>
      ))}
    </ul>
  );
}

// Right under the wheel: love it, comment, share. One-tap emojis, ready-made
// words or their own, and a Share button for the photos page.
export function CheerBar({ type, slug, token, device, name, sensitive, rules, count, title, onSent }: {
  type: string; slug: string; token: string | null; device: () => string; name: string; sensitive: boolean;
  rules: CheerRules | null; count: number; title: string; onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  if (!rules?.on) return null;
  const order = sensitive ? GENTLE_ORDER : CHEER_ORDER;

  async function send(emoji: CheerEmoji | null, body: string) {
    if (busy) return;
    setBusy(true);
    setNote(null);
    const r = await postCheer({ type, slug, token, device: device(), name, body, emoji });
    setBusy(false);
    if (!r.ok) { setNote({ tone: "error", text: r.reason === "network" ? "No signal just now. Please try again." : CHEER_MESSAGES[r.reason ?? ""] ?? "That couldn't be sent." }); return; }
    if (body) setText("");
    setNote(r.status === "waiting" ? { tone: "ok", text: "Sent! It shows once the host has checked it." } : null);
    onSent();
  }
  async function share() {
    const r = await shareLink(window.location.href, title, sensitive ? "Photos and memories:" : "Add your photos and comments here:");
    if (r === "copied") setNote({ tone: "ok", text: "Link copied. Paste it into WhatsApp or a text." });
  }

  return (
    <section className={s("cheers")} aria-label="Comments">
      <div className={s("cheersHead")}>
        <span className={s("liveDot")} aria-hidden="true" />
        <span>{sensitive ? "Messages" : "Live"}{count ? ` · ${count} ${count === 1 ? "comment" : "comments"}` : ""}</span>
        <button type="button" className={s("shareMini")} onClick={() => void share()}><ShareIcon />Share</button>
      </div>
      {rules.open ? (
        <>
          <div className={s("emojiRow")} role="group" aria-label="Send a cheer">
            {order.map((k) => (
              <button key={k} type="button" className={s("emojiBtn")} disabled={busy} onClick={() => void send(k, "")} aria-label={CHEER_EMOJI[k].label} title={CHEER_EMOJI[k].label}>
                {CHEER_EMOJI[k].char}
              </button>
            ))}
          </div>
          <form className={s("cheerForm")} onSubmit={(e) => { e.preventDefault(); if (text.trim()) void send(null, text); }}>
            <input className={s("input")} value={text} maxLength={140} placeholder={sensitive ? "Share a few words…" : "Say something nice…"}
              aria-label="Your comment" enterKeyHint="send" onChange={(e) => setText(e.target.value)} />
            <button type="submit" className={`${s("btn")} ${s("btnAccent")}`} disabled={busy || !text.trim()}>Send</button>
          </form>
          <div className={s("phraseRow")} role="group" aria-label="Ready-made words">
            {cheerPhrases(sensitive, type).map((p) => (
              <button key={p} type="button" className={s("phrase")} disabled={busy} onClick={() => void send(null, p)}>{p}</button>
            ))}
          </div>
          {note && <p className={note.tone === "error" ? s("replyError") : s("photoNote")} role="status">{note.text}</p>}
          <p className={s("muted")}>{name.trim() ? `Shown as ${name.trim()}.` : "Add your name below, if you like."}{rules.approve_first ? " The host checks words before they show." : ""}</p>
        </>
      ) : (
        <p className={s("muted")}>Comments open with the photos, on the day.</p>
      )}
    </section>
  );
}

// Every comment, newest first, to read during and after the event.
export function CheerList({ cheers, sensitive }: { cheers: Cheer[]; sensitive: boolean }) {
  const [all, setAll] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(t); }, []);
  const words = cheers.filter((c) => c.body);
  if (!words.length) return null;
  const shown = all ? words : words.slice(0, 6);
  return (
    <section className={s("cheerAll")} aria-label="All comments">
      <p className={s("cheersHead")}>{sensitive ? "Messages for the family" : "Comments"}</p>
      <ul className={s("cheerList")}>{shown.map((c) => <Bubble key={c.id} c={c} now={now} />)}</ul>
      {words.length > 6 && (
        <div><button type="button" className={`${s("btn")} ${s("btnGhost")} ${s("btnSmall")}`} onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show all ${words.length}`}
        </button></div>
      )}
    </section>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" /><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16" />
    </svg>
  );
}

// The TV: a column on the right (newest at the bottom, older ones rising and
// fading), or a band along the bottom moving right to left.
export function TvCheers({ cheers, mode }: { cheers: Cheer[]; mode: "right" | "bottom" }) {
  const list = cheers.filter((c) => c.body).slice(0, mode === "right" ? 14 : 12);
  const band = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(40);
  useEffect(() => {
    const w = band.current?.scrollWidth ?? 0;
    setDur(Math.max(25, Math.round(w / 2 / 90)));
  }, [list.length, mode]);
  if (mode === "right") {
    return (
      <aside className={s("tvCheers")} aria-label="Live comments">
        <p className={s("cheersHead")}><span className={s("liveDot")} aria-hidden="true" />Live comments</p>
        {list.length ? (
          <ul className={s("cheerList")}>{[...list].reverse().map((c) => <Bubble key={c.id} c={c} />)}</ul>
        ) : (
          <p className={s("tvHint")}>Scan the code and say something nice!</p>
        )}
      </aside>
    );
  }
  const items = list.length ? [...list].reverse() : null;
  return (
    <div className={s("tvBand")} aria-label="Live comments">
      <span className={s("tvBandLabel")}><span className={s("liveDot")} aria-hidden="true" />Live</span>
      <div className={s("tvBandTrack")}>
        {items ? (
          <div ref={band} className={s("tvBandMove")} style={{ ["--dur" as string]: `${dur}s` }}>
            {[0, 1].map((copy) => (
              <span key={copy} className={s("tvBandSet")} aria-hidden={copy === 1}>
                {items.map((c) => (
                  <span key={c.id} className={s("tvBandItem")}>
                    <strong>{c.name?.trim() || "A guest"}</strong> {c.body}{c.emoji ? ` ${CHEER_EMOJI[c.emoji].char}` : ""}
                  </span>
                ))}
              </span>
            ))}
          </div>
        ) : (
          <span className={s("tvHint")}>Scan the code and say something nice!</span>
        )}
      </div>
    </div>
  );
}

// The hosts' announcements: the newest in full, and any important one from
// the last six hours (so "Car park full" isn't folded away by "Food is
// served"); the rest fold away.
export function Notices({ list, now }: { list: Announcement[]; now?: number }) {
  const [open, setOpen] = useState(false);
  if (!list.length) return null;
  const [first, ...older] = list;
  const recent = (a: Announcement) => (now ?? new Date(list[0].at).getTime()) - new Date(a.at).getTime() < 6 * 3600_000;
  const pinned = older.filter((a) => a.kind === "urgent" && recent(a)).slice(0, 2);
  const rest = older.filter((a) => !pinned.includes(a));
  const one = (a: Announcement) => (
    <div key={a.id} className={s("notice")} data-kind={a.kind} role={a.kind === "urgent" ? "alert" : undefined}>
      <span className={s("noticeIcon")} aria-hidden="true"><MegaphoneIcon /></span>
      <span className={s("noticeText")}>
        <strong>{a.kind === "urgent" ? "Important" : a.kind === "happy" ? "From the hosts" : "Update"}</strong>
        <span>{a.body}</span>
        {now !== undefined && <small>{timeAgo(a.at, now)}</small>}
      </span>
    </div>
  );
  return (
    <div className={s("notices")} aria-live="polite">
      {one(first)}
      {pinned.map(one)}
      {rest.length > 0 && (
        <>
          {open && rest.map(one)}
          <button type="button" className={s("noticeMore")} onClick={() => setOpen(!open)}>
            {open ? "Hide earlier updates" : `${rest.length} earlier update${rest.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}

export function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5v3a1 1 0 0 0 1 1h2l5 4V5.5l-5 4H4a1 1 0 0 0-1 1z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}
