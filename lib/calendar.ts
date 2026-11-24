// "Add to calendar" (owner, 24 Nov 2026). One place makes both the Google
// Calendar link and the .ics file (Apple, Outlook, Samsung and others open
// it). Calendars show only text: title, time, place and a link back to the
// invitation. They never show a picture, whatever we put in the file.

import { addDays, zonedToUtcIso } from "@/lib/time";

export type CalEvent = { title: string; date: string; startTime: string; endTime: string; timezone: string; venue: string; url: string };

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// No start time: a whole-day entry. No end time: three hours.
function span(c: CalEvent): { allDay: boolean; start: string; end: string } {
  if (!c.startTime) return { allDay: true, start: c.date.replace(/-/g, ""), end: addDays(c.date, 1).replace(/-/g, "") };
  const start = zonedToUtcIso(c.date, c.startTime, c.timezone);
  const end = c.endTime
    ? zonedToUtcIso(c.endTime > c.startTime ? c.date : addDays(c.date, 1), c.endTime, c.timezone)
    : new Date(Date.parse(start) + 3 * 3600_000).toISOString();
  return { allDay: false, start: stamp(start), end: stamp(end) };
}

const details = (c: CalEvent) => `Your invitation and all the details: ${c.url}`;

export function googleCalendarUrl(c: CalEvent): string {
  const { start, end } = span(c);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(c.title)}&dates=${start}/${end}`
    + `&location=${encodeURIComponent(c.venue)}&details=${encodeURIComponent(details(c))}`;
}

const esc = (t: string) => t.replace(/[\\;,]/g, (ch) => `\\${ch}`).replace(/\r?\n/g, "\\n");
// Lines over 75 bytes must be folded (RFC 5545), or some calendars cut them.
const fold = (line: string) => {
  const out: string[] = []; let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
};

export function icsFile(c: CalEvent, uid: string): string {
  const { allDay, start, end } = span(c);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//in2min2//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${uid}@in2min2.com`, `DTSTAMP:${stamp(new Date().toISOString())}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`, allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${esc(c.title)}`, ...(c.venue ? [`LOCATION:${esc(c.venue)}`] : []), `URL:${c.url}`, `DESCRIPTION:${esc(details(c))}`,
    // A reminder the day before.
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(c.title)}`, "TRIGGER:-P1D", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
