"use client";

// The event Home (CONCEPT 7e): the event at the top, floating, with what
// state it's in; then big tiles with live numbers, each opening one simple
// panel. One bright button at the bottom: Publish, Update or Share.

import type { ReactNode } from "react";
import { motion } from "motion/react";
import EventView from "@/components/event/event-view";
import { Icon, type IconName } from "@/components/icons";
import { eventType, paletteFor, TOGGLES } from "@/lib/catalog";
import { missingForPublish, toViewData, unpublishedChanges } from "@/lib/draft";
import { formatDate, formatTime } from "@/lib/event-view";
import { totals } from "../builder/replies";
import { MISSING_PANEL, useB2 } from "./context";
import { TYPE_ART } from "./kinds";
import type { Panel } from "./nav";
import { TopButtons } from "./sheets";
import { BottomBar, spring } from "./ui";

export function Home() {
  const b = useB2();
  const { d, now } = b;
  const t = eventType(d.eventType);
  const art = TYPE_ART[d.eventType ?? ""];
  const p = paletteFor(d.palette, d.customColor);
  const live = !!d.eventId;
  const changed = unpublishedChanges(d);
  const missing = missingForPublish(d);
  const when = [d.date && formatDate(d.date, false), d.startTime && formatTime(d.startTime)].filter(Boolean).join(" · ");
  const r = b.replies.rows ? totals(b.replies.rows) : null;
  const onWall = b.photos.rows?.filter((x) => x.status === "shown").length ?? null;
  const plan = [...d.functions].filter((f) => f.title.trim()).sort((a, c) => `${a.date || d.date}${a.time}`.localeCompare(`${c.date || d.date}${c.time}`));
  const on = TOGGLES.filter((x) => x.scales.includes(d.scale) && d.toggles[x.key]).length;
  const people = [d.stars.names, ...d.family.map((f) => f.names)].filter((x) => x.trim()).length;

  const primary = !live
    ? { label: "Publish", icon: "check" as IconName, run: () => b.open("publish") }
    : changed
      ? { label: b.pub.busy ? "Updating…" : "Update my page", icon: "check" as IconName, run: () => (missing.length || !d.checked ? b.open("publish") : void b.publish()) }
      : { label: "Share", icon: "share" as IconName, run: () => b.openSheet("share") };

  return (
    <>
      <header className="b2-top b2-appbar">
        <span className="b2-brand">In2Min2</span>
        <TopButtons />
      </header>
      <main className="b2-screen" style={{ gap: 18 }}>
        <motion.section className="b2-card b2-hero" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}>
          <div style={{ display: "grid", gap: 10, alignContent: "start", minWidth: 0 }}>
            <span className="b2-status" data-state={!live ? "draft" : changed ? "changed" : "live"}>
              <i aria-hidden="true" />{!live ? "Not published yet" : changed ? "Changes not live" : "Live"}
            </span>
            <h1 className="b2-h2" style={{ overflowWrap: "anywhere" }}>{d.title || t?.label || "Your event"}</h1>
            <p className="b2-small">{[when || "Date to be set", d.venueName].filter(Boolean).join(" · ")}</p>
            {art && t && (
              <span className="b2-small" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span className="b2-dot" style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }} aria-hidden="true"><Icon name={art.icon} className="" /></span>
                {t.label}
              </span>
            )}
          </div>
          <button type="button" className="b2-stage b2-cardbtn" style={{ padding: 0 }} onClick={() => b.open("preview")} aria-label="See it as guests will, full-screen">
            <span className="b2-float" style={{ width: "100%" }}><EventView data={toViewData(d)} view="card" now={now} thumb /></span>
          </button>
        </motion.section>

        {b.pub.note && <p className="b2-note">{b.pub.note}</p>}
        {!live && missing.length > 0 && (
          <button type="button" className="b2-note b2-notebtn" data-tone="warn" onClick={() => b.open(MISSING_PANEL[missing[0].step] ?? "publish")}>
            <span><strong>Still needed to publish:</strong> {missing.map((m) => m.text.toLowerCase()).join(", ")}.</span>
            <Icon name="next" className="size-5" />
          </button>
        )}

        <div className="b2-bento">
          <Tile span icon="pen" colour="#ffb627" label="Invitation words" delay={0.04} panel="words"
            line={b.ai.busy === "all" ? "The AI is writing…" : d.wordsBy === "ai" ? "Written by the AI. Tap to read and change." : d.wordsBy === "host" ? "Your own words. Tap to change." : "Ready-made words. Let the AI write better ones."}>
            {d.wordsBy !== "ai" && d.wordsBy !== "host" && <span className="b2-tagline"><Icon name="sparkle" className="" />AI writer</span>}
          </Tile>
          <Tile icon="envelope" colour="#7c6bff" label="Replies" delay={0.08} panel="replies"
            big={r ? String(r.coming) : undefined} tag={b.replies.fresh ? `+${b.replies.fresh} new` : undefined}
            line={!d.toggles.rsvp ? "Switched off" : r ? `coming · ${r.maybe} maybe` : live ? (b.session ? "Loading…" : "Sign in to see") : "Open once published"} />
          <Tile icon="images" colour="#ff4f8b" label="Photos" delay={0.12} panel="photos"
            big={onWall !== null ? String(onWall) : undefined} tag={b.photos.needsYou ? `${b.photos.needsYou} need you` : undefined}
            line={!d.toggles.photo_wall ? "Switched off" : onWall !== null ? "on the wall" : live ? (b.session ? "Loading…" : "Sign in to see") : "Try the photo wheel now"} />
          <Tile span icon="calendar" colour="#22b8cf" label="When and where" delay={0.16} panel="details"
            line={[when || "Add the date", d.venueName || "Add the place"].join(" · ")} />
          <Tile icon="clock" colour="#45c486" label={d.scale === "community" ? "Programme" : "Day plan"} delay={0.2} panel="plan"
            big={plan.length ? String(plan.length) : undefined}
            line={plan.length ? `first: ${plan[0].title}` : "Add what happens when"} />
          <Tile icon="palette" colour="#a99dff" label="Look" delay={0.24} panel="look">
            <span style={{ display: "flex", gap: 6 }} aria-hidden="true">
              {[p.main, p.accent, p.soft].map((c, i) => <i key={i} className="b2-swatch" style={{ background: c }} />)}
            </span>
          </Tile>
          <Tile icon="people" colour="#f08a5d" label={d.scale === "community" ? "Organiser" : "People"} delay={0.28} panel="people"
            line={d.scale === "community" ? (d.organiserName || "Who's organising") : people ? `${people} ${people === 1 ? "name" : "names"} on the page` : "Names and family"} />
          <Tile icon="switches" colour="#8d8ab5" label="Settings" delay={0.32} panel="settings"
            line={`${on} switched on · ${d.isPrivate ? "private" : "public"}`} />
        </div>
      </main>
      <BottomBar>
        <button type="button" className="b2-btn b2-primary b2-block" onClick={primary.run} disabled={b.pub.busy}>
          <Icon name={primary.icon} className="" />{primary.label}
        </button>
      </BottomBar>
    </>
  );
}

function Tile({ icon, colour, label, big, line, tag, span, panel, delay, children }: {
  icon: IconName; colour: string; label: string; big?: string; line?: string; tag?: string; span?: boolean;
  panel: Panel; delay: number; children?: ReactNode;
}) {
  const b = useB2();
  return (
    <motion.button type="button" className="b2-tile" data-span={span ? "2" : undefined} onClick={() => b.open(panel)}
      initial={{ y: 22, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...spring, delay }} whileTap={{ scale: 0.97 }}>
      {tag && <span className="b2-tag">{tag}</span>}
      <span className="b2-ico" style={{ background: `linear-gradient(135deg, ${colour}, color-mix(in srgb, ${colour} 55%, #000))` }} aria-hidden="true">
        <Icon name={icon} className="" />
      </span>
      <span style={{ display: "grid", gap: 4 }}>
        {big && <span className="b2-big">{big}</span>}
        <strong style={{ fontSize: 19 }}>{label}</strong>
        {line && <span className="b2-small">{line}</span>}
        {children}
      </span>
    </motion.button>
  );
}
