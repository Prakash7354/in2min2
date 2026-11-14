"use client";

// The reply form on the public event page (0004, submit_rsvp). Made for
// everyone, grandparents included: three big buttons, then a name, how many,
// an optional message, and one "Send my reply". No account, no email.
//
// The guest's private token is kept on their phone, so coming back shows
// their reply and "Change my reply" changes it rather than adding another.

import { useEffect, useState } from "react";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { addDays, zonedToUtcIso } from "@/lib/time";

type Status = "attending" | "maybe" | "declined";
type Saved = { token: string; name: string; status: Status | "waitlist"; partySize: number; note: string };
type Cal = { title: string; date: string; startTime: string; endTime: string; timezone: string; venue: string };

const s = (k: string) => `ev-${k}`;

const MESSAGES: Record<string, string> = {
  name: "Please type your name.",
  party_size: "One reply can be for up to 20 people. For more, please send a second reply.",
  note: "Please keep the message under 280 characters.",
  full: "The host is updating the guest list. Please check back soon.",
  busy: "Lots of replies are arriving. Please try again in a few minutes.",
  closed: "Replies for this event have closed. Please contact the host.",
  private: "Please reply from the personal link the host sent you.",
  no_more_room: "There isn't room for more people. Your earlier reply still stands.",
  no_event: "This event can't be found. Please check the link.",
};

export function Rsvp({ type, slug, token, guestName, guestReply, sensitive, hostName, cal }: {
  type: string; slug: string; token: string | null; guestName: string | null;
  guestReply: { status: string; partySize: number } | null; sensitive: boolean; hostName: string; cal: Cal;
}) {
  const key = `in2min2.reply.${type}/${slug}`;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [mode, setMode] = useState<"choose" | "details" | "done">("choose");
  const [status, setStatus] = useState<Status>("attending");
  const [name, setName] = useState(guestName ?? "");
  const [size, setSize] = useState(1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A reply made earlier on this phone, or through the guest's own link.
  useEffect(() => {
    let mine: Saved | null = null;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) mine = JSON.parse(raw) as Saved;
    } catch { /* private browsing: nothing saved */ }
    if (token && guestReply && guestReply.status !== "invited") {
      mine = { token, name: guestName ?? mine?.name ?? "", status: guestReply.status as Saved["status"], partySize: guestReply.partySize, note: mine?.note ?? "" };
    }
    if (mine) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this phone's saved reply once, after the first draw
      setSaved(mine);
      setName(mine.name); setSize(mine.partySize); setNote(mine.note);
      setMode("done");
    }
  }, [key, token, guestReply, guestName]);

  function choose(st: Status) {
    setStatus(st);
    setError(null);
    setMode("details");
  }

  async function send() {
    if (!name.trim()) { setError(MESSAGES.name); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_rsvp`, {
        method: "POST",
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          p_type: type, p_slug: slug, p_token: saved?.token ?? token ?? null,
          p_reply: { name: name.trim(), status, party_size: status === "declined" ? 1 : size, note: note.trim() },
        }),
      });
      const body = await res.json().catch(() => null) as { ok?: boolean; reason?: string; status?: Saved["status"]; token?: string; name?: string; party_size?: number; message?: string; code?: string } | null;
      if (!res.ok || !body) {
        setError(`Replies aren't open just yet. Please try again later. (Details for Claude Code: ${res.status} ${body?.code ?? ""} ${body?.message ?? ""})`);
        return;
      }
      if (!body.ok) { setError(MESSAGES[body.reason ?? ""] ?? "Something went wrong. Please try again."); return; }
      const next: Saved = { token: body.token ?? "", name: body.name ?? name.trim(), status: body.status ?? status, partySize: body.party_size ?? size, note: note.trim() };
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* still replied; just not remembered here */ }
      setSaved(next);
      setMode("done");
    } catch {
      setError("No connection. Check your signal and try again.");
    } finally {
      setBusy(false);
    }
  }

  const yes = sensitive ? "I’ll be there" : "Yes, we’ll come";
  const no = sensitive ? "I can’t attend" : "Sorry, can’t come";

  if (mode === "done" && saved) {
    const first = saved.name.split(" ")[0];
    const people = `${saved.partySize} ${saved.partySize === 1 ? "person" : "people"}`;
    const line = saved.status === "attending" ? (sensitive ? `You'll be there: ${people}.` : `You're coming: ${people}.`)
      : saved.status === "waitlist" ? `You're on the waiting list for ${people}. If places free up, you'll move up by yourself, in the order people replied.`
      : saved.status === "maybe" ? `You said maybe: ${people}.`
      : sensitive ? "Thank you for letting the family know." : "Sorry you can't make it. Thank you for letting us know.";
    return (
      <div className={s("replyDone")} role="status" aria-live="polite">
        <p className={s("replyBig")}>Thank you, {first}!</p>
        <p>{line}</p>
        {(saved.status === "attending" || saved.status === "maybe") && <CalendarLinks cal={cal} />}
        <div>
          <button type="button" className={`${s("btn")} ${s("btnGhost")} ${s("btnSmall")}`} onClick={() => { setStatus(saved.status === "waitlist" ? "attending" : saved.status as Status); setMode("details"); }}>
            Change my reply
          </button>
        </div>
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className={s("rsvpRow")}>
        <button type="button" className={s("btn")} onClick={() => choose("attending")}>{yes}</button>
        {!sensitive && <button type="button" className={`${s("btn")} ${s("btnGhost")}`} onClick={() => choose("maybe")}>Maybe</button>}
        <button type="button" className={`${s("btn")} ${s("btnGhost")}`} onClick={() => choose("declined")}>{no}</button>
      </div>
    );
  }

  return (
    <form className={s("replyForm")} onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <div className={s("rsvpRow")} role="radiogroup" aria-label="Your reply">
        {([["attending", yes], ...(sensitive ? [] : [["maybe", "Maybe"]]), ["declined", no]] as [Status, string][]).map(([k, label]) => (
          <button key={k} type="button" role="radio" aria-checked={status === k} onClick={() => setStatus(k)}
            className={`${s("btn")} ${status === k ? "" : s("btnGhost")}`}>
            {label}
          </button>
        ))}
      </div>
      <label className={s("field")}>
        <span className={s("label")}>Your name</span>
        <input className={s("input")} value={name} maxLength={80} autoComplete="name" onChange={(e) => setName(e.target.value)}
          placeholder={sensitive ? "Your name" : "For example, Sita Gurung"} />
      </label>
      {status !== "declined" && (
        <div className={s("field")}>
          <span className={s("label")} id="party-label">How many of you, including you?</span>
          <div className={s("stepper")} role="group" aria-labelledby="party-label">
            <button type="button" className={s("stepBtn")} aria-label="One fewer" disabled={size <= 1} onClick={() => setSize((n) => Math.max(1, n - 1))}>−</button>
            <span className={s("stepNum")} aria-live="polite">{size}</span>
            <button type="button" className={s("stepBtn")} aria-label="One more" disabled={size >= 20} onClick={() => setSize((n) => Math.min(20, n + 1))}>+</button>
          </div>
        </div>
      )}
      <label className={s("field")}>
        <span className={s("label")}>A message for {hostName} <span className={s("optional")}>(if you like)</span></span>
        <textarea className={s("input")} value={note} maxLength={280} rows={2} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className={s("replyError")} role="alert">{error}</p>}
      <div className={s("btnRow")}>
        <button type="submit" className={`${s("btn")} ${s("btnAccent")} ${s("btnBig")}`} disabled={busy}>{busy ? "Sending…" : "Send my reply"}</button>
        <button type="button" className={`${s("btn")} ${s("btnGhost")} ${s("btnSmall")}`} onClick={() => setMode(saved ? "done" : "choose")}>Back</button>
      </div>
    </form>
  );
}

