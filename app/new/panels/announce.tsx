"use client";

// Announcements (0011; owner, 16 Nov 2026: "news updates, change of weather
// plan, car park full, we are excited for everyone to see"). A short update
// goes to the top of the event page, the photos page and the TV at once;
// one tap sends it on WhatsApp too. Quick choices fill the box; the host
// finishes the sentence. Up to 10 a day.

import { useCallback, useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { eventType } from "@/lib/catalog";
import type { AnnouncementKind } from "@/lib/live";
import { timeAgo } from "@/lib/live";
import { whatsappUrl } from "@/lib/share";
import { supabase } from "@/lib/supabase/client";
import { useB2 } from "../context";
import { PanelShell } from "../panels";
import { eventLink } from "../sheets";
import { Chips, Note, Section } from "../ui";

type Quick = { kind: AnnouncementKind; icon: IconName; label: string; text: string; gentle?: boolean };
const QUICK: Quick[] = [
  { kind: "info", icon: "clock", label: "Running late", text: "We're running about 15 minutes late. See you soon!", gentle: true },
  { kind: "urgent", icon: "pin", label: "Car park full", text: "The car park is full. Please park at ", gentle: true },
  { kind: "urgent", icon: "sun", label: "Weather plan", text: "Because of the weather, we're moving indoors to ", gentle: true },
  { kind: "urgent", icon: "flag", label: "Change of place", text: "Change of place: we're now at ", gentle: true },
  { kind: "info", icon: "check", label: "Doors open", text: "Doors are open. Come on in!", gentle: true },
  { kind: "happy", icon: "bowlfood", label: "Food is served", text: "Food is served. Enjoy!" },
  { kind: "happy", icon: "heart", label: "Can't wait", text: "We can't wait to see you all!" },
  { kind: "happy", icon: "sparkle", label: "Thank you", text: "Thank you all for coming. What a day!" },
];
const KINDS: { key: AnnouncementKind; label: string }[] = [
  { key: "info", label: "Update" }, { key: "urgent", label: "Important" }, { key: "happy", label: "Good news" },
];
const MAX = 280;
type Row = { id: string; kind: AnnouncementKind; body: string; created_at: string };

export function AnnouncePanel() {
  const b = useB2();
  const { d } = b;
  const sensitive = !!eventType(d.eventType)?.sensitive;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<AnnouncementKind>("info");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const link = eventLink(d);

  const load = useCallback(async () => {
    if (!d.eventId) return;
    const r = await supabase().from("event_announcements").select("id, kind, body, created_at").eq("event_id", d.eventId)
      .order("created_at", { ascending: false }).limit(20);
    if (r.error) { setError(r.error.message.includes("event_announcements") ? "Announcements switch on once the database file 0011 has been run." : `Couldn't load them. (Details for Claude Code: ${r.error.message})`); return; }
    setRows(r.data as Row[]);
  }, [d.eventId]);
  useEffect(() => { if (b.session) { const t = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(t); } }, [b.session, load]);

  async function post() {
    if (!d.eventId || !text.trim() || busy) return;
    setBusy(true);
    setError(null);
    const r = await supabase().from("event_announcements").insert({ event_id: d.eventId, kind, body: text.trim().slice(0, MAX) });
    setBusy(false);
    if (r.error) {
      setError(r.error.message.includes("row-level security") ? "You've posted 10 updates today, the most for one day. Remove an old one, or try tomorrow."
        : `It couldn't be posted. (Details for Claude Code: ${r.error.message})`);
      return;
    }
    setText("");
    b.say("Posted. It's at the top of your page now.");
    await load();
  }
  async function remove(id: string) {
    const r = await supabase().from("event_announcements").delete().eq("id", id);
    b.say(r.error ? "Couldn't remove it. Only the owner and co-hosts can." : "Removed from your page.");
    await load();
  }

  if (!d.eventId) {
    return (
      <PanelShell icon="megaphone" title="Announce" line="Short updates for your guests, at the top of your page and on the TV.">
        <Note>Publish your page first. Then you can tell guests news on the day: running late, car park full, a weather plan.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.open("publish")}>Check and publish</button>
      </PanelShell>
    );
  }
  if (!b.session) {
    return (
      <PanelShell icon="megaphone" title="Announce">
        <Note>Sign in to post updates for your guests.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.askSignIn("Sign in to post updates for your guests.")}>Sign in</button>
      </PanelShell>
    );
  }

  const latest = rows?.[0];
  return (
    <PanelShell icon="megaphone" title="Announce" line="A short update goes to the top of your page, the photos page and the TV straight away."
      footer={<button type="button" className="b2-btn b2-primary b2-block" disabled={busy || !text.trim()} onClick={() => void post()}>
        <Icon name="megaphone" className="" />{busy ? "Posting…" : "Post it"}
      </button>}>
      <Section icon="pen" title="What's the news?" line="Tap one and finish the sentence, or write your own.">
        <div className="b2-chips">
          {QUICK.filter((q) => !sensitive || q.gentle).map((q) => (
            <button key={q.label} type="button" className="b2-chip b2-chip-sm" onClick={() => { setText(q.text); setKind(q.kind); }}>
              <Icon name={q.icon} className="" />{q.label}
            </button>
          ))}
        </div>
        <textarea className="b2-input b2-textarea" rows={3} value={text} maxLength={MAX} aria-label="Your update"
          placeholder="e.g. The car park is full. Please park at the school on Station Road."
          onChange={(e) => setText(e.target.value)} />
        <p className="b2-small" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span>Guests see it straight away. Up to 10 a day.</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{text.length}/{MAX}</span>
        </p>
        <div className="b2-field">
          <span className="b2-label">What kind?</span>
          <Chips label="What kind of update" small value={kind} options={KINDS} onChange={(k) => k && setKind(k)} />
          {kind === "urgent" && <span className="b2-small">Shown in red, so nobody misses it.</span>}
        </div>
      </Section>
      {error && <Note tone="warn">{error}</Note>}

      {latest && link && (
        <a className="b2-btn b2-primary b2-block b2-wa" href={whatsappUrl(link, latest.body)} target="_blank" rel="noreferrer">
          <Icon name="message" className="" />Send the latest on WhatsApp
        </a>
      )}

      <Section icon="list" title="Posted" line={rows?.length ? "Newest first. Guests see the newest in full; earlier ones fold away." : "Nothing yet."}>
        {rows?.map((a) => (
          <div key={a.id} className="b2-update" data-tone={a.kind === "urgent" ? "todo" : "info"}>
            <span className="b2-ico b2-ico-soft" aria-hidden="true"><Icon name="megaphone" className="" /></span>
            <div style={{ display: "grid", gap: 6, flex: 1, minWidth: 0 }}>
              <span className="b2-small">{KINDS.find((k) => k.key === a.kind)?.label} · {timeAgo(a.created_at, now)}</span>
              <span style={{ overflowWrap: "anywhere" }}>{a.body}</span>
              <span className="b2-chips">
                {link && (
                  <a className="b2-chip b2-chip-sm b2-wa" href={whatsappUrl(link, a.body)} target="_blank" rel="noreferrer">
                    <Icon name="message" className="" />WhatsApp
                  </a>
                )}
                <button type="button" className="b2-chip b2-chip-sm" onClick={() => void remove(a.id)}><Icon name="trash" className="" />Remove</button>
              </span>
            </div>
          </div>
        ))}
      </Section>
    </PanelShell>
  );
}
