// The public event page's data: public_event() in the database returns only
// what a guest may see; this turns it into the same EventViewData the
// builder's preview uses, so guests see exactly what the host saw.

import { cache } from "react";
import type { EventCopy } from "@/lib/ai/copy";
import { eventType, ORGANISER_TYPES, paletteFor, TOGGLE_DEFAULTS, type Parking, type PhotoStyle, type Scale, type Template, type TextStyle, type ToggleKey } from "@/lib/catalog";
import type { EventStageView, EventViewData } from "@/lib/event-view";
import { rpc } from "@/lib/supabase/rest";
import { utcToZoned } from "@/lib/time";

type Stage = "pre" | "live" | "post" | "expired" | "cancelled" | "draft";

type PublicEvent = {
  stage: Stage;
  private?: boolean;
  title?: string;
  event?: {
    type: string; slug: string; short_code: string; title: string; host_names: string | null;
    timezone: string; starts_at: string; ends_at: string | null;
    venue_name: string | null; venue_address: string | null; parking: Parking; parking_note: string | null;
    organiser_name: string | null; organiser_type: string | null; for_profit: boolean | null; charity_number: string | null; organiser_contact: string | null;
    is_demo: boolean;
    card_headline: string | null; card_invite_body: string | null; landing_page_story: string | null; guest_note_box: string | null;
    post_event_thank_you?: string | null;
    languages: string[];
    translations: Record<string, Partial<EventCopy>>;
    scale: Scale; theme: Template; palette: string; primary_color: string; text_style: TextStyle; border: string;
    photo_style: PhotoStyle; motion: boolean; cover_image_key: string | null; hide_branding: boolean;
  };
  people?: { role: "star" | "honour"; relation: string | null; names: string; names_local: string | null }[];
  features?: Partial<Record<ToggleKey, boolean>>;
  sub_events?: { title: string; starts_at: string; venue_name: string | null }[];
  guest?: { name: string; rsvp_status: string; party_size: number } | null;
};

export type PublicPage =
  | { kind: "missing" }
  | { kind: "private" }
  | { kind: "ended"; title: string }
  | { kind: "event"; view: EventStageView; data: EventViewData; title: string; guestName: string | null };

const copy = (c: Partial<EventCopy> | undefined): EventCopy => ({
  card_headline: c?.card_headline ?? "", card_invite_body: c?.card_invite_body ?? "", landing_page_story: c?.landing_page_story ?? "",
  guest_note_box: c?.guest_note_box ?? "", post_event_thank_you: c?.post_event_thank_you ?? "",
});

// One database call per request, shared by the page and its title.
export const getPublicEvent = cache(async (type: string, slug: string, token?: string): Promise<PublicPage> => {
  const r = await rpc<PublicEvent | null>("public_event", { p_type: type, p_slug: slug, p_token: token ?? null });
  if (!r.ok || !r.data) return { kind: "missing" };
  const p = r.data;
  if (p.private) return { kind: "private" };
  if (!p.event) return p.stage === "expired" || p.stage === "cancelled" ? { kind: "ended", title: p.title ?? "This event" } : { kind: "missing" };

  const e = p.event;
  const t = eventType(e.type);
  const start = utcToZoned(e.starts_at, e.timezone);
  const end = utcToZoned(e.ends_at, e.timezone);
  const people = p.people ?? [];
  const star = people.find((x) => x.role === "star");
  const features = p.features ?? {};
  const toggles = Object.fromEntries((Object.keys(TOGGLE_DEFAULTS) as ToggleKey[]).map((k) => [k, features[k] ?? TOGGLE_DEFAULTS[k]])) as Record<ToggleKey, boolean>;
  const second = e.languages[1];

  const data: EventViewData = {
    typeKey: e.type,
    typeLabel: t?.label ?? "Event",
    scale: e.scale,
    sensitive: t?.sensitive ?? false,
    title: e.title,
    stars: star ? { relation: star.relation ?? "", names: star.names } : null,
    family: people.filter((x) => x.role === "honour").map((x) => ({ relation: x.relation ?? "", names: x.names })),
    organiser: e.organiser_name ? {
      name: e.organiser_name,
      typeLabel: ORGANISER_TYPES.find((o) => o.key === e.organiser_type)?.label ?? "",
      forProfit: e.for_profit, charityNumber: e.charity_number ?? "", contact: e.organiser_contact ?? "",
    } : null,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    timezone: e.timezone,
    venueName: e.venue_name ?? "",
    venueAddress: e.venue_address ?? "",
    parking: e.parking,
    parkingNote: e.parking_note ?? "",
    functions: (p.sub_events ?? []).map((s) => {
      const z = utcToZoned(s.starts_at, e.timezone);
      return { title: s.title, date: z.date, time: z.time, place: s.venue_name ?? "" };
    }),
    languages: e.languages,
    copy: copy({ ...e, post_event_thank_you: e.post_event_thank_you ?? "" } as Partial<EventCopy>),
    translation: second && e.translations?.[second] ? copy(e.translations[second]) : null,
    template: e.theme,
    palette: paletteFor(e.palette, e.primary_color),
    textStyle: e.text_style,
    border: e.border,
    photoStyle: e.photo_style,
    motion: e.motion,
    cover: null, // photos come with photo storage (phase 3)
    toggles,
    hideBranding: e.hide_branding,
    demo: e.is_demo,
  };
  const view: EventStageView = p.stage === "live" ? "live" : p.stage === "post" ? "after" : "page";
  return { kind: "event", view, data, title: e.card_headline || e.title, guestName: p.guest?.name ?? null };
});

export const resolveShortCode = cache(async (code: string): Promise<{ type: string; slug: string } | null> => {
  if (!/^[a-z0-9]{3,12}$/i.test(code)) return null;
  const r = await rpc<{ type: string; slug: string } | null>("resolve_short_code", { p_code: code });
  return r.ok ? r.data : null;
});
