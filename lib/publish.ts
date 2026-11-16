"use client";

// Publish (or update) the host's draft to the database as the signed-in host.
// Row Level Security and the column grants decide what is allowed, exactly as
// the 149 database checks prove; nothing here can set a plan or a price.

import type { SupabaseClient } from "@supabase/supabase-js";
import { COPY_KEYS } from "@/lib/ai/copy";
import { language, paletteFor, TOGGLE_DEFAULTS, type ToggleKey } from "@/lib/catalog";
import { slugify, type Draft } from "@/lib/draft";
import { addDays, zonedToUtcIso } from "@/lib/time";

export type PublishResult =
  | { ok: true; eventId: string; path: string; shortPath: string; offer?: { ok: boolean; message: string } }
  | { ok: false; message: string; step?: number };

const nz = (s: string) => (s.trim() ? s.trim() : null);

export function startsAt(d: Draft): string {
  return zonedToUtcIso(d.date, d.startTime, d.timezone);
}

export function endsAt(d: Draft): string | null {
  if (!d.endTime) return null;
  const sameDay = d.endTime > d.startTime;
  return zonedToUtcIso(sameDay ? d.date : addDays(d.date, 1), d.endTime, d.timezone);
}

function eventRow(d: Draft, slug: string) {
  const community = d.scale === "community";
  const second = d.languages[1];
  const translation = second
    ? Object.fromEntries(COPY_KEYS.filter((k) => d.translation[k].trim()).map((k) => [k, d.translation[k].trim()]))
    : {};
  return {
    event_type: d.eventType,
    scale: d.scale,
    slug,
    title: d.title.trim(),
    timezone: d.timezone,
    starts_at: startsAt(d),
    ends_at: endsAt(d),
    venue_name: nz(d.venueName),
    venue_address: nz(d.venueAddress),
    parking: d.parking,
    parking_note: d.parking === "unknown" ? null : nz(d.parkingNote),
    expected_guests: d.expectedGuests && d.expectedGuests > 0 ? d.expectedGuests : null,
    venue_capacity: d.venueCapacity && d.venueCapacity > 0 ? d.venueCapacity : null,
    organiser_name: community ? nz(d.organiserName) : null,
    organiser_type: community && d.organiserType ? d.organiserType : null,
    for_profit: community ? d.forProfit : null,
    charity_number: community && /^[A-Z0-9]{4,12}$/.test(d.charityNumber) ? d.charityNumber : null,
    organiser_contact: community ? nz(d.organiserContact) : null,
    language_mix: language(d.languages[0])?.ai ?? "British English",
    tone: d.tone.slice(0, 60),
    languages: d.languages,
    ...Object.fromEntries(COPY_KEYS.map((k) => [k, nz(d.copy[k])])),
    copy_translations: second && Object.keys(translation).length ? { [second]: translation } : {},
    theme: d.template,
    palette: d.palette,
    primary_color: d.palette === "custom" ? d.customColor : paletteFor(d.palette).main,
    text_style: d.textStyle,
    border: d.border,
    photo_style: d.photoStyle,
    cover_fit: d.coverFit,
    motion: d.motion,
    effect: d.effect,
    status: "published",
    is_private: d.isPrivate,
  };
}

function explain(e: { code?: string; message?: string }): PublishResult {
  const m = e.message ?? "";
  // A column the live database doesn't have yet: a migration still to run.
  if (e.code === "PGRST204" || e.code === "42703") return { ok: false, message: "In2Min2's database needs its latest update before this can be published. (For Claude Code: a migration hasn't been run.)" };
  if (e.code === "23505") return { ok: false, step: 6, message: "That web address is already taken. Change it under “Web address” and publish again." };
  if (m.includes("community_organiser_named")) return { ok: false, step: 1, message: "A public event needs the organiser's name, what kind of organiser, and whether anyone profits." };
  if (e.code === "23514") return { ok: false, message: "Something is too long or not filled in properly. Check the words and numbers, then try again." };
  if (e.code === "42501" || e.code === "PGRST116") return { ok: false, message: "This event belongs to another account. Sign in with the account that made it." };
  return { ok: false, message: `Couldn't publish: ${m || "please try again."}` };
}

