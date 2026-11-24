"use client";

// "Add to calendar" with a calendar icon: one button, then two choices.
// Used on the guest page (always, before the day) and after a "Yes" reply.

import { useState } from "react";
import { Icon } from "@/components/icons";
import { googleCalendarUrl, type CalEvent } from "@/lib/calendar";

export function AddToCalendar({ cal, slug, type, token, colour, textColour, className = "" }: {
  cal: Omit<CalEvent, "url">; type: string; slug: string; token: string | null; colour?: string; textColour?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!cal.date) return null;
  const q = token ? `?g=${token}` : "";
  const url = `https://in2min2.com/${type}/${slug}${q}`;
  const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold";
  return (
    <div className={`grid justify-items-center gap-2 ${className}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${btn} ${colour ? "shadow-sm" : "border-2 border-current"}`}
        style={colour ? { background: colour, color: textColour } : undefined}>
        <Icon name="calendar" className="size-5" /> Add to calendar
      </button>
      {open && (
        <div className="flex flex-wrap justify-center gap-2">
          <a className={`${btn} border-2 border-current`} href={googleCalendarUrl({ ...cal, url })} target="_blank" rel="noreferrer">Google Calendar</a>
          <a className={`${btn} border-2 border-current`} href={`/${type}/${slug}/calendar.ics${q}`}>iPhone, Outlook, other</a>
        </div>
      )}
    </div>
  );
}
