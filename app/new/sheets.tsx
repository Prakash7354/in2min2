"use client";

// The things hosts use all the time, kept apart from the steps (owner, 15 Nov
// 2026): Share, the bell (what needs doing, and reminders of what to send
// when), and the account (sign in and out, light or dark, a new event).
// Each opens as a sheet from the bottom, over whatever screen is open.

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import EventView from "@/components/event/event-view";
import { Icon, type IconName } from "@/components/icons";
import { QrCode } from "@/components/qr-code";
import { eventType, plan, freePlanAt } from "@/lib/catalog";
import { missingForPublish, toViewData, unpublishedChanges, type Draft } from "@/lib/draft";
import { formatDate } from "@/lib/event-view";
import { wallPath } from "@/lib/photos";
import { copyLink, shareLink, whatsappUrl } from "@/lib/share";
import { supabase } from "@/lib/supabase/client";
import { moments } from "../builder/share-links";
import { totals } from "../builder/replies";
import { MISSING_PANEL, useB2, type B2 } from "./context";
import type { Panel } from "./nav";
import { dateLine } from "./kinds";
import { previewAt } from "./panels/preview";
import { DRAFT } from "@/components/legal/legal-page";
import { EventsBody } from "./events";
import { Chips, Hint, markHint, RoundButton, Sheet, Toggle, useTheme } from "./ui";
import { CAPTCHA_FAILED, useCaptcha } from "@/components/captcha";

export function eventLink(d: Draft): string | null {
  return d.publishedPath ? `${window.location.origin}${d.publishedPath}` : null;
}

export function Sheets({ signInWhy, onSignedIn }: { signInWhy: string; onSignedIn: () => void }) {
  const b = useB2();
  const s = b.nav.sheet;
  const close = () => void b.back();
  return (
    <>
      <Sheet open={s === "share"} title="Share" onClose={close}><ShareBody /></Sheet>
      <Sheet open={s === "bell"} title="Updates" onClose={close}><BellBody /></Sheet>
      <Sheet open={s === "account"} title="You" onClose={close}><AccountBody /></Sheet>
      <Sheet open={s === "signin"} title="Sign in" onClose={close}><SignInBody why={signInWhy} onDone={onSignedIn} /></Sheet>
      <Sheet open={s === "preview"} title="Preview" onClose={close}><PreviewBody /></Sheet>
      <Sheet open={s === "events"} title="Your events" onClose={close}><EventsBody /></Sheet>
    </>
  );
}

// Close the sheet, then open a panel (so Back from the panel doesn't reopen the sheet).
function useFromSheet() {
  const b = useB2();
  return async (panel: Panel) => { await b.back(); b.open(panel); };
}

// ─────────────── Top-bar buttons ───────────────

export function AccountButton() {
  const { session, openSheet } = useB2();
  const initial = session?.user.email?.slice(0, 1).toUpperCase();
  return (
    <RoundButton label={session ? "You: signed in" : "Sign in, light or dark, new event"} onClick={() => openSheet("account")}>
      {initial ? <span className="b2-avatar" aria-hidden="true">{initial}</span> : <Icon name="user" className="" />}
    </RoundButton>
  );
}

export function TopButtons() {
  const b = useB2();
  // The number on the bell: each thing to do (new replies and photos count
  // one each), plus any message that's due to be sent today.
  const count = updates(b).reduce((n, u) => n + (u.count ?? (u.tone === "todo" ? 1 : 0)), 0) + dueToday(b.d, b.now);
  return (
    <span style={{ display: "flex", gap: 8 }}>
      <RoundButton icon="share" label="Share" onClick={() => b.openSheet("share")} />
      <RoundButton icon="bell" label="Updates and reminders" badge={count} onClick={() => b.openSheet("bell")} />
      <AccountButton />
    </span>
  );
}

// ─────────────── Share ───────────────

function ShareBody() {
  const b = useB2();
  const fromSheet = useFromSheet();
  const link = eventLink(b.d);
  if (!link) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <p className="b2-lead">Publish your page first. Then share one link, by WhatsApp, a message or a QR code.</p>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={() => void fromSheet("publish")}>Check and publish</button>
      </div>
    );
  }
  return <ShareLinks d={b.d} link={link} say={b.say} />;
}

