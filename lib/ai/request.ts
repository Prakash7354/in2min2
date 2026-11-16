// The facts the AI writer is given about an event (POST /api/generate-copy),
// built from the host's draft. Shared by the builder and Builder 2.0, so both
// send exactly the same facts.

import type { CopyRequest } from "@/lib/ai/copy";
import { eventType, language, LANGUAGES, PARKING_OPTIONS } from "@/lib/catalog";
import type { Draft } from "@/lib/draft";
import { formatDate, formatTime } from "@/lib/event-view";

export function copyRequest(d: Draft): CopyRequest {
  const t = eventType(d.eventType);
  const main = language(d.languages[0]) ?? LANGUAGES[0];
  const second = language(d.languages[1]);
  const fam = d.family.map((f) => [f.relation, f.names].filter(Boolean).join(": ")).filter(Boolean);
  const parking = PARKING_OPTIONS.find((p) => p.key === d.parking);
  const details = [
    d.stars.names && `${d.stars.relation || "For"}: ${d.stars.names}`,
    d.milestone && (d.eventType === "memorial" ? `What it is: ${d.milestone}` : `Milestone: ${d.milestone}`),
    fam.length && `${t?.sensitive ? "With love from" : "With blessings from"} ${fam.join("; ")}`,
    parking && `Parking: ${parking.label}${d.parkingNote ? ` (${d.parkingNote})` : ""}`,
    d.functions.length && `Running order: ${d.functions.map((f) => [f.time && formatTime(f.time), f.title, f.date && f.date !== d.date && formatDate(f.date, false)].filter(Boolean).join(" ")).join("; ")}`,
    d.scale === "community" && d.organiserName && `Organised by ${d.organiserName}`,
  ].filter(Boolean).join(". ");
  return {
    eventType: `${t?.label ?? "Event"}${t?.sensitive ? " (a funeral or memorial)" : ""}`.slice(0, 60),
    hostNames: [d.title, d.stars.names].filter(Boolean).join(" — ").slice(0, 120) || t?.label || "Our event",
    dateAndVenue: [d.date && formatDate(d.date), d.startTime && formatTime(d.startTime), d.venueName, d.venueAddress.split(/\n|,/)[0]]
      .filter(Boolean).join(", ").slice(0, 200) || "Date and venue to follow",
    languageMix: main.ai,
    tone: d.tone,
    secondLanguage: second?.ai,
    details: details.slice(0, 400) || undefined,
  };
}
