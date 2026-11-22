"use client";

// Guests' replies, for the host (0004). The numbers first (coming, maybe,
// can't come, waiting list, in people, as the caterer needs them), then every
// reply with its message. New replies show on the bell.
//
// Row Level Security decides who sees them: the event's own hosts only
// (supabase/tests/schema.test.mjs, "Replies").

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { FOOD_NEEDS, foodLabel, foodNeedsOf, type FoodNeed } from "@/lib/catalog";
import type { Draft } from "@/lib/draft";
import { formatDate } from "@/lib/event-view";
import { copyLink, whatsappUrl } from "@/lib/share";
import { supabase } from "@/lib/supabase/client";

export type Reply = {
  id: string; full_name: string; party_size: number; rsvp_status: "invited" | "attending" | "maybe" | "declined" | "waitlist";
  rsvp_at: string | null; rsvp_note: string | null; created_at: string;
  guest_metadata?: { food?: unknown } | null;   // food needs ticked on the reply form (0014)
};
type Usage = { people: number; attending: number; guest_limit: number | null; level: string; venue_capacity: number | null; capacity_left: number | null };

export type RepliesState = {
  rows: Reply[] | null;
  usage: Usage | null;
  error: string | null;
  fresh: number;               // replies since the host last looked
  refresh: () => void;
  markSeen: () => void;
  remove: (id: string) => Promise<boolean>;
};

const seenKey = (id: string) => `in2min2.repliesSeen.${id}`;