// The invitation is the main link, at the top (owner, 16 Nov 2026: "the
// invite or RSVP link … should stay at the top"). Then each later message
// for its own purpose, with when to send it and whether it's ready: the
// thank-you stays locked until the page has turned into the thank-you page.
function ShareLinks({ d, link, say }: { d: Draft; link: string; say: (m: string) => void }) {
  const b = useB2();
  const fromSheet = useFromSheet();
  const [qr, setQr] = useState(false);
  const short = d.shortPath ? `${window.location.origin}${d.shortPath}` : null;
  const title = d.title.trim() || "Our event";
  const bare = (u: string) => u.replace(/^https?:\/\//, "");
  const t = eventType(d.eventType);
  const sensitive = !!t?.sensitive;
  const community = d.scale === "community";
  const list = moments(d);
  const invite = list[0];
  const dates = reminderDates(d);
  const ended = eventEnded(d, b.now);
  const w = b.photos.wall;
  const [, type, slug] = (d.publishedPath ?? "").split("/");
  const photosUrl = type && slug ? `${window.location.origin}${wallPath(type, slug, w?.isPrivate ? w.wallKey : null)}` : `${link}#photos`;
  const hasOrder = d.toggles.schedule && d.functions.some((f) => f.title.trim());

  async function share(url: string, text: string) {
    const r = await shareLink(url, title, text);
    if (r === "copied") say("Message and link copied. Paste them into WhatsApp or a text.");
    if (r === "failed") say("Couldn't share from this browser. Use Copy instead.");
  }
  async function copy(text: string, what: string) {
    say((await copyLink(text)) === "copied" ? `${what} copied.` : "Couldn't copy here. Press and hold the text to copy it.");
  }
  const day = (k: string) => (dates[k] ? dateLine("", dates[k]) : "");
  const find = (k: string) => list.find((m) => m.key === k);

  type Step = { key: string; icon: IconName; label: string; when: string; what: string; text?: string; url?: string; locked?: { why: string; label: string; run: () => void } };
  const steps: Step[] = [];
  const order = find("order");
  steps.push(hasOrder && order
    ? { key: "order", icon: "list", label: order.label, when: `The week before${day("order") ? ` · ${day("order")}` : ""}`, what: "Opens the page at the running order, with the menu.", text: order.text, url: link + (order.hash ?? "") }
    : { key: "order", icon: "list", label: community ? "The programme" : "The running order", when: "The week before", what: "What happens when, and the menu.",
        locked: { why: "Add your day plan first.", label: community ? "Add the programme" : "Add the day plan", run: () => void fromSheet("plan") } });
  const where = find("where");
  steps.push(where
    ? { key: "where", icon: "pin", label: where.label, when: `The day before${day("where") ? ` · ${day("where")}` : ""}`, what: "Opens the map, directions and parking.", text: where.text, url: link + (where.hash ?? "") }
    : { key: "where", icon: "pin", label: "Directions and parking", when: "The day before", what: "The map and where to park.",
        locked: { why: "Add the place first.", label: "Add the place", run: () => void fromSheet("details") } });
  const reminder = find("reminder");
  if (reminder) steps.push({ key: "reminder", icon: "bell", label: reminder.label, when: `The day before${day("reminder") ? ` · ${day("reminder")}` : ""}`, what: "A friendly nudge, with the invitation link.", text: reminder.text, url: link });
  if (d.toggles.photo_wall) steps.push({ key: "photos", icon: "camera", label: sensitive ? "Photos and memories" : "On the day: photos and comments",
    when: `On the day${day("today") ? ` · ${day("today")}` : ""}`, what: "Opens the photo wall: guests add photos and cheer along, live.",
    text: sensitive ? `Photos and memories of ${title}. Please add yours here:` : `${title} is today! Add your photos and cheer along here:`, url: photosUrl });
  steps.push({ key: "news", icon: "megaphone", label: "News and updates", when: "Any time", what: "Updates show at the top of your page by themselves. Send an urgent one on WhatsApp too, because guests won't be looking at the page.",
    locked: { why: "", label: "Open Announce", run: () => void fromSheet("announce") } });
  const thanks = find("thanks");
  steps.push(ended && thanks
    ? { key: "thanks", icon: "heart", label: thanks.label, when: "Afterwards", what: "Opens your thank-you page, with everyone's photos.", text: thanks.text, url: link }
    : { key: "thanks", icon: "heart", label: "Thank you", when: `Afterwards${day("thanks") ? ` · from ${day("thanks")}` : ""}`,
        what: "Ready once the event is over: your page turns into the thank-you page, with the thank-you message and everyone's photos.",
        locked: { why: "Not ready to send yet.", label: "Preview the thank-you page", run: () => { previewAt("after"); void fromSheet("preview"); } } });

  // Straight after the first publish (owner, 20 Nov 2026): you're live, on
  // which plan for how long, one step left, and enjoy the day.
  const pl = plan(freePlanAt(d.plan, d.scale, b.now));
  const planLine = community ? "Free to set up, and your page is online now."
    : d.offerClaimed ? "Your code worked: you're on Keepsake, online for 12 months."
    : pl.key === "festive" ? "Free in our festive launch: your page stays online until 90 days after the event."
    : `You're on the free ${pl.name} plan: your page stays online until ${pl.duration} after the event.`;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {b.pub.first && (
        <section className="b2-live" role="status">
          <span className="b2-live-pop" aria-hidden="true">🎉</span>
          <div style={{ display: "grid", gap: 4 }}>
            <strong className="b2-h3">You’re live!</strong>
            <span className="b2-small">{planLine}</span>
            <span className="b2-small"><strong style={{ color: "var(--b2-text)" }}>One step left:</strong> send your invitation to your guests, below.{sensitive ? "" : " Enjoy your amazing day!"}</span>
          </div>
        </section>
      )}
      <section className="b2-invite">
        <p className="b2-kicker">Send this first</p>
        <h3 className="b2-h3">{community ? "Your event page" : sensitive ? "The details, for family and friends" : "Your invitation"}</h3>
        <p className="b2-small">{d.toggles.rsvp ? (sensitive ? "Guests open it and let the family know if they can come." : "Guests open the invitation and reply on it: yes, no or maybe.") : "Guests open it for all the details."}</p>
        <p className="b2-msgtext">{invite.text}<br /><span>{bare(link)}</span></p>
        <a className="b2-btn b2-primary b2-block b2-wa" href={whatsappUrl(link, invite.text)} target="_blank" rel="noreferrer"
          style={{ position: "relative" }} onClick={() => markHint("share-send")}>
          <Icon name="message" className="" />Send on WhatsApp
          {b.pub.first && <Hint id="share-send" label="Send it" style={{ right: 18, bottom: 4 }} />}
        </a>
        <div className="b2-chips">
          <button type="button" className="b2-chip b2-chip-sm" onClick={() => void share(link, invite.text)}><Icon name="share" className="" />More ways</button>
          <button type="button" className="b2-chip b2-chip-sm" onClick={() => void copy(`${invite.text}\n${link}`, "Invitation")}><Icon name="copy" className="" />Copy</button>
          <button type="button" className="b2-chip b2-chip-sm" aria-expanded={qr} onClick={() => setQr(!qr)}><Icon name="qr" className="" />QR code</button>
          {!community && <button type="button" className="b2-chip b2-chip-sm" onClick={() => void fromSheet("guests")}><Icon name="user" className="" />Personal invitations</button>}
        </div>
        {qr && (
          <div className="b2-qr">
            <span><QrCode text={short ?? link} className="block w-full" label="QR code for your invitation" /></span>
            <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <p className="b2-small">For printed cards and posters: point a phone’s camera at it.</p>
              <button type="button" className="b2-linkcopy" onClick={() => void copy(link, "Link")}><span>{bare(link)}</span><Icon name="copy" className="" /></button>
              {short && <button type="button" className="b2-linkcopy" onClick={() => void copy(short, "Short link")}><span>{bare(short)}</span><Icon name="copy" className="" /></button>}
            </div>
          </div>
        )}
      </section>

      <p className="b2-kicker" style={{ marginTop: 6 }}>Later, send these</p>
      {steps.map((m) => (
        <div key={m.key} className="b2-msg" data-locked={m.locked && m.key !== "news" ? "" : undefined}>
          <p className="b2-msgtitle"><Icon name={m.icon} className="" /><strong>{m.label}</strong></p>
          <p className="b2-when"><Icon name="calendar" className="" />{m.when}</p>
          <p className="b2-small">{m.what}</p>
          {m.locked ? (
            <>
              {m.locked.why && <p className="b2-small" style={{ color: "var(--b2-text)", fontWeight: 700 }}>{m.locked.why}</p>}
              <div className="b2-chips">
                <button type="button" className="b2-chip b2-chip-sm" onClick={m.locked.run}>{m.locked.label}</button>
              </div>
            </>
          ) : m.text && m.url && (
            <>
              <p className="b2-msgtext">{m.text}</p>
              <div className="b2-chips">
                <a className="b2-chip b2-chip-sm b2-wa" href={whatsappUrl(m.url, m.text)} target="_blank" rel="noreferrer"><Icon name="message" className="" />WhatsApp</a>
                <button type="button" className="b2-chip b2-chip-sm" onClick={() => void share(m.url!, m.text!)}><Icon name="share" className="" />Share</button>
                <button type="button" className="b2-chip b2-chip-sm" onClick={() => void copy(`${m.text}\n${m.url}`, "Message")}><Icon name="copy" className="" />Copy</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// Has the event finished (so the page now shows the thank-you)? The end
// time if there is one, otherwise midnight after the day, on this phone's clock.
export function eventEnded(d: Draft, now: number): boolean {
  if (!d.date) return false;
  const end = d.endTime ? new Date(`${d.date}T${d.endTime}:00`) : (() => { const x = new Date(`${d.date}T00:00:00`); x.setDate(x.getDate() + 1); return x; })();
  return now >= end.getTime();
}

// ─────────────── Preview: the card or the page, as guests will see it ───────────────
// Opened from the live little card (peek.tsx) on any step or panel. Below it,
// one tap to change the words, the names, when and where, or the look; Done
// on that panel comes straight back to where the host was.

const CHANGES: { panel: Panel; icon: IconName; label: string }[] = [
  { panel: "words", icon: "pen", label: "Words" },
  { panel: "people", icon: "people", label: "Names" },
  { panel: "details", icon: "calendar", label: "When and where" },
  { panel: "look", icon: "palette", label: "Look and photo" },
];

function PreviewBody() {
  const b = useB2();
  const fromSheet = useFromSheet();
  const { d, now } = b;
  // The whole page first, as guests get it after the envelope (owner, 23 Nov
  // 2026: the details matter as much as the card); the card alone is one tap.
  const [view, setView] = useState<"card" | "page">("page");
  const changes = CHANGES.filter((c) => c.panel !== b.nav.panel)
    .map((c) => (c.panel === "people" && d.scale === "community" ? { ...c, label: "Organiser" } : c));
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Chips label="Which to see" small value={view} onChange={(v) => v && setView(v)}
        options={[{ key: "page", label: "What guests see", icon: "layout" }, { key: "card", label: "Card only", icon: "envelope" }]} />
      <div className="b2-previewframe"><EventView data={toViewData(d)} view={view} now={now} /></div>
      <p className="b2-small">
        {!d.eventId ? "Only you can see this until you publish." : unpublishedChanges(d) ? "Your guests still see the last version you published, until you update it." : "This is what your guests see now."}
      </p>
      <div className="b2-sheetfoot">
        <div className="b2-chips b2-chips-scroll" role="group" aria-label="Change something">
          <span className="b2-label" style={{ alignSelf: "center" }}>Change:</span>
          {changes.map((c) => (
            <button key={c.panel} type="button" className="b2-chip b2-chip-sm" onClick={() => void fromSheet(c.panel)}>
              <Icon name={c.icon} className="" />{c.label}
            </button>
          ))}
        </div>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={() => void b.back()}>Carry on</button>
      </div>
    </div>
  );
}

// ─────────────── The bell: what needs doing, and reminders ───────────────

type Update = {
  tone: "todo" | "ok" | "info"; icon: IconName; title: string; line?: string; count?: number;
  action?: { label: string; panel?: Panel; run?: () => void };
};

export function updates(b: B2): Update[] {
  const { d, session } = b;
  const items: Update[] = [];
  const missing = missingForPublish(d);
  if (!b.saved) items.push({ tone: "todo", icon: "shield", title: "Not saved on this phone", line: "This browser isn't letting in2min2 save (private browsing, or the phone is full). Sign in and publish to keep your event safe." });
  if (!session) items.push({ tone: "todo", icon: "lock", title: "Sign in to keep your event safe", line: "Until then it's kept only on this phone.", action: { label: "Sign in", run: () => b.askSignIn("Sign in to keep your event safe in your account.") } });
  if (unpublishedChanges(d)) items.push({ tone: "todo", icon: "pen", title: "Changes not live yet", line: "Guests still see the last version you published.", action: { label: "Update my page", panel: "publish" } });
  if (!d.eventId && missing.length) items.push({ tone: "todo", icon: "list", title: `${missing.length} thing${missing.length > 1 ? "s" : ""} still needed to publish`, line: missing.map((m) => m.text).join(", "), action: { label: "Show me", panel: MISSING_PANEL[missing[0].step] ?? "publish" } });
  if (!d.eventId && !missing.length) items.push({ tone: "todo", icon: "check", title: "Ready to publish", line: "Everything needed is filled in.", action: { label: "Publish", panel: "publish" } });
  if (d.eventId && !unpublishedChanges(d)) items.push({ tone: "ok", icon: "check", title: "Your page is live", line: "Share the link with your guests." });
  // How long it stays online, and where to close it sooner (0015).
  const until = b.replies.usage?.hosting_until;
  if (d.eventId && until) items.push({ tone: "info", icon: "clock", title: `Online until ${new Date(until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    line: "Then it closes by itself. You can close it sooner in Settings, whenever you wish.", action: { label: "Settings", panel: "settings" } });
  const fresh = b.replies.fresh ?? 0;
  if (d.eventId && b.replies.rows) {
    const t = totals(b.replies.rows);
    items.push({ tone: fresh ? "todo" : "info", count: fresh, icon: "envelope", title: fresh ? `${fresh} new ${fresh === 1 ? "reply" : "replies"}` : "Guests' replies",
      line: t.replies ? `${t.coming} coming · ${t.maybe} maybe · ${t.cant} can't come${t.waiting ? ` · ${t.waiting} waiting` : ""}` : "No replies yet.",
      action: { label: "See replies", panel: "replies" } });
  }
  const needsYou = b.photos.needsYou ?? 0;
  if (d.eventId && b.photos.rows) {
    const onWall = b.photos.rows.filter((p) => p.status === "shown").length;
    items.push({ tone: needsYou ? "todo" : "info", count: needsYou, icon: "images", title: needsYou ? `${needsYou} ${needsYou === 1 ? "photo needs" : "photos need"} you` : "Guests' photos",
      line: needsYou ? "Waiting for your OK, or asked to be removed." : onWall ? `${onWall} on the wall.` : "No photos yet. On the day, guests add them here.",
      action: { label: "See photos", panel: "photos" } });
  }
  return items;
}

// A date as YYYY-MM-DD on this phone's own calendar.
const ymd = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

// When each ready-made message is best sent, from the event's date.
function reminderDates(d: Draft): Record<string, string> {
  if (!d.date) return {};
  const day = (n: number) => { const x = new Date(`${d.date}T12:00:00`); x.setDate(x.getDate() + n); return ymd(x); };
  return { order: day(-7), where: day(-1), reminder: day(-1), today: d.date, thanks: day(1) };
}

// How many ready-made messages are due to be sent today (published events only).
function dueToday(d: Draft, now: number): number {
  if (!d.publishedPath || !d.date) return 0;
  const dates = reminderDates(d);
  const today = ymd(new Date(now));
  return moments(d).filter((m) => m.key !== "invite" && dates[m.key] === today).length;
}

function BellBody() {
  const b = useB2();
  const fromSheet = useFromSheet();
  const list = updates(b);
  const link = eventLink(b.d);
  const dates = reminderDates(b.d);
  const today = ymd(new Date(b.now));
  const due = link ? moments(b.d).filter((m) => m.key !== "invite" && dates[m.key]) : [];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {list.map((it) => (
        <div key={it.title} className="b2-update" data-tone={it.tone}>
          <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name={it.icon} className="" /></span>
          <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 0 }}>
            <strong>{it.title}</strong>
            {it.line && <span className="b2-small">{it.line}</span>}
            {it.action && (
              <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" style={{ justifySelf: "start", marginTop: 4 }}
                onClick={() => { const a = it.action; if (a?.panel) void fromSheet(a.panel); else { void b.back().then(() => a?.run?.()); } }}>
                {it.action.label}
              </button>
            )}
          </div>
        </div>
      ))}

      <p className="b2-kicker" style={{ marginTop: 8 }}>Reminders</p>
      {!link ? (
        <p className="b2-small">Once your page is live, this reminds you what to send your guests, and when: the running order the week before, a reminder the day before, and a thank-you afterwards.</p>
      ) : !b.d.date ? (
        <p className="b2-small">Add the date of your event, and reminders of what to send appear here.</p>
      ) : (
        due.map((m) => {
          const when = dates[m.key];
          const now = when === today || (m.key === "where" && dates.reminder === today);
          const past = when < today;
          return (
            <div key={m.key} className="b2-update" data-tone={now ? "todo" : "info"} style={{ opacity: past && !now ? 0.6 : 1 }}>
              <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name={m.key === "thanks" ? "heart" : m.key === "order" ? "list" : m.key === "where" ? "pin" : "bell"} className="" /></span>
              <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 0 }}>
                <strong>{m.label}</strong>
                <span className="b2-small">{now ? "Send it today" : past ? `Was for ${formatDate(when, false)}` : `Send on ${formatDate(when, false)}`}</span>
                {m.key === "thanks" && !eventEnded(b.d, b.now) ? (
                  <span className="b2-small">Ready once the event is over, when your page becomes the thank-you page.</span>
                ) : (
                  <a className="b2-chip b2-chip-sm b2-wa" style={{ justifySelf: "start", marginTop: 4 }} href={whatsappUrl(link + (m.hash ?? ""), m.text)} target="_blank" rel="noreferrer">
                    <Icon name="message" className="" />Send on WhatsApp
                  </a>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─────────────── You: account, light or dark, a new event ───────────────

function AccountBody() {
  const b = useB2();
  const [theme, toggleTheme] = useTheme();
  const email = b.session?.user.email ?? "";
  const t = eventType(b.d.eventType);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="b2-update" data-tone="info">
        <span className="b2-ico" style={{ background: "linear-gradient(135deg, var(--b2-violet), var(--b2-accent))", color: "#1a1330" }} aria-hidden="true">
          {email ? <strong style={{ fontSize: 20 }}>{email.slice(0, 1).toUpperCase()}</strong> : <Icon name="user" className="" />}
        </span>
        <div style={{ display: "grid", gap: 4, flex: 1, minWidth: 0 }}>
          {b.session ? (
            <><span className="b2-small">Signed in as</span><strong style={{ overflowWrap: "anywhere" }}>{email}</strong></>
          ) : (
            <>
              <strong>Not signed in</strong>
              <span className="b2-small">Your event is kept on this phone until you sign in.</span>
              <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" style={{ justifySelf: "start", marginTop: 4 }}
                onClick={() => void b.back().then(() => b.askSignIn("Sign in to keep your event safe in your account, and to publish."))}>
                <Icon name="lock" className="" />Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <Toggle icon="moon" label="Dark look" line="Easier on the eyes at night. Turn off for the light look." checked={theme === "dark"} onChange={() => toggleTheme()} />

      <button type="button" className="b2-row" onClick={() => void b.back().then(() => b.openSheet("events"))}>
        <span className="b2-ico" style={{ background: "linear-gradient(135deg, #8b7cff, #5e35b1)", color: "#fff" }} aria-hidden="true"><Icon name="list" className="" /></span>
        <span className="b2-grow"><strong>Your events</strong><small>Every event you’ve made, on any phone or computer</small></span>
        <Icon name="next" className="size-5" />
      </button>
      {t && (
        <button type="button" className="b2-row" onClick={() => void b.back().then(b.startAgain)}>
          <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name="plus" className="" /></span>
          <span className="b2-grow"><strong>Start a new event</strong><small>“{b.d.title || t.label}” stays in Your events</small></span>
        </button>
      )}

      <Link className="b2-row" href="/new/guide">
        <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name="book" className="" /></span>
        <span className="b2-grow"><strong>How it works</strong><small>Six steps, from invitation to thank-you</small></span>
        <Icon name="next" className="size-5" />
      </Link>

      <Link className="b2-row" href="/builder">
        <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name="layout" className="" /></span>
        <span className="b2-grow"><strong>Open the classic builder</strong><small>The same event, in the old look</small></span>
        <Icon name="next" className="size-5" />
      </Link>

      {b.session && (
        <button type="button" className="b2-row" onClick={() => { void supabase().auth.signOut(); void b.back(); b.say("You're signed out. Your event stays on this phone."); }}>
          <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name="logout" className="" /></span>
          <span className="b2-grow"><strong>Sign out</strong></span>
        </button>
      )}
    </div>
  );
}

// ─────────────── Sign in: your email, then the 6-digit code we email ───────────────

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("captcha")) return CAPTCHA_FAILED;
  if (m.includes("fetch") || m.includes("load failed") || m.includes("network")) return "Couldn't connect to the sign-in service. Check your signal and try again.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "Too many codes asked for just now. Please wait a few minutes and try again.";
  if (m.includes("expired") || m.includes("invalid")) return "That code didn't work. Check it, or ask for a new one.";
  if (m.includes("sending")) return "The email with your code couldn't be sent. Please try again in a minute.";
  if (m.includes("email")) return "Please check the email address.";
  return "Something went wrong. Please try again.";
}

function SignInBody({ why, onDone }: { why: string; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; detail: string } | null>(null);
  const fail = (e: { message: string; status?: number }) => setError({ text: friendly(e.message), detail: `${e.message}${e.status ? ` (${e.status})` : ""}` });
  const { box: captchaBox, token: captchaToken, used: captchaUsed } = useCaptcha();

  async function sendCode() {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { setError({ text: "Please check the email address.", detail: "" }); return; }
    setBusy(true); setError(null);
    // Waits for the "are you a person?" check (components/captcha.tsx).
    const captcha = await captchaToken();
    const { error: e } = await supabase().auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true, captchaToken: captcha ?? undefined } });
    captchaUsed();
    setBusy(false);
    if (e) { fail(e); return; }
    setEmail(clean);
    setStage("code");
  }
  async function checkCode() {
    setBusy(true); setError(null);
    const { error: e } = await supabase().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (e) { fail(e); return; }
    onDone();
  }
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p className="b2-lead">{why || "Free, with no password: we email you a 6-digit code."}</p>
      <ol className="b2-steps" aria-label="Two steps">
        <li data-on={stage === "email" ? "" : undefined}><span>{stage === "email" ? "1" : "✓"}</span>Your email</li>
        <li data-on={stage === "code" ? "" : undefined}><span>2</span>The code we email you</li>
      </ol>
      {stage === "email" ? (
        <form style={{ display: "grid", gap: 12 }} onSubmit={(e) => { e.preventDefault(); void sendCode(); }}>
          <input className="b2-input" type="email" inputMode="email" autoComplete="email" aria-label="Your email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          <button type="submit" className="b2-btn b2-primary b2-block" disabled={busy || !email.trim()}>{busy ? "Sending…" : "Email me a code"}</button>
        </form>
      ) : (
        <form style={{ display: "grid", gap: 12 }} onSubmit={(e) => { e.preventDefault(); void checkCode(); }}>
          <p className="b2-small">Sent to <strong style={{ color: "var(--b2-text)" }}>{email}</strong> from codes@in2min2.com. It can take a minute. Not there? Check <strong style={{ color: "var(--b2-text)" }}>Junk</strong> or <strong style={{ color: "var(--b2-text)" }}>Promotions</strong>, and mark it “Not junk”.</p>
          <input className="b2-input b2-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} aria-label="The 6-digit code"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
          <button type="submit" className="b2-btn b2-primary b2-block" disabled={busy || code.length < 6}>{busy ? "Checking…" : "Sign in"}</button>
          <ResendCode onSend={sendCode} busy={busy} />
          <button type="button" className="b2-btn b2-quiet" onClick={() => { setStage("email"); setCode(""); setError(null); }}>Use another email</button>
        </form>
      )}
      <div ref={captchaBox} />
      {error && <p className="b2-note" data-tone="warn">{error.text}</p>}
      {error?.detail && <p className="b2-small">Details for Claude Code: {error.detail}</p>}
      <p className="b2-small">Free. Your event is kept safe in your account, and you can sign in on any phone.
        {!DRAFT && <> By signing in you agree to the <Link className="b2-link" href="/terms" target="_blank">terms</Link>; here’s our <Link className="b2-link" href="/privacy" target="_blank">privacy notice</Link>.</>}</p>
    </div>
  );
}

// "Send the code again", after a one-minute wait (so it can't flood anyone's inbox).
function ResendCode({ onSend, busy }: { onSend: () => Promise<void>; busy: boolean }) {
  const [wait, setWait] = useState(60);
  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);
  return (
    <button type="button" className="b2-btn b2-quiet" disabled={busy || wait > 0} onClick={() => { setWait(60); void onSend(); }}>
      {wait > 0 ? `Send the code again in ${wait}s` : "Send the code again"}
    </button>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="b2-pill">{children}</span>;
}
