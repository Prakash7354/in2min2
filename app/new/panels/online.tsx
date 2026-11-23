"use client";

// How long the page stays online, and closing it early (0015; owner, 23 Nov
// 2026: "any event should be able to keep it to the end or cut it short
// without having to ask, and know where and how"). In Settings, and the bell
// points here. Closing sets events.closed_at (the owner and co-hosts may,
// under Row Level Security); guests then see "This page is now closed".
// Opening it again is possible within 30 days, while the plan's time lasts;
// after that guests' photos and details are deleted (privacy notice).

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { supabase } from "@/lib/supabase/client";
import { useB2 } from "../context";
import { Note, Section } from "../ui";

const DAY = 86_400_000;
type Row = { closed_at: string | null; hosting_until: string | null };

export function PageOnline() {
  const b = useB2();
  const { d, session } = b;
  const [row, setRow] = useState<Row | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!d.eventId || !session) return;
    const r = await supabase().from("events").select("closed_at, hosting_until").eq("id", d.eventId).maybeSingle();
    if (r.error) {
      // 42703: the column isn't there yet (0015 not run on this database).
      setProblem(r.error.code === "42703" ? "Closing early needs a database update first (0015)." : `Couldn't check your page. (Details for Claude Code: ${r.error.code ?? ""} ${r.error.message})`);
      return;
    }
    setProblem(null);
    setRow(r.data as Row | null);
  }, [d.eventId, session]);
  useEffect(() => { const t = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(t); }, [load]);

  if (!d.eventId) return null;
  const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: d.timezone || "Europe/London" });
  const set = async (closed: boolean) => {
    setBusy(true);
    const r = await supabase().from("events").update({ closed_at: closed ? new Date().toISOString() : null }).eq("id", d.eventId!).select("closed_at, hosting_until").maybeSingle();
    setBusy(false);
    setConfirm(false);
    if (r.error?.code === "42703") { b.say("This needs a database update first (0015)."); return; }
    if (r.error || !r.data) { b.say("Couldn't change it. Only the owner and co-hosts can."); return; }
    setRow(r.data as Row);
    b.say(closed ? "Your page is closed. Guests see that it's closed." : "Your page is open again.");
  };

  const until = row?.hosting_until ? Date.parse(row.hosting_until) : null;
  const closedAt = row?.closed_at ? Date.parse(row.closed_at) : null;
  const ended = until !== null && now >= until;
  const reopenBy = closedAt !== null ? Math.min(closedAt + 30 * DAY, until ?? Infinity) : null;
  const canReopen = reopenBy !== null && now < reopenBy;

  return (
    <Section icon="clock" title="Your page online" line="It closes by itself at the end of its time. You can close it sooner whenever you wish, without asking anyone.">
      {!session && <Note>Sign in to see how long your page stays online, or to close it.</Note>}
      {problem && <Note tone="warn">{problem}</Note>}
      {row && !closedAt && !ended && (
        <>
          {until !== null && <p style={{ margin: 0 }}>Online until <strong>{date(row.hosting_until!)}</strong>.</p>}
          {confirm ? (
            <div className="b2-subcard">
              <p style={{ margin: 0 }}>Close your page now? Guests will see “This page is now closed” instead of your page, replies and photos.</p>
              <p className="b2-small" style={{ margin: 0 }}>You can open it again within 30 days. After that, guests’ photos and details are deleted.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="b2-btn b2-primary" disabled={busy} onClick={() => void set(true)}>Yes, close it now</button>
                <button type="button" className="b2-btn b2-quiet" onClick={() => setConfirm(false)}>Keep it open</button>
              </div>
            </div>
          ) : (
            <button type="button" className="b2-btn b2-secondary" onClick={() => setConfirm(true)}><Icon name="lock" className="" />Close the page now</button>
          )}
        </>
      )}
      {row && closedAt !== null && (
        <>
          <Note>Closed on {date(row.closed_at!)}. Guests see “This page is now closed”.</Note>
          {canReopen ? (
            <>
              <button type="button" className="b2-btn b2-secondary" disabled={busy} onClick={() => void set(false)}><Icon name="eye" className="" />Open it again</button>
              <p className="b2-small" style={{ margin: 0 }}>You can open it again until {date(new Date(reopenBy!).toISOString())}. After that, guests’ photos and details are deleted.</p>
            </>
          ) : <p className="b2-small" style={{ margin: 0 }}>It can no longer be opened again.</p>}
        </>
      )}
      {row && !closedAt && ended && <Note>This page’s time has ended, so guests see that it’s closed.</Note>}
    </Section>
  );
}
