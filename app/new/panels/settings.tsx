"use client";

// Settings: what kind of event it is, how big, and the switches for this
// size of event (replies, countdown, photos…), each with an icon and one line.
// Change them any time, even after publishing.

import { Fragment, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { EVENT_TYPES, SCALES, TOGGLES, eventType, type Scale, type ToggleKey } from "@/lib/catalog";
import { applyScale, applyType } from "@/lib/draft";
import { asksFood } from "@/lib/event-view";
import { useB2 } from "../context";
import { TYPE_ART } from "../kinds";
import { PageOnline } from "./online";
import { PanelShell } from "../panels";
import { Chips, Note, Section, Toggle } from "../ui";

const TOGGLE_ICON: Record<ToggleKey, IconName> = {
  ai_copy: "sparkle", rsvp: "envelope", countdown: "hourglass", schedule: "list", menu: "bowlfood", map_directions: "pin", photo_wall: "images",
  auto_reminders: "bell", gift_registry: "gift", guestbook: "book", tickets: "tag", parking: "pin", stalls: "flag", sponsors: "star",
  team_entries: "people", live_scores: "trophy",
};

export function SettingsPanel() {
  const { d, update } = useB2();
  const [changeKind, setChangeKind] = useState(!d.eventType);
  const t = eventType(d.eventType);
  const art = TYPE_ART[d.eventType ?? ""];
  const list = TOGGLES.filter((x) => x.scales.includes(d.scale));
  return (
    <PanelShell peek icon="switches" title="Settings" line="Change any of these at any time, even after publishing.">
      <Section icon="sparkle" title="Kind of event">
        {t && !changeKind ? (
          <button type="button" className="b2-row" onClick={() => setChangeKind(true)}>
            {art && <span className="b2-ico" style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }} aria-hidden="true"><Icon name={art.icon} className="" /></span>}
            <span className="b2-grow"><strong>{t.label}</strong><small>{t.line}. Tap to change.</small></span>
            <Icon name="pen" className="size-5" />
          </button>
        ) : (
          <>
            <Chips label="Kind of event" small value={d.eventType} options={EVENT_TYPES.map((et) => ({ key: et.key, label: et.label }))}
              onChange={(k) => { if (k) { update((x) => applyType(x, k)); setChangeKind(false); } }} />
            <p className="b2-small">Changing it sets suggested colours and switches for that kind. Names, dates and words stay.</p>
          </>
        )}
        {d.eventId && changeKind && <Note tone="warn">Your page is already published. Changing the kind changes its web address when you update it.</Note>}
      </Section>

      {t && (
        <Section icon="people" title="How big is it?" line="This decides which switches you see.">
          <Chips label="How big is your event?" small value={d.scale} options={(Object.keys(SCALES) as Scale[]).map((s) => ({ key: s, label: SCALES[s].label }))}
            onChange={(s) => s && update((x) => applyScale(x, s))} />
          <p className="b2-small">{SCALES[d.scale].line}</p>
        </Section>
      )}

      <Section icon="switches" title="Switches" line="Only those for your kind of event.">
        {list.map((x) => (
          <Fragment key={x.key}>
            <Toggle icon={TOGGLE_ICON[x.key]} label={x.label} line={x.line} checked={d.toggles[x.key]}
              badge={x.later ? <span className="b2-pill" style={{ marginLeft: 8 }}>From {x.later}</span> : undefined}
              onChange={(v) => update((y) => ({ ...y, toggles: { ...y.toggles, [x.key]: v } }))} />
            {/* Food needs on the reply form (0014), under Replies. */}
            {x.key === "rsvp" && d.toggles.rsvp && (
              <Toggle icon="bowlfood" label="Ask about food needs" line="Guests can tick vegetarian, vegan, halal, gluten-free, nut allergy or dairy-free when they reply"
                checked={asksFood(d.askFood, t?.sensitive ?? false)} onChange={(v) => update((y) => ({ ...y, askFood: v }))} />
            )}
          </Fragment>
        ))}
        <Toggle icon="lock" label="Private event" line="Only guests with their own personal link can open the page." checked={d.isPrivate}
          onChange={(v) => update((y) => ({ ...y, isPrivate: v }))} />
        {/* Show on Google (owner, 23 Nov 2026): off unless chosen; never for a private event. */}
        {!d.isPrivate && (
          <Toggle icon="globe" label="Show on Google" checked={!!d.searchable} onChange={(v) => update((y) => ({ ...y, searchable: v }))}
            line="Lets anyone find this page by searching, with its date and place in Google’s event listings. Good for a mela, a tournament or a community day. Leave it off for family events with children’s names or your home address. Guests’ photos are never shown on Google." />
        )}
      </Section>

      {/* How long it stays online, and closing it early (0015). */}
      <PageOnline />
    </PanelShell>
  );
}
