"use client";

// The builder's top-right corner, as in most apps: Share, the bell (what needs
// doing, and later guests' replies), and Settings (account and shortcuts).

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { missingForPublish, unpublishedChanges, type Draft } from "@/lib/draft";
import { shareLink } from "@/lib/share";
import { totals, type RepliesState } from "./replies";
import { ShareLinks } from "./share-links";
import { supabase } from "@/lib/supabase/client";

type Common = {
  d: Draft;
  session: Session | null;
  goTo: (step: number) => void;
  askSignIn: (why: string) => void;
  say: (message: string) => void;
  replies?: RepliesState;
  openReplies?: () => void;
};

export function eventLink(d: Draft): string | null {
  return d.publishedPath && typeof window !== "undefined" ? `${window.location.origin}${d.publishedPath}` : null;
}

export async function shareEvent(d: Draft, say: (m: string) => void) {
  const link = eventLink(d);
  if (!link) return;
  const r = await shareLink(link, d.title.trim() || "Our event");
  if (r === "copied") say("Link copied. Paste it into WhatsApp or a message.");
  if (r === "failed") say("Couldn't share from this browser. Copy the link from step 7.");
}

export function TopBar(props: Common & { onStartAgain: () => void }) {
  return (
    // relative: the panels line up with the right-hand edge of this bar
    <span className="relative flex items-center gap-1">
      <ShareButton {...props} />
      <Bell {...props} />
      <SettingsMenu {...props} />
    </span>
  );
}

const iconButton = "relative grid size-11 place-items-center rounded-full text-ink transition hover:bg-wash aria-expanded:bg-wash";

const shareIcon = (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" /><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16" />
  </svg>
);

// Before publishing: explains that publishing comes first. After: every link
// and a ready-made message for each moment (share-links.tsx).
function ShareButton({ d, goTo, say }: Common) {
  const link = eventLink(d);
  if (!link) {
    return (
      <button type="button" className={iconButton} aria-label="Share (publish first)"
        onClick={() => { goTo(6); say("Publish your page first, then share its link."); }}>
        {shareIcon}
      </button>
    );
  }
  return (
    <Popover label="Share your event" icon={shareIcon}>
      {() => (
        <>
          <p className="px-2 pb-1 pt-1.5 text-sm font-bold uppercase tracking-wider text-muted">Share</p>
          <ShareLinks d={d} say={say} link={link} />
        </>
      )}
    </Popover>
  );
}

// A button that opens a small panel under it. Closes on a tap outside or Escape.
function Popover({ label, icon, badge, children }: { label: string; icon: ReactNode; badge?: number; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <span ref={box}>
      <button type="button" className={iconButton} aria-label={badge ? `${label} (${badge})` : label} aria-expanded={open} aria-controls={id}
        onClick={() => setOpen((v) => !v)}>
        {icon}
        {!!badge && (
          <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-marigold px-1 text-[11px] font-extrabold text-ink ring-2 ring-cream" aria-hidden="true">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div id={id} className="absolute right-0 top-[calc(100%+6px)] z-40 grid max-h-[min(80dvh,680px)] w-[min(92vw,360px)] gap-1 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-card p-2 text-left shadow-[0_18px_40px_-14px_rgba(28,26,58,0.45)]">
          {children(() => setOpen(false))}
        </div>
      )}
    </span>
  );
}

type Update = { tone: "todo" | "ok" | "info"; title: string; line?: string; action?: { label: string; run: () => void } };

