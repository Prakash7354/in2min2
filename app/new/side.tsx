"use client";

// On a laptop or big screen (1100px and wider): the event as guests see it,
// beside the builder, changing as the host types (owner's list, 19 Nov 2026:
// "a wider layout for laptops"). Phones keep the little card by the buttons.

import { useState } from "react";
import EventView from "@/components/event/event-view";
import { Icon } from "@/components/icons";
import { toViewData } from "@/lib/draft";
import type { EventStageView } from "@/lib/event-view";
import { useB2 } from "./context";
import { Chips } from "./ui";

const VIEWS: { key: EventStageView; label: string }[] = [{ key: "page", label: "What guests see" }, { key: "card", label: "Card only" }];

export function SidePreview() {
  const { d, now, open } = useB2();
  const [view, setView] = useState<EventStageView>("page");
  return (
    <aside className="b2-side" aria-label="Live preview">
      <div className="b2-sidehead">
        <p className="b2-kicker">Live preview</p>
        <Chips label="Which part" small value={view} options={VIEWS} onChange={(v) => v && setView(v)} />
      </div>
      <div className="b2-sidephone">
        <EventView data={toViewData(d)} view={view} now={now} />
      </div>
      <button type="button" className="b2-btn b2-quiet" onClick={() => open("preview")}>
        <Icon name="eye" className="" />On the day and after
      </button>
    </aside>
  );
}