// "Add to calendar": Google Calendar, or a file that Apple, Outlook and
// Samsung calendars all open.
function CalendarLinks({ cal }: { cal: Cal }) {
  if (!cal.date) return null;
  const start = zonedToUtcIso(cal.date, cal.startTime, cal.timezone);
  const end = cal.endTime
    ? zonedToUtcIso(cal.endTime > cal.startTime ? cal.date : addDays(cal.date, 1), cal.endTime, cal.timezone)
    : new Date(Date.parse(start) + 3 * 3600_000).toISOString();
  const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const here = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cal.title)}&dates=${stamp(start)}/${stamp(end)}`
    + `&location=${encodeURIComponent(cal.venue)}&details=${encodeURIComponent(here)}`;
  const esc = (t: string) => t.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//In2Min2//EN", "BEGIN:VEVENT", `UID:${stamp(start)}-${esc(cal.title).slice(0, 40)}@in2min2.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(cal.title)}`,
    `LOCATION:${esc(cal.venue)}`, `URL:${here}`, `DESCRIPTION:${esc(here)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return (
    <div className={s("btnRow")}>
      <a className={`${s("btn")} ${s("btnSmall")}`} href={google} target="_blank" rel="noreferrer">Add to Google Calendar</a>
      <a className={`${s("btn")} ${s("btnGhost")} ${s("btnSmall")}`} href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`} download="event.ics">
        Add to iPhone or Outlook
      </a>
    </div>
  );
}