export async function publishDraft(sb: SupabaseClient, d: Draft): Promise<PublishResult> {
  const slug = d.slug || slugify(d.title || d.stars.names);
  const row = eventRow(d, slug);

  // 1. The event itself
  const saved = d.eventId
    ? await sb.from("events").update(row).eq("id", d.eventId).select("id, event_type, slug, short_code").single()
    : await sb.from("events").insert(row).select("id, event_type, slug, short_code").single();
  if (saved.error) return explain(saved.error);
  const ev = saved.data as { id: string; event_type: string; slug: string; short_code: string };

  // 2. The stars and the honoured family
  await sb.from("event_people").delete().eq("event_id", ev.id);
  const people = [
    ...(d.stars.names.trim() ? [{ event_id: ev.id, role: "star", relation: nz(d.stars.relation), names: d.stars.names.trim(), sort_order: 0 }] : []),
    ...d.family.filter((f) => f.names.trim()).map((f, i) => ({ event_id: ev.id, role: "honour", relation: nz(f.relation), names: f.names.trim(), sort_order: i + 1 })),
  ];
  if (people.length) {
    const r = await sb.from("event_people").insert(people);
    if (r.error) return explain(r.error);
  }

  // 3. The running order, each meal with its menu
  await sb.from("sub_events").delete().eq("event_id", ev.id);
  const fns = d.functions.filter((f) => f.title.trim() && (f.date || d.date)).map((f, i) => {
    const menu = f.meal
      ? (f.menu ?? []).filter((m) => m.dish.trim()).slice(0, 20).map((m) => ({ course: m.course.trim().slice(0, 40), dish: m.dish.trim().slice(0, 160) }))
      : [];
    return {
      event_id: ev.id, title: f.title.trim().slice(0, 80), kind: f.meal ? "meal" : "other",
      starts_at: zonedToUtcIso(f.date || d.date, f.time || d.startTime, d.timezone),
      venue_name: nz(f.place), description: nz((f.note ?? "").slice(0, 500)), sort_order: i,
      details: menu.length ? { menu } : {},
    };
  });
  if (fns.length) {
    const r = await sb.from("sub_events").insert(fns);
    if (r.error) return explain(r.error);
  }

  // 4. Switches (ai_copy stays on; only the builder's switches are sent)
  const toggles = Object.fromEntries((Object.keys(TOGGLE_DEFAULTS) as ToggleKey[]).map((k) => [k, d.toggles[k]]));
  // …and the credit line at the bottom of the page, kept beside the photo
  // wall's settings ({ label, name }, { hidden: true }, or left out).
  const cur = await sb.from("feature_toggles").select("settings").eq("event_id", ev.id).maybeSingle();
  const settings: Record<string, unknown> = { ...((cur.data?.settings as Record<string, unknown> | null) ?? {}) };
  if (d.credit === undefined) delete settings.credit;
  else settings.credit = d.credit === null ? { hidden: true } : { label: d.credit.label.trim().slice(0, 30), name: d.credit.name.trim().slice(0, 80) };
  const t = await sb.from("feature_toggles").update({ ...toggles, settings }).eq("event_id", ev.id);
  if (t.error) return explain(t.error);

  // 5. A launch-offer code, once
  let offer: { ok: boolean; message: string } | undefined;
  if (d.offerCode && !d.offerClaimed && d.scale !== "community") {
    const c = await sb.rpc("claim_offer", { p_event: ev.id, p_code: d.offerCode });
    const res = c.data as { ok: boolean; reason?: string; plan?: string; places_left?: number } | null;
    const message = res?.ok ? `Your code worked: this event is on the ${res.plan === "keepsake" ? "Keepsake" : res.plan} plan.`
      : ({ no_offer: "That code isn't valid or has ended.", already_claimed: "You've already used that code on another event.",
          all_taken: "Sorry, all the places for that code have gone.", not_for_this_event: "That code isn't for this kind of event.",
          already_upgraded: "This event is already on a bigger plan." } as Record<string, string>)[res?.reason ?? ""] ?? "The code couldn't be checked; the page is published without it.";
    offer = { ok: !!res?.ok, message };
  }

  return { ok: true, eventId: ev.id, path: `/${ev.event_type}/${ev.slug}`, shortPath: `/e/${ev.short_code}`, offer };
}
