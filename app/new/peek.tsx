"use client";

// The live little card (owner, 16 Nov 2026: "they continue to build but they
// can not visualise what they are building"). It sits beside the buttons at
// the bottom of every step and panel where the card changes, follows each
// letter typed, gives a small bounce when something on it changes, and
// opens the full preview (sheets.tsx › PreviewBody) when tapped.

import { useEffect, useRef } from "react";
import { useAnimate } from "motion/react";
import EventView from "@/components/event/event-view";
import { Icon } from "@/components/icons";
import { toViewData } from "@/lib/draft";
import { useB2 } from "./context";

export function Peek() {
  const { d, now, openSheet } = useB2();
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  // What's on the card. When it changes (and typing has paused), the card bounces.
  const onCard = [
    d.title, d.stars.names, d.stars.relation, d.milestone, d.date, d.startTime, d.venueName, d.palette, d.customColor, d.border,
    d.textStyle, d.template, d.photoStyle, d.cover?.length ?? 0, d.copy.card_headline, d.copy.card_invite_body, d.languages.join(),
  ].join("|");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = window.setTimeout(() => {
      if (scope.current) void animate(scope.current, { scale: [1, 1.12, 1] }, { duration: 0.5, ease: "easeOut" });
    }, 450);
    return () => window.clearTimeout(t);
  }, [onCard, animate, scope]);
  if (!d.eventType) return null;
  return (
    <button type="button" ref={scope} className="b2-peek" onClick={() => openSheet("preview")} aria-label="Preview: see it as your guests will">
      <span className="b2-peek-card" aria-hidden="true"><EventView data={toViewData(d)} view="card" now={now} thumb /></span>
      <span className="b2-peek-label" aria-hidden="true"><Icon name="eye" className="" />Preview</span>
    </button>
  );
}
