// The public event page's data: public_event() in the database returns only
// what a guest may see; this turns it into the same EventViewData the
// builder's preview uses, so guests see exactly what the host saw.

import { cache } from "react";
import type { EventCopy } from "@/lib/ai/copy";
import { backdropOf, eventType, heroMotionOf, musicOf, ORGANISER_TYPES, paletteFor, photoRingOf, TOGGLE_DEFAULTS, type CoverFit, type EffectKey, type Parking, type PhotoStyle, type Scale, type Template, type TextStyle, type ToggleKey } from "@/lib/catalog";
import { asksFood, creditChoice, creditFor, defaultCredit, type EventStageView, type EventViewData } from "@/lib/event-view";
import { mediaUrl } from "@/lib/media";
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
    photo_style: PhotoStyle; motion: boolean; cover_image_key: string | null; cover_fit?: CoverFit; hide_branding: boolean;
    effect?: EffectKey; share_image_key?: string | null;
    hero_keys?: string[]; hero_motion?: string;
  };
  people?: { role: "star" | "honour"; relation: string | null; names: string; names_local: string | null }[];
  features?: Partial<Record<ToggleKey, boolean>> & { settings?: { photo_wall?: { early?: boolean }; credit?: unknown; topline?: unknown; backdrop?: unknown; music?: unknown; envelope?: unknown; envelope_from?: unknown; envelope_to?: unknown; photo_ring?: unknown; food?: unknown } };
  sub_events?: {
    title: string; kind: string; starts_at: string; venue_name: string | null; description: string | null;
    menu?: { course?: string; dish?: string }[] | null;
  }[];
  guest?: { name: string; rsvp_status: string; party_size: number } | null;
};

export type PublicPage =
  | { kind: "missing" }
  | { kind: "private" }
  | { kind: "ended"; title: string }
  | { kind: "event"; view: EventStageView; data: EventViewData; title: string; guestName: string | null;
      guestReply: { status: string; partySize: number } | null; shareImage: string | null; viaGuestLink: boolean;
      photosEarly: boolean };

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
  const toggles = Object.fromEntries((Object.keys(TOGGLE_DEFAULTS) as ToggleKey[]).map((k) => [k, (features[k] as boolean | undefined) ?? TOGGLE_DEFAULTS[k]])) as Record<ToggleKey, boolean>;
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
      const menu = (s.menu ?? []).filter((m) => m?.dish).map((m) => ({ course: m.course ?? "", dish: m.dish ?? "" }));
      return { title: s.title, date: z.date, time: z.time, place: s.venue_name ?? "", note: s.description ?? "", meal: s.kind === "meal", menu };
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
    effect: e.effect ?? "none",
    cover: mediaUrl(e.cover_image_key),
    moreCovers: e.cover_image_key ? (e.hero_keys ?? []).map((k) => mediaUrl(k)).filter((u): u is string => !!u) : [],
    heroMotion: heroMotionOf(e.hero_motion),
    coverFit: e.cover_fit ?? "fill",
    toggles,
    hideBranding: e.hide_branding,
    demo: e.is_demo,
    credit: creditFor(creditChoice(features.settings?.credit),
      defaultCredit({ scale: e.scale, sensitive: t?.sensitive ?? false, organiserName: e.organiser_name ?? "",
        family: people.filter((x) => x.role === "honour").map((x) => ({ relation: x.relation ?? "", names: x.names })) })),
    topLine: typeof features.settings?.topline === "string" ? features.settings.topline.trim().slice(0, 40) : "",
    backdrop: backdropOf(typeof features.settings?.backdrop === "string" ? features.settings.backdrop : null)?.key ?? null,
    music: musicOf(typeof features.settings?.music === "string" ? features.settings.music : null)?.key ?? null,
    envelope: features.settings?.envelope === true,
    envFrom: typeof features.settings?.envelope_from === "string" ? features.settings.envelope_from.trim().slice(0, 60) : "",
    envTo: typeof features.settings?.envelope_to === "string" ? features.settings.envelope_to.trim().slice(0, 60) : "",
    photoRing: photoRingOf(features.settings?.photo_ring),
    askFood: asksFood(typeof features.settings?.food === "boolean" ? features.settings.food : undefined, t?.sensitive ?? false),
  };
  const view: EventStageView = p.stage === "live" ? "live" : p.stage === "post" ? "after" : "page";
  return {
    kind: "event", view, data, title: e.card_headline || e.title, guestName: p.guest?.name ?? null,
    guestReply: p.guest ? { status: p.guest.rsvp_status, partySize: p.guest.party_size } : null,
    shareImage: mediaUrl(e.share_image_key) ?? mediaUrl(e.cover_image_key), viaGuestLink: !!token && !!p.guest,
    photosEarly: features.settings?.photo_wall?.early === true,
  };
});

export const resolveShortCode = cache(async (code: string): Promise<{ type: string; slug: string } | null> => {
  if (!/^[a-z0-9]{3,12}$/i.test(code)) return null;
  const r = await rpc<{ type: string; slug: string } | null>("resolve_short_code", { p_code: code });
  return r.ok ? r.data : null;
});
