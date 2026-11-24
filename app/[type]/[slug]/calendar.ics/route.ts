// in2min2.com/{type}/{slug}/calendar.ics: the file "Add to calendar" opens on
// iPhones, Outlook and Samsung. A real address (not a data: link) so Safari
// hands it straight to the Calendar app. Private events only with the guest's
// own link (?g=), the same as the page.

import { getPublicEvent } from "@/lib/public-event";
import { icsFile } from "@/lib/calendar";

export async function GET(req: Request, { params }: RouteContext<"/[type]/[slug]/calendar.ics">) {
  const { type, slug } = await params;
  const g = new URL(req.url).searchParams.get("g");
  const page = await getPublicEvent(type, slug, g && /^[A-Za-z0-9]{16,64}$/.test(g) ? g : undefined);
  if (page.kind !== "event" || !page.data.date) return new Response("Not found", { status: 404 });
  const d = page.data;
  const url = `https://in2min2.com/${type}/${slug}${g && page.viaGuestLink ? `?g=${g}` : ""}`;
  const body = icsFile({ title: page.title, date: d.date, startTime: d.startTime, endTime: d.endTime, timezone: d.timezone,
    venue: [d.venueName, d.venueAddress].filter(Boolean).join(", "), url }, `${type}-${slug}`);
  return new Response(body, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `inline; filename="${slug}.ics"`, "cache-control": "private, no-store", "x-robots-tag": "noindex" } });
}
