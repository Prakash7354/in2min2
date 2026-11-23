"use client";

// See it as guests will: the real event page (the same code the public page
// uses), at each stage: the invitation, the page, on the day, and after.

import { useState } from "react";
import EventView from "@/components/event/event-view";
import { toViewData } from "@/lib/draft";
import type { EventStageView } from "@/lib/event-view";
import { useB2 } from "../context";
import { PanelShell } from "../panels";
import { Chips } from "../ui";

const VIEWS: { key: EventStageView; label: string }[] = [
  { key: "page", label: "What guests see" }, { key: "card", label: "Card only" }, { key: "live", label: "On the day" }, { key: "after", label: "After" },
];

// Which stage to open on next time (Share › "Preview the thank-you page" opens "after").
let startAt: EventStageView = "page";   // the whole page first (owner, 23 Nov 2026)
export function previewAt(v: EventStageView) { startAt = v; }

export function PreviewPanel() {
  const { d, now } = useB2();
  const [view, setView] = useState<EventStageView>(() => { const v = startAt; startAt = "page"; return v; });
  return (
    <PanelShell icon="eye" title="As guests see it" line="Exactly what guests get, at each stage.">
      <div className="b2-tabs">
        <Chips label="Which stage" small value={view} options={VIEWS} onChange={(v) => v && setView(v)} />
      </div>
      <div className="b2-previewframe">
        <EventView data={toViewData(d)} view={view} now={now} />
      </div>
    </PanelShell>
  );
}
