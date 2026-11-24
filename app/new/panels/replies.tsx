"use client";

// Guests' replies (0004), for the host: days to go and places left at the
// venue, the numbers (in people, as the caterer needs them), food needs ticked
// (0014), then every reply, numbered (No. 1 the first in), with its people,
// food needs and message. Filters (24 Nov 2026) narrow the list to one answer,
// to those who left a comment, or to who needs which food (tap "Nut allergy" to
// see whose). A reminder on WhatsApp, and the numbered list copied for the
// caterer or venue. Row Level Security decides who sees them: the event's own
// hosts only.

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { AppIcon } from "@/components/app-icons";
import { daysUntil, formatDate } from "@/lib/event-view";
import { copyLink, whatsappUrl } from "@/lib/share";
import { foodLabel } from "@/lib/catalog";
import { copyText, filterCounts, foodIcon, foodOf, foodTotals, isAllergy, matchesFilter, replyNo, totals, type Reply, type ReplyFilter } from "../../builder/replies";
import { useB2 } from "../context";
import { PanelShell } from "../panels";
import { eventLink } from "../sheets";
import { Note } from "../ui";

const LABEL: Record<Reply["rsvp_status"], string> = { attending: "Coming", maybe: "Maybe", declined: "Can't come", waitlist: "Waiting list", invited: "Not replied" };