export function useReplies(eventId: string | undefined, session: Session | null): RepliesState {
  const [rows, setRows] = useState<Reply[] | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string>(() => {
    try { return eventId ? window.localStorage.getItem(seenKey(eventId)) ?? "" : ""; } catch { return ""; }
  });
  const live = !!eventId && !!session;

  const load = useCallback(async () => {
    if (!eventId || !session) return;
    const sb = supabase();
    const [r, u] = await Promise.all([
      sb.from("guest_crm").select("id, full_name, party_size, rsvp_status, rsvp_at, rsvp_note, created_at, guest_metadata")
        .eq("event_id", eventId).order("created_at", { ascending: false }).limit(1000),
      sb.rpc("event_usage", { p_event: eventId }),
    ]);
    if (r.error) { setError(`Couldn't load replies. (Details for Claude Code: ${r.error.code ?? ""} ${r.error.message})`); return; }
    setError(null);
    setRows(r.data as Reply[]);
    if (!u.error) setUsage(u.data as Usage);
  }, [eventId, session]);

  // Load now, then every minute while the builder is on screen.
  useEffect(() => {
    if (!live) return;
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [live, eventId, load]);

  const markSeen = useCallback(() => {
    if (!eventId) return;
    const now = new Date().toISOString();
    setSeen(now);
    try { window.localStorage.setItem(seenKey(eventId), now); } catch { /* fine */ }
  }, [eventId]);

  const remove = useCallback(async (id: string) => {
    const r = await supabase().from("guest_crm").delete().eq("id", id);
    if (r.error) return false;
    await load();
    return true;
  }, [load]);

  const fresh = (rows ?? []).filter((x) => x.rsvp_status !== "invited" && (x.rsvp_at ?? x.created_at) > seen).length;
  return { rows: live ? rows : null, usage: live ? usage : null, error, fresh: live ? fresh : 0, refresh: () => void load(), markSeen, remove };
}

export function totals(rows: Reply[]) {
  const sum = (st: Reply["rsvp_status"]) => rows.filter((r) => r.rsvp_status === st).reduce((n, r) => n + r.party_size, 0);
  const count = (st: Reply["rsvp_status"]) => rows.filter((r) => r.rsvp_status === st).length;
  return { coming: sum("attending"), maybe: sum("maybe"), cant: count("declined"), waiting: sum("waitlist"), replies: rows.filter((r) => r.rsvp_status !== "invited").length };
}

// Food needs (0014): each reply's, and how many replies (not declined) ticked
// each, for the caterer.
export function foodOf(r: Reply): FoodNeed[] {
  return r.rsvp_status === "declined" ? [] : foodNeedsOf(r.guest_metadata?.food);
}
export function foodTotals(rows: Reply[]): { key: FoodNeed; label: string; icon: string; n: number }[] {
  return FOOD_NEEDS.map((f) => ({ ...f, n: rows.filter((r) => foodOf(r).includes(f.key)).length })).filter((f) => f.n > 0);
}
// One line per reply for "Copy the list", and the summary above it.
const LIST_LABEL: Record<Reply["rsvp_status"], string> = { attending: "Coming", maybe: "Maybe", declined: "Can't come", waitlist: "Waiting list", invited: "Not replied" };
export function listLine(r: Reply): string {
  const food = foodOf(r);
  return `${r.full_name} · ${LIST_LABEL[r.rsvp_status]}${r.rsvp_status === "declined" ? "" : ` · ${r.party_size}`}`
    + `${food.length ? ` · ${food.map(foodLabel).join(", ")}` : ""}${r.rsvp_note ? ` · "${r.rsvp_note}"` : ""}`;
}
export function foodSummary(rows: Reply[]): string {
  const f = foodTotals(rows);
  return f.length ? `\nFood needs (replies): ${f.map((x) => `${x.label} ${x.n}`).join(", ")}.` : "";
}
// Each reply's number (owner, 22 Nov 2026): No. 1 is the first that came in,
// so the numbers stay put as new ones arrive. `rows` are newest first.
export const replyNo = (rows: Reply[], i: number) => rows.length - i;
// "Copy the list": the numbers, then one numbered line per reply, oldest
// first, with the same numbers as on the screen.
export function copyText(title: string, rows: Reply[], u?: { venue_capacity: number | null; capacity_left: number | null } | null): string {
  const t = totals(rows);
  const head = `${title}: ${t.replies} ${t.replies === 1 ? "reply" : "replies"}. ${t.coming} people coming, ${t.maybe} maybe, ${t.cant} can't come`
    + `${t.waiting ? `, ${t.waiting} on the waiting list` : ""}.`;
  const venue = u?.venue_capacity != null ? `\nPlaces left at the venue: ${Math.max(0, u.capacity_left ?? 0)} of ${u.venue_capacity}.` : "";
  const list = [...rows].reverse().map((r, i) => `${i + 1}. ${listLine(r)}`).join("\n");
  return `${head}${venue}${foodSummary(rows)}\n\n${list}`;
}

const LABEL: Record<Reply["rsvp_status"], string> = { attending: "Coming", maybe: "Maybe", declined: "Can't come", waitlist: "Waiting list", invited: "Not replied" };
const TONE: Record<Reply["rsvp_status"], string> = {
  attending: "bg-brand text-white", maybe: "bg-marigold text-ink", declined: "bg-wash text-muted", waitlist: "bg-amber-wash text-ink ring-1 ring-marigold", invited: "bg-wash text-muted",
};

function ago(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.round(hrs / 24);
  return days < 7 ? `${days} day${days > 1 ? "s" : ""} ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function RepliesDialog({ d, state, link, onClose, say }: { d: Draft; state: RepliesState; link: string | null; onClose: () => void; say: (m: string) => void }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const { markSeen, refresh } = state;
  useEffect(() => {
    markSeen();
    refresh();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the window opens
  }, []);

  const rows = (state.rows ?? []).filter((r) => r.rsvp_status !== "invited");
  const t = totals(rows);
  const names = rows.map((r) => r.full_name.trim().toLowerCase());
  const twice = new Set(names.filter((n, i) => names.indexOf(n) !== i));
  const title = d.title.trim() || "Our event";
  const u = state.usage;

  const food = foodTotals(rows);
  const reminder = `Reminder: ${title}${d.date ? ` is on ${formatDate(d.date)}` : ""}. If you haven't replied yet, please tap the link and let us know:`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="replies-title" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-card shadow-[0_-10px_40px_-10px_rgba(28,26,58,0.6)] sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="relative grid gap-1 bg-brand px-5 pb-5 pt-6 text-white">
          <h2 id="replies-title" className="font-display text-2xl font-extrabold leading-tight">Guests&apos; replies</h2>
          <p className="text-[15px] text-white/85">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-5">
          {state.error && <p className="rounded-2xl bg-amber-wash px-4 py-3 text-[15px]">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([["Coming", t.coming, "people"], ["Maybe", t.maybe, "people"], ["Can't come", t.cant, t.cant === 1 ? "reply" : "replies"], ["Waiting list", t.waiting, "people"]] as const).map(([k, n, unit]) => (
              <div key={k} className="grid rounded-2xl bg-wash p-3">
                <span className="text-sm font-semibold text-muted">{k}</span>
                <span className="font-display text-3xl font-extrabold text-brand tabular-nums">{n}</span>
                <span className="text-sm text-muted">{unit}</span>
              </div>
            ))}
          </div>
          {u && (
            <p className="text-[15px] text-muted">
              {u.guest_limit !== null && <>{u.people} of {u.guest_limit} people on your plan{u.level === "near" ? " (nearly full)" : u.level === "full" || u.level === "over" ? " (full)" : ""}. </>}
              {u.venue_capacity !== null && <>{u.attending} of {u.venue_capacity} places at the venue.</>}
            </p>
          )}

          {food.length > 0 && (
            <p className="text-[15px]"><span className="font-semibold">Food needs:</span> {food.map((f) => `${f.icon} ${f.label} ${f.n}`).join(" · ")}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {link && (
              <a href={whatsappUrl(link, reminder)} target="_blank" rel="noreferrer"
                className="inline-flex min-h-10 items-center rounded-full bg-[#25D366] px-4 text-sm font-bold text-[#073B1C]">Send a reminder on WhatsApp</a>
            )}
            <button type="button" className="inline-flex min-h-10 items-center rounded-full bg-wash px-4 text-sm font-bold hover:bg-line"
              onClick={async () => { const r = await copyLink(copyText(title, rows, u)); say(r === "copied" ? "List copied. Paste it for the caterer or venue." : "Couldn't copy here."); }}
              disabled={!rows.length}>Copy the list</button>
            <button type="button" className="inline-flex min-h-10 items-center rounded-full bg-wash px-4 text-sm font-bold hover:bg-line" onClick={refresh}>Refresh</button>
          </div>

          {state.rows === null && !state.error && <p className="text-muted">Loading…</p>}
          {state.rows !== null && rows.length === 0 && (
            <p className="rounded-2xl bg-wash px-4 py-3 text-[15px]">No replies yet. Share your link, and each reply will appear here and on the bell.</p>
          )}
          <ul className="grid gap-2">
            {rows.map((r, i) => (
              <li key={r.id} className="grid gap-1.5 rounded-2xl border border-line p-3">
                <p className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold"><span className="mr-1.5 text-muted tabular-nums">{replyNo(rows, i)}.</span>{r.full_name}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[r.rsvp_status]}`}>
                    {LABEL[r.rsvp_status]}{r.rsvp_status !== "declined" ? ` · ${r.party_size}` : ""}
                  </span>
                </p>
                {foodOf(r).length > 0 && <p className="text-sm text-muted">{foodOf(r).map(foodLabel).join(" · ")}</p>}
                {r.rsvp_note && <p className="text-[15px] leading-snug">&ldquo;{r.rsvp_note}&rdquo;</p>}
                <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                  <span>{ago(r.rsvp_at ?? r.created_at)}{twice.has(r.full_name.trim().toLowerCase()) ? " · Same name as another reply" : ""}</span>
                  {confirm === r.id ? (
                    <span className="flex gap-2">
                      <button type="button" className="font-bold text-brand underline"
                        onClick={async () => { setConfirm(null); say((await state.remove(r.id)) ? "Reply removed." : "Couldn't remove it. Only the owner and co-hosts can."); }}>Yes, remove</button>
                      <button type="button" className="font-bold" onClick={() => setConfirm(null)}>Keep</button>
                    </span>
                  ) : (
                    <button type="button" className="font-semibold underline underline-offset-2" onClick={() => setConfirm(r.id)}>Remove</button>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
