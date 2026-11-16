"use client";

// The host's side of guests' live comments and cheers (0011): switch them
// on or off, check words before they show, choose where they go on the TV,
// and show or hide each one. Settings sit in feature_toggles.settings.cheers.

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { CHEER_EMOJI, timeAgo, type CheerEmoji } from "@/lib/live";
import { supabase } from "@/lib/supabase/client";
import { useB2 } from "../context";
import { Chips, Note, Section, Toggle } from "../ui";

type Row = { id: string; name: string | null; body: string | null; emoji: CheerEmoji | null; status: "shown" | "waiting" | "hidden"; created_at: string };
type Settings = Record<string, unknown> & { cheers?: { on?: boolean; approve_first?: boolean; tv?: "right" | "bottom" | "off" } };
const TV: { key: "right" | "bottom" | "off"; label: string }[] = [
  { key: "right", label: "On the right" }, { key: "bottom", label: "Along the bottom" }, { key: "off", label: "Not on the TV" },
];

export function CheersSection({ eventId, checkByDefault }: { eventId: string; checkByDefault: boolean }) {
  const b = useB2();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [c, f] = await Promise.all([
      supabase().from("event_cheers").select("id, name, body, emoji, status, created_at").eq("event_id", eventId).order("created_at", { ascending: false }).limit(100),
      supabase().from("feature_toggles").select("settings").eq("event_id", eventId).maybeSingle(),
    ]);
    if (c.error) { setError(c.error.message.includes("event_cheers") ? "Live comments switch on once the database file 0011 has been run." : `Couldn't load comments. (Details for Claude Code: ${c.error.message})`); return; }
    setRows(c.data as Row[]);
    setSettings(((f.data?.settings as Settings | null) ?? {}));
    setNow(Date.now());
  }, [eventId]);
  useEffect(() => { const t = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(t); }, [load]);

  async function save(patch: NonNullable<Settings["cheers"]>, done: string) {
    const next = { ...(settings ?? {}), cheers: { ...(settings?.cheers ?? {}), ...patch } };
    const r = await supabase().from("feature_toggles").update({ settings: next }).eq("event_id", eventId);
    b.say(r.error ? "Couldn't save. Please try again." : done);
    await load();
  }
  async function setStatus(id: string, status: Row["status"], done: string) {
    const r = await supabase().from("event_cheers").update({ status }).eq("id", id);
    b.say(r.error ? "That didn't work. Please try again." : done);
    await load();
  }

  const c = settings?.cheers ?? {};
  const on = c.on !== false;
  const check = c.approve_first ?? checkByDefault;
  const tv = c.tv ?? "right";
  const words = (rows ?? []).filter((r) => r.body);
  const waiting = words.filter((r) => r.status === "waiting");
  const others = words.filter((r) => r.status !== "waiting");
  const cheers = (rows ?? []).filter((r) => !r.body && r.status === "shown").length;
  const list = all ? others : others.slice(0, 8);

  return (
    <Section icon="message" title="Live comments and cheers" line="Guests cheer and comment from their phones, like a live show. They float up on the photo page and the TV."
      action={<button type="button" className="b2-chip b2-chip-sm" onClick={() => void load()}>Refresh</button>}>
      {error && <Note tone="warn">{error}</Note>}
      {settings && (
        <>
          <Toggle icon="message" label="Comments and cheers" line={on ? "Guests can send them." : "Switched off: nobody can send one."} checked={on}
            onChange={(v) => void save({ on: v }, v ? "Comments are on." : "Comments are off.")} />
          {on && (
            <>
              <Toggle icon="shield" label="Check words before they show" line="Emojis always show at once. Best for community events and memorials." checked={check}
                onChange={(v) => void save({ approve_first: v }, v ? "New comments will wait for your OK." : "New comments will show straight away.")} />
              <div className="b2-field">
                <span className="b2-label">On the TV wheel</span>
                <Chips label="Where comments go on the TV" small value={tv} options={TV}
                  onChange={(k) => k && void save({ tv: k }, k === "off" ? "Comments won't show on the TV." : k === "right" ? "Comments will run down the right of the TV." : "Comments will move along the bottom of the TV.")} />
              </div>
            </>
          )}
          <p className="b2-small">{words.length} {words.length === 1 ? "comment" : "comments"} · {cheers} emoji {cheers === 1 ? "cheer" : "cheers"}{waiting.length ? ` · ${waiting.length} waiting for you` : ""}</p>
        </>
      )}

      {waiting.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          <span className="b2-label">Waiting for your OK</span>
          {waiting.map((r) => (
            <CheerRow key={r.id} r={r} now={now}>
              <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={() => void setStatus(r.id, "shown", "Shown.")}>Show</button>
              <button type="button" className="b2-chip b2-chip-sm" onClick={() => void setStatus(r.id, "hidden", "Hidden.")}>Hide</button>
            </CheerRow>
          ))}
        </div>
      )}
      {list.map((r) => (
        <CheerRow key={r.id} r={r} now={now}>
          {r.status === "shown"
            ? <button type="button" className="b2-chip b2-chip-sm" onClick={() => void setStatus(r.id, "hidden", "Hidden from every screen.")}><Icon name="eye" className="" />Hide</button>
            : <button type="button" className="b2-chip b2-chip-sm" onClick={() => void setStatus(r.id, "shown", "Shown again.")}>Show again</button>}
        </CheerRow>
      ))}
      {others.length > 8 && (
        <button type="button" className="b2-link" style={{ justifySelf: "start" }} onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${others.length}`}</button>
      )}
    </Section>
  );
}

function CheerRow({ r, now, children }: { r: Row; now: number; children: ReactNode }) {
  return (
    <div className="b2-subcard" style={{ opacity: r.status === "hidden" ? 0.6 : 1 }}>
      <p style={{ margin: 0, overflowWrap: "anywhere" }}>
        <strong>{r.name?.trim() || "A guest"}</strong>{r.emoji ? ` ${CHEER_EMOJI[r.emoji].char}` : ""}
        <span className="b2-small" style={{ display: "block" }}>{timeAgo(r.created_at, now)}{r.status === "hidden" ? " · hidden" : ""}</span>
      </p>
      <p style={{ margin: 0, overflowWrap: "anywhere" }}>{r.body}</p>
      <div className="b2-chips">{children}</div>
    </div>
  );
}