function Bell({ d, session, goTo, askSignIn, say, replies, openReplies }: Common) {
  const items: Update[] = [];
  const missing = missingForPublish(d);
  if (!session) items.push({ tone: "todo", title: "Sign in to keep your event safe", line: "Until then it's kept only on this phone.", action: { label: "Sign in", run: () => askSignIn("Sign in to keep your event safe in your account.") } });
  if (unpublishedChanges(d)) items.push({ tone: "todo", title: "Changes not live yet", line: "Guests still see the last version you published.", action: { label: "Update my page", run: () => goTo(6) } });
  if (!d.eventId && missing.length) items.push({ tone: "todo", title: `${missing.length} thing${missing.length > 1 ? "s" : ""} still needed to publish`, line: missing.map((m) => m.text).join(", "), action: { label: "Show me", run: () => goTo(missing[0].step) } });
  if (!d.eventId && !missing.length) items.push({ tone: "todo", title: "Ready to publish", line: "Everything needed is filled in.", action: { label: "Publish", run: () => goTo(6) } });
  if (d.eventId && !unpublishedChanges(d)) items.push({ tone: "ok", title: "Your page is live", line: "Share the link with your guests.", action: { label: "Share", run: () => void shareEvent(d, say) } });
  const todos = items.filter((i) => i.tone === "todo").length;
  const fresh = replies?.fresh ?? 0;
  if (d.eventId && replies?.rows) {
    const t = totals(replies.rows);
    items.push({
      tone: fresh ? "todo" : "info",
      title: fresh ? `${fresh} new ${fresh === 1 ? "reply" : "replies"}` : "Guests' replies",
      line: t.replies ? `${t.coming} coming · ${t.maybe} maybe · ${t.cant} can't come${t.waiting ? ` · ${t.waiting} waiting` : ""}` : "No replies yet.",
      action: openReplies ? { label: "See replies", run: openReplies } : undefined,
    });
  } else {
    items.push({ tone: "info", title: "Guests' replies", line: d.eventId ? "Sign in to see who's replied." : "Once your page is published, each reply appears here." });
  }
  const count = todos + fresh;

  return (
    <Popover label="Updates" badge={count} icon={
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2zM10 20.5a2 2 0 0 0 4 0" />
      </svg>
    }>
      {(close) => (
        <>
          <p className="px-2 pb-1 pt-1.5 text-sm font-bold uppercase tracking-wider text-muted">Updates</p>
          {items.map((it) => (
            <div key={it.title} className={`grid gap-1 rounded-xl p-3 ${it.tone === "todo" ? "bg-amber-wash" : it.tone === "ok" ? "bg-wash" : ""}`}>
              <p className="flex items-center gap-2 font-semibold">
                <span className={`size-2.5 shrink-0 rounded-full ${it.tone === "todo" ? "bg-marigold" : it.tone === "ok" ? "bg-brand" : "bg-line"}`} aria-hidden="true" />
                {it.title}
              </p>
              {it.line && <p className="text-[15px] leading-snug text-muted">{it.line}</p>}
              {it.action && (
                <button type="button" onClick={() => { close(); it.action?.run(); }}
                  className="justify-self-start rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-deep">
                  {it.action.label}
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </Popover>
  );
}

function SettingsMenu({ session, goTo, askSignIn, onStartAgain }: Common & { onStartAgain: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const email = session?.user.email ?? "";
  const row = "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left font-semibold hover:bg-wash";
  return (
    <Popover label="Settings and account" icon={
      session ? (
        <span className="grid size-8 place-items-center rounded-full bg-brand font-display text-[15px] font-extrabold uppercase text-white" aria-hidden="true">
          {email.slice(0, 1) || "?"}
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      )
    }>
      {(close) => (
        <>
          <div className="grid gap-0.5 rounded-xl bg-wash p-3">
            {session ? (
              <>
                <p className="text-sm text-muted">Signed in as</p>
                <p className="truncate font-semibold">{email}</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Not signed in</p>
                <button type="button" onClick={() => { close(); askSignIn("Sign in to keep your event safe in your account."); }}
                  className="mt-1 justify-self-start rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-deep">Sign in</button>
              </>
            )}
          </div>
          <p className="px-3 pb-0.5 pt-2 text-sm font-bold uppercase tracking-wider text-muted">This event</p>
          <button type="button" className={row} onClick={() => { close(); goTo(5); }}>Switches and privacy</button>
          <button type="button" className={row} onClick={() => { close(); goTo(4); }}>Colours, border and photo</button>
          <button type="button" className={row} onClick={() => { close(); goTo(6); }}>Web address and publishing</button>
          {!confirm ? (
            <button type="button" className={row} onClick={() => setConfirm(true)}>Start a new event</button>
          ) : (
            <div className="grid gap-2 rounded-xl border-2 border-marigold p-3">
              <p className="text-[15px] font-semibold">Clear this event from this phone? A published page stays online.</p>
              <div className="flex gap-2">
                <button type="button" className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white" onClick={() => { setConfirm(false); close(); onStartAgain(); }}>Yes, start new</button>
                <button type="button" className="rounded-full bg-wash px-4 py-2 text-sm font-bold" onClick={() => setConfirm(false)}>Keep it</button>
              </div>
            </div>
          )}
          {session && (
            <>
              <div className="my-1 h-px bg-line" aria-hidden="true" />
              <button type="button" className={`${row} text-brand`} onClick={() => { close(); void supabase().auth.signOut(); }}>Sign out</button>
            </>
          )}
        </>
      )}
    </Popover>
  );
}
