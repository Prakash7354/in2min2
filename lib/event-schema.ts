// The facts Google shows for an event in its search and its events listings
// (schema.org Event), only for pages whose host chose "Show on Google"
// (owner, 23 Nov 2026; Settings). Only what's on the page: name, dates, place,
// organiser, picture and words. Never guests' names or photos.

import type { EventViewData } from "@/lib/event-view";

// "2027-05-15" + "18:30" in Europe/London → "2027-05-15T18:30:00+01:00".
function at(date: string, time: string, tz: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const t = /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  let offset = "+00:00";
  try {
    const name = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "longOffset" })
      .formatToParts(Date.parse(`${date}T${t}:00Z`)).find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = /GMT([+-]\d{2}):?(\d{2})?/.exec(name);
    if (m) offset = `${m[1]}:${m[2] ?? "00"}`;
  } catch { /* unknown zone: UTC */ }
  return `${date}T${t}:00${offset}`;
}

export function eventJsonLd(d: EventViewData, url: string, title: string) {
  const start = at(d.date, d.startTime, d.timezone);
  if (!start) return null;
  const end = d.endTime ? at(d.date, d.endTime, d.timezone) : null;
  const organiser = d.organiser?.name || d.credit?.name || "";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: d.copy.card_headline || title,
    startDate: start,
    ...(end ? { endDate: end } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: d.venueName || "To be confirmed", address: d.venueAddress || d.venueName || "" },
    ...(d.cover && d.cover.startsWith("http") ? { image: [d.cover] } : {}),
    ...(d.copy.card_invite_body ? { description: d.copy.card_invite_body } : {}),
    ...(organiser ? { organizer: { "@type": d.organiser ? "Organization" : "Person", name: organiser } } : {}),
    url,
  };
}