function ago(iso: string | null, now: number): string {
  if (!iso) return "";
  const mins = Math.round((now - Date.parse(iso)) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.round(hrs / 24);
  return days < 7 ? `${days} day${days > 1 ? "s" : ""} ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function RepliesPanel() {
  const b = useB2();
  const { d, replies: state } = b;
  const [confirm, setConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReplyFilter>("all");
  const [now] = useState(() => Date.now());
  const { markSeen, refresh } = state;
  useEffect(() => { markSeen(); refresh(); }, [markSeen]); // eslint-disable-line react-hooks/exhaustive-deps -- once, on opening

  const link = eventLink(d);
  if (!d.eventId) {
    return (
      <PanelShell icon="message" title="Replies" line="Guests say yes, no or maybe on your page, and how many are coming.">
        <Note>Once your page is published, every reply appears here, with its message, and on the bell.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.open("publish")}>Check and publish</button>
      </PanelShell>
    );
  }
  if (!b.session) {
    return (
      <PanelShell icon="message" title="Replies">
        <Note>Sign in to see who has replied.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.askSignIn("Sign in to see your guests' replies.")}>Sign in</button>
      </PanelShell>
    );
  }

  const rows = (state.rows ?? []).filter((r) => r.rsvp_status !== "invited");
  const notYet = (state.rows ?? []).length - rows.length;   // personal invitations not answered
  const t = totals(rows);
  const names = rows.map((r) => r.full_name.trim().toLowerCase());
  const twice = new Set(names.filter((n, i) => names.indexOf(n) !== i));
  const title = d.title.trim() || "Our event";
  const u = state.usage;
  const food = foodTotals(rows);
  const counts = filterCounts(rows);
  // A filter that no longer shows anything (the last reply removed) goes back to all.
  const active: ReplyFilter = filter === "all" || (filter.startsWith("need:") ? food.some((f) => `need:${f.key}` === filter) : counts[filter as keyof typeof counts] > 0) ? filter : "all";
  const shown = rows.map((r, i) => ({ r, no: replyNo(rows, i) })).filter(({ r }) => matchesFilter(r, active));
  const days = d.date ? daysUntil(d.date, d.timezone, now) : null;
  const left = u && u.venue_capacity !== null ? Math.max(0, u.capacity_left ?? 0) : null;
  const reminder = `Reminder: ${title}${d.date ? ` is on ${formatDate(d.date)}` : ""}. If you haven't replied yet, please tap the link and let us know:`;

  return (
    <PanelShell icon="message" title="Replies" line={d.toggles.rsvp ? "Every reply, with its message. New ones also show on the bell." : "Replies are switched off in Settings, so guests can't reply."}>
      {state.error && <Note tone="warn">{state.error}</Note>}
      {(days !== null && days >= 0) || left !== null ? (
        <div className="b2-stats b2-stats-two" data-one={days === null || days < 0 || left === null ? "" : undefined}>
          {days !== null && days >= 0 && (
            <div className="b2-stat" data-k="days">
              <span className="b2-small">{days === 0 ? "The day" : "Days to go"}</span>
              <strong>{days === 0 ? "Today" : days}</strong>
              <span className="b2-small">{days === 0 ? "Enjoy it!" : days === 1 ? "It's tomorrow" : `until ${formatDate(d.date, false)}`}</span>
            </div>
          )}
          {left !== null && u && (
            <div className="b2-stat" data-k="left" data-full={left === 0 ? "" : undefined}>
              <span className="b2-small">Places left</span>
              <strong>{left === 0 ? "Full" : left}</strong>
              <span className="b2-small">{left === 0 ? "New replies join the waiting list" : `of ${u.venue_capacity} at the venue`}</span>
            </div>
          )}
        </div>
      ) : null}
      <div className="b2-stats">
        {([["Coming", t.coming, "people"], ["Maybe", t.maybe, "people"], ["Can't come", t.cant, t.cant === 1 ? "reply" : "replies"], ["Waiting", t.waiting, "people"]] as const).map(([k, n, unit]) => (
          <div key={k} className="b2-stat"><span className="b2-small">{k}</span><strong>{n}</strong><span className="b2-small">{unit}</span></div>
        ))}
      </div>
      {u && (
        <p className="b2-small">
          {u.guest_limit !== null && <>{u.people} of {u.guest_limit} people on your plan{u.level === "near" ? " (nearly full)" : u.level === "full" || u.level === "over" ? " (full)" : ""}. </>}
          {u.venue_capacity === null && (
            <>To see places left, add the venue&apos;s safe capacity in{" "}
              <button type="button" className="b2-link" onClick={() => b.open("details")}>When and where</button>.</>
          )}
        </p>
      )}
      {food.length > 0 && <p className="b2-small" style={{ margin: 0 }}>Food needs (number of replies). Tap one to see who:</p>}
      {food.length > 0 && (
        <div className="b2-chips" role="radiogroup" aria-label="Food needs, in replies">
          {food.map((f) => {
            const k = `need:${f.key}` as const;
            return (
              <button key={f.key} type="button" role="radio" aria-checked={active === k} className="b2-chip b2-chip-sm" data-alert={isAllergy(f.key) ? "" : undefined}
                onClick={() => setFilter(active === k ? "all" : k)}>
                <span aria-hidden="true">{f.icon}</span> {f.label} · {f.n}
              </button>
            );
          })}
        </div>
      )}
      <div className="b2-chips">
        {link && <a className="b2-chip b2-chip-sm b2-wa" href={whatsappUrl(link, reminder)} target="_blank" rel="noreferrer"><AppIcon app="whatsapp" bare size={18} />Send a reminder</a>}
        <button type="button" className="b2-chip b2-chip-sm" disabled={!rows.length}
          onClick={async () => b.say((await copyLink(copyText(title, rows, u))) === "copied" ? "List copied. Paste it for the caterer or venue." : "Couldn't copy here.")}>
          <Icon name="copy" className="" />Copy the list
        </button>
        <button type="button" className="b2-chip b2-chip-sm" onClick={refresh}>Refresh</button>
      </div>

      {state.rows === null && !state.error && <p className="b2-small">Loading…</p>}
      {state.rows !== null && rows.length === 0 && <Note>No replies yet. Share your link, and each reply appears here and on the bell.</Note>}
      {rows.length > 0 && (
        <div className="b2-chips" role="radiogroup" aria-label="Show these replies">
          {([["all", "All", counts.all], ["attending", "Coming", counts.attending], ["maybe", "Maybe", counts.maybe], ["declined", "Can't come", counts.declined],
            ["waitlist", "Waiting list", counts.waitlist], ["comment", "With a message", counts.comment], ["food", "With food needs", counts.food]] as const)
            .filter(([k, , n]) => k === "all" || n > 0).map(([k, label, n]) => (
              <button key={k} type="button" role="radio" aria-checked={active === k} className="b2-chip b2-chip-sm" onClick={() => setFilter(k)}>{label} · {n}</button>
            ))}
        </div>
      )}
      {rows.length > 0 && (
        <p className="b2-small" style={{ margin: 0 }}>
          {active === "all"
            ? `${rows.length} ${rows.length === 1 ? "reply" : "replies"}, newest first`
            : `Showing ${shown.length} of ${rows.length} ${rows.length === 1 ? "reply" : "replies"}, newest first`}
          {notYet > 0 ? ` · ${notYet} personal ${notYet === 1 ? "invitation" : "invitations"} not answered yet` : ""}
        </p>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {shown.map(({ r, no }) => {
          const needs = foodOf(r);
          const note = r.rsvp_note?.trim();
          return (
            <div key={r.id} className="b2-subcard">
              <p style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", margin: 0 }}>
                <strong style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span className="b2-num" aria-label={`Reply ${no}`}>{no}</span>
                  <span style={{ overflowWrap: "anywhere" }}>{r.full_name}</span>
                </strong>
                <span className="b2-pill" data-status={r.rsvp_status}>{LABEL[r.rsvp_status]}</span>
              </p>
              {(r.rsvp_status !== "declined" || needs.length > 0) && (
                <div className="b2-facts">
                  {r.rsvp_status !== "declined" && (
                    <div className="b2-fact">
                      <span className="b2-small">{r.party_size === 1 ? "Person" : "People"}</span>
                      <strong>{r.party_size}</strong>
                    </div>
                  )}
                  {needs.length > 0 && (
                    <div className="b2-fact" data-grow="">
                      <span className="b2-small">Food needs</span>
                      <span className="b2-chips">
                        {needs.map((k) => (
                          <span key={k} className="b2-chip b2-chip-sm" data-alert={isAllergy(k) ? "" : undefined}>
                            <span aria-hidden="true">{foodIcon(k)}</span> {foodLabel(k)}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {note && <blockquote className="b2-quote" aria-label="Their message">&ldquo;{note}&rdquo;</blockquote>}
              <p className="b2-small" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span>{ago(r.rsvp_at ?? r.created_at, now)}{twice.has(r.full_name.trim().toLowerCase()) ? " · Same name as another reply" : ""}</span>
                {confirm === r.id ? (
                  <span style={{ display: "flex", gap: 12 }}>
                    <button type="button" className="b2-link" onClick={async () => { setConfirm(null); b.say((await state.remove(r.id)) ? "Reply removed." : "Couldn't remove it. Only the owner and co-hosts can."); }}>Yes, remove</button>
                    <button type="button" className="b2-link" onClick={() => setConfirm(null)}>Keep</button>
                  </span>
                ) : <button type="button" className="b2-link" onClick={() => setConfirm(r.id)}>Remove</button>}
              </p>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}
