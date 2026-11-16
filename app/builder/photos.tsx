"use client";

// Guests' photos, for the host (0006): what's waiting for an OK, what's on
// the wall, what's hidden, and anything a guest asked to be removed. Plus the
// two settings, and the links for the TV slideshow, the table cards and the
// photos page. Row Level Security decides who sees and changes them: the
// event's own hosts; only the owner and co-hosts can remove one for good.
// Hosts add their own photos here too (0007): straight on the wall, any time.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { SKIES, eventType, paletteFor, skyFor, type Sky } from "@/lib/catalog";
import type { Draft } from "@/lib/draft";
import { preparePhoto } from "@/lib/photo-prep";
import { PHOTO_MESSAGES, photoUrl, wallPath } from "@/lib/photos";
import { copyLink, whatsappUrl } from "@/lib/share";
import { supabase } from "@/lib/supabase/client";

export type HostPhoto = {
  id: string; status: "waiting" | "shown" | "hidden"; width: number; height: number; added_by: string | null;
  removal_asked_at: string | null; removal_note: string | null; kept_at: string | null; reviewed_at: string | null;
  ready_at: string | null; created_at: string;
  favourite?: boolean; love_count?: number;   // 0008
  photographer_id?: string | null;             // 0009
};
export type Photographer = { id: string; name: string; business: string | null; link: string | null; upload_key: string; active: boolean };
type Wall = {
  wallKey: string; isPrivate: boolean; photoLimit: number | null; perGuest: number | null;
  settings: Record<string, unknown>; approveFirst: boolean; early: boolean;
  sky: string;   // "auto" or a sky key (0009)
};

export type PhotosState = {
  rows: HostPhoto[] | null;
  wall: Wall | null;
  error: string | null;
  notReady: boolean;
  needsYou: number;               // waiting for an OK, or asked to be removed
  refresh: () => void;
  setStatus: (ids: string[], status: HostPhoto["status"]) => Promise<boolean>;
  removeForGood: (ids: string[]) => Promise<boolean>;
  saveRules: (patch: { approve_first?: boolean; early?: boolean; sky?: string }) => Promise<boolean>;
  addOwn: (files: File[], name: string, progress: (done: number) => void) => Promise<{ added: number; problem: string | null }>;
  setFavourite: (id: string, on: boolean) => Promise<boolean>;
  // The event's photographers (0009); null until 0009 has run.
  photographers: Photographer[] | null;
  addPhotographer: (g: { name: string; business: string; link: string }) => Promise<string | null>;
  changePhotographer: (id: string, patch: { active?: boolean }) => Promise<boolean>;
  removePhotographer: (id: string) => Promise<boolean>;
};

export const asked = (p: HostPhoto) => !!p.removal_asked_at && p.status === "hidden" && !p.kept_at && (!p.reviewed_at || p.reviewed_at <= p.removal_asked_at);

export function usePhotos(eventId: string | undefined, session: Session | null, scale: string, sensitive: boolean): PhotosState {
  const [rows, setRows] = useState<HostPhoto[] | null>(null);
  const [wall, setWall] = useState<Wall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [photographers, setPhotographers] = useState<Photographer[] | null>(null);
  const live = !!eventId && !!session;

  const load = useCallback(async () => {
    if (!eventId || !session) return;
    const sb = supabase();
    const cols = "id, status, width, height, added_by, removal_asked_at, removal_note, kept_at, reviewed_at, ready_at, created_at";
    const photosQuery = (extra: string) => sb.from("event_photos").select(cols + extra)
      .eq("event_id", eventId).neq("status", "uploading").order("ready_at", { ascending: false }).limit(1000);
    const [first, e, f, g] = await Promise.all([
      photosQuery(", favourite, love_count, photographer_id"),
      sb.from("events").select("wall_key, is_private, plans(photo_limit, photos_per_guest)").eq("id", eventId).maybeSingle(),
      sb.from("feature_toggles").select("settings").eq("event_id", eventId).maybeSingle(),
      sb.from("event_photographers").select("id, name, business, link, upload_key, active").eq("event_id", eventId).order("created_at"),
    ]);
    // Before 0008 and 0009 have run, some columns aren't there yet.
    let p = first;
    if (p.error?.code === "42703") p = await photosQuery(", favourite, love_count");
    if (p.error?.code === "42703") p = await photosQuery("");
    setPhotographers(g.error ? null : (g.data as Photographer[]));
    if (p.error) {
      const missing = p.error.code === "42P01" || p.error.code === "PGRST205" || /event_photos/.test(p.error.message);
      setNotReady(missing);
      setError(missing ? null : `Couldn't load photos. (Details for Claude Code: ${p.error.code ?? ""} ${p.error.message})`);
      return;
    }
    setNotReady(false);
    setError(null);
    setRows(p.data as unknown as HostPhoto[]);
    const ev = e.data as { wall_key: string; is_private: boolean; plans: { photo_limit: number | null; photos_per_guest: number | null } | null } | null;
    const settings = ((f.data as { settings?: Record<string, unknown> } | null)?.settings ?? {}) as Record<string, unknown>;
    const pw = (settings.photo_wall ?? {}) as { approve_first?: unknown; early?: unknown; sky?: unknown };
    if (ev) {
      setWall({
        wallKey: ev.wall_key, isPrivate: ev.is_private, photoLimit: ev.plans?.photo_limit ?? null, perGuest: ev.plans?.photos_per_guest ?? null,
        settings,
        // Same default as photo_rules() in 0006: checked first for community events and memorials.
        approveFirst: typeof pw.approve_first === "boolean" ? pw.approve_first : scale === "community" || sensitive,
        early: pw.early === true,
        sky: typeof pw.sky === "string" ? pw.sky : "auto",
      });
    }
  }, [eventId, session, scale, sensitive]);

  useEffect(() => {
    if (!live) return;
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 60_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [live, eventId, load]);

  const setStatus = useCallback(async (ids: string[], status: HostPhoto["status"]) => {
    if (!ids.length) return true;
    const r = await supabase().from("event_photos").update({ status }).in("id", ids);
    await load();
    return !r.error;
  }, [load]);

  const removeForGood = useCallback(async (ids: string[]) => {
    if (!ids.length || !session) return false;
    const res = await fetch("/api/photos/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ids }),
    }).catch(() => null);
    const body = (await res?.json().catch(() => null)) as { ok?: boolean; removed?: number } | null;
    await load();
    return !!body?.ok && (body.removed ?? 0) > 0;
  }, [session, load]);

  const saveRules = useCallback(async (patch: { approve_first?: boolean; early?: boolean; sky?: string }) => {
    if (!eventId || !wall) return false;
    const pw = { ...((wall.settings.photo_wall as Record<string, unknown> | undefined) ?? {}), ...patch };
    const r = await supabase().from("feature_toggles").update({ settings: { ...wall.settings, photo_wall: pw } }).eq("event_id", eventId);
    await load();
    return !r.error;
  }, [eventId, wall, load]);

  // The host's own photos: made ready on this phone like a guest's, then sent
  // one at a time with the host's sign-in (add_host_photo(), 0007).
  const addOwn = useCallback(async (files: File[], name: string, progress: (done: number) => void) => {
    if (!eventId || !session) return { added: 0, problem: PHOTO_MESSAGES.sign_in };
    let added = 0, problem: string | null = null;
    for (const f of files) {
      let reason: string | null = null;
      try {
        const p = await preparePhoto(f);
        const q = new URLSearchParams({ host: "1", event: eventId, w: String(p.w), h: String(p.h), tl: String(p.thumb.size) });
        if (name.trim()) q.set("name", name.trim().slice(0, 60));
        const res = await fetch(`/api/photos?${q}`, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream", Authorization: `Bearer ${session.access_token}` },
          body: new Blob([p.thumb, p.photo], { type: "application/octet-stream" }),
        });
        const body = (await res.json().catch(() => null)) as { ok?: boolean; reason?: string } | null;
        if (body?.ok) added++; else reason = body?.reason ?? "server";
      } catch (e) {
        reason = e instanceof TypeError ? "network" : "unreadable";
      }
      if (reason) {
        problem = reason === "unreadable" ? "A photo couldn't be opened on this phone. Try a JPEG or a screenshot."
          : reason === "network" ? "No signal just now. Try again when you're connected."
          : PHOTO_MESSAGES[reason] ?? "A photo couldn't be added.";
        if (reason === "full" || reason === "off" || reason === "closed" || reason === "sign_in" || reason === "storage_off" || reason === "not_ready") break;
      }
      progress(added);
    }
    await load();
    return { added, problem };
  }, [eventId, session, load]);

  const setFavourite = useCallback(async (id: string, on: boolean) => {
    const r = await supabase().from("event_photos").update({ favourite: on }).eq("id", id);
    await load();
    return !r.error;
  }, [load]);

  // Photographers: added by the owner or a co-host; each gets a private upload link.
  const addPhotographer = useCallback(async (g: { name: string; business: string; link: string }) => {
    if (!eventId) return null;
    const r = await supabase().from("event_photographers")
      .insert({ event_id: eventId, name: g.name.trim().slice(0, 60), business: g.business.trim().slice(0, 80) || null, link: g.link.trim().slice(0, 200) || null })
      .select("upload_key").single();
    await load();
    return r.error ? null : (r.data as { upload_key: string }).upload_key;
  }, [eventId, load]);
  const changePhotographer = useCallback(async (id: string, patch: { active?: boolean }) => {
    const r = await supabase().from("event_photographers").update(patch).eq("id", id);
    await load();
    return !r.error;
  }, [load]);
  const removePhotographer = useCallback(async (id: string) => {
    const r = await supabase().from("event_photographers").delete().eq("id", id);
    await load();
    return !r.error;
  }, [load]);

  const list = rows ?? [];
  const needsYou = list.filter((p) => p.status === "waiting" || asked(p)).length;
  return {
    rows: live ? rows : null, wall: live ? wall : null, error, notReady, needsYou: live ? needsYou : 0,
    refresh: () => void load(), setStatus, removeForGood, saveRules, addOwn, setFavourite,
    photographers: live ? photographers : null, addPhotographer, changePhotographer, removePhotographer,
  };
}

// ─────────────────────────── the window ───────────────────────────

export function PhotosDialog({ d, eventId, state, onClose, say }: { d: Draft; eventId: string; state: PhotosState; onClose: () => void; say: (m: string) => void }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const [picked, setPicked] = useState<HostPhoto | null>(null);
  const [own, setOwn] = useState<{ total: number; done: number } | null>(null);
  const ownInput = useRef<HTMLInputElement>(null);
  const { refresh } = state;
  useEffect(() => {
    refresh();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    window.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.documentElement.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the window opens
  }, []);

  const rows = state.rows ?? [];
  const w = state.wall;
  const waiting = rows.filter((p) => p.status === "waiting");
  const askedRows = rows.filter(asked);
  const shown = rows.filter((p) => p.status === "shown");
  const hidden = rows.filter((p) => p.status === "hidden" && !asked(p));
  const path = d.publishedPath ?? "";
  const [, type, slug] = path.split("/");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const key = w?.isPrivate ? w.wallKey : null;
  const photosLink = type && slug ? `${origin}${wallPath(type, slug, key)}` : null;
  const tvLink = type && slug ? `${origin}${wallPath(type, slug, key, "tv")}` : null;
  const tvWheelLink = type && slug ? `${origin}${wallPath(type, slug, key, "tv", "wheel")}` : null;
  const printLink = type && slug ? `${origin}${wallPath(type, slug, key, "print")}` : null;
  const title = d.title.trim() || "Our event";
  const wallOff = !d.toggles.photo_wall;
  const autoSky = skyFor(paletteFor(d.palette, d.customColor));

  async function act(ids: string[], status: HostPhoto["status"], done: string) {
    setPicked(null);
    say((await state.setStatus(ids, status)) ? done : "That didn't work. Please try again.");
  }
  // Shown with the host's photos instead of a guest's name.
  const ownName = d.scale === "community" ? (d.organiserName.trim() || "The organisers")
    : eventType(d.eventType)?.sensitive ? "The family" : "The hosts";
  async function addOwn(files: FileList | null) {
    const list = Array.from(files ?? []).slice(0, 50);
    if (!list.length) return;
    setOwn({ total: list.length, done: 0 });
    const r = await state.addOwn(list, ownName, (done) => setOwn({ total: list.length, done }));
    setOwn(null);
    if (ownInput.current) ownInput.current.value = "";
    say([r.added ? `${r.added === 1 ? "Your photo is" : `${r.added} photos are`} on the wall.` : null, r.problem].filter(Boolean).join(" ") || "Nothing was added.");
  }

  async function removeIt(ids: string[]) {
    setPicked(null);
    say((await state.removeForGood(ids)) ? (ids.length === 1 ? "Photo removed for good." : `${ids.length} photos removed for good.`)
      : "Couldn't remove it. Only the owner and co-hosts can.");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="photos-title" onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-card shadow-[0_-10px_40px_-10px_rgba(28,26,58,0.6)] sm:rounded-3xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="relative grid gap-1 bg-brand px-5 pb-5 pt-6 text-white">
          <h2 id="photos-title" className="font-display text-2xl font-extrabold leading-tight">Guests&apos; photos</h2>
          <p className="text-[15px] text-white/85">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close"
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-5">
          {state.notReady && (
            <p className="rounded-2xl bg-amber-wash px-4 py-3 text-[15px]">Photos switch on once the database file 0006 has been run (see your action plan).</p>
          )}
          {state.error && <p className="rounded-2xl bg-amber-wash px-4 py-3 text-[15px]">{state.error}</p>}
          {wallOff && (
            <p className="rounded-2xl bg-amber-wash px-4 py-3 text-[15px]">The photo wall is switched off. Turn on <strong>Photo wall</strong> in step 6 (Switches), then press <strong>Update my page</strong>.</p>
          )}

          <div className="grid gap-2 rounded-2xl border border-line p-4">
            <p className="font-semibold">Your own photos</p>
            <p className="text-[15px] leading-snug text-muted">
              Add photos from this phone, before the day or on it. They go straight on the wall, shown as from &ldquo;{ownName}&rdquo;,
              and don&apos;t use up any guest&apos;s share.
            </p>
            <input ref={ownInput} type="file" accept="image/*" multiple hidden onChange={(e) => void addOwn(e.target.files)} />
            <button type="button" disabled={!!own || wallOff || state.notReady} onClick={() => ownInput.current?.click()}
              className="inline-flex min-h-11 items-center justify-self-start rounded-full bg-brand px-5 font-bold text-white hover:bg-brand-deep disabled:opacity-60">
              {own ? `Adding ${Math.min(own.done + 1, own.total)} of ${own.total}…` : "Add your photos"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {([["On the wall", shown.length], ["Waiting", waiting.length], ["Hidden", hidden.length + askedRows.length]] as const).map(([k, n]) => (
              <div key={k} className="grid rounded-2xl bg-wash p-3">
                <span className="text-sm font-semibold text-muted">{k}</span>
                <span className="font-display text-3xl font-extrabold tabular-nums text-brand">{n}</span>
              </div>
            ))}
          </div>
          {w && (
            <p className="-mt-2 text-[15px] text-muted">
              {w.photoLimit !== null ? `${rows.length} of ${w.photoLimit} photos on your plan` : `${rows.length} photos`}
              {w.perGuest !== null ? `, up to ${w.perGuest} from each phone.` : "."}
            </p>
          )}

          {w && (
            <div className="grid gap-2">
              <Toggle checked={w.approveFirst} label="Check each photo before it shows"
                line="New photos wait here for your OK. Recommended for community events and memorials."
                onChange={async (v) => say((await state.saveRules({ approve_first: v })) ? (v ? "New photos will wait for your OK." : "New photos will show straight away.") : "Couldn't save. Please try again.")} />
              <Toggle checked={w.early} label="Let guests add photos before the day"
                line="Useful for photos through the years, or to try it out. Otherwise photos open at midnight on the day."
                onChange={async (v) => say((await state.saveRules({ early: v })) ? (v ? "Guests can add photos now." : "Photos will open on the day.") : "Couldn't save. Please try again.")} />
            </div>
          )}

          {photosLink && (
            <div className="grid gap-2 rounded-2xl border border-line p-4">
              <p className="font-semibold">On the day</p>
              <div className="flex flex-wrap gap-2">
                <a href={tvLink ?? "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-sm font-bold text-white">Open the TV slideshow</a>
                <a href={tvWheelLink ?? "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-sm font-bold text-white">Open the TV wheel</a>
                <a href={printLink ?? "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-wash px-4 text-sm font-bold hover:bg-line">Print table cards with a QR code</a>
                <a href={whatsappUrl(photosLink, `Add your photos from ${title} here. No app needed:`)} target="_blank" rel="noreferrer"
                  className="inline-flex min-h-10 items-center rounded-full bg-[#25D366] px-4 text-sm font-bold text-[#073B1C]">Send the photo link on WhatsApp</a>
                <button type="button" className="inline-flex min-h-10 items-center rounded-full bg-wash px-4 text-sm font-bold hover:bg-line"
                  onClick={async () => say((await copyLink(photosLink)) === "copied" ? "Photo link copied." : "Couldn't copy here.")}>Copy the photo link</button>
              </div>
              <p className="text-sm text-muted">The slideshow runs on a laptop plugged into the venue&apos;s TV, or a smart TV&apos;s web browser. Press <strong>Full screen</strong>.{w?.isPrivate ? " These links carry your event's photo key, so they work for everyone at the venue: share them only there." : ""}</p>
            </div>
          )}

          {w && (
            <div className="grid gap-2 rounded-2xl border border-line p-4">
              <p className="font-semibold">Sky behind the photo wheel</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Sky behind the photo wheel">
                {SKIES.map((k) => {
                  const on = (w.sky || "auto") === k.key;
                  const shown = k.key === "auto" ? autoSky : k.key;
                  return (
                    <button key={k.key} type="button" role="radio" aria-checked={on}
                      onClick={async () => say((await state.saveRules({ sky: k.key })) ? `Sky: ${k.name}.` : "Couldn't save. Please try again.")}
                      className={`grid gap-1 rounded-xl border-2 p-1.5 text-left ${on ? "border-brand" : "border-line"}`}>
                      <span className="block h-12 rounded-lg" style={{ background: SKY_SWATCH[shown] }} aria-hidden="true" />
                      <span className="px-1 text-sm font-bold leading-tight">{k.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted">{SKIES.find((k) => k.key === (w.sky || "auto"))?.line}{(w.sky || "auto") === "auto" ? ` (now: ${SKIES.find((k) => k.key === autoSky)?.name})` : ""}</p>
            </div>
          )}

          {state.photographers && (
            <Photographers list={state.photographers} rows={rows} state={state} say={say} title={title} origin={origin} />
          )}

          {askedRows.length > 0 && (
            <Group title="Asked to be removed" line="A guest asked for these to come down, so they're hidden. Keep them hidden, remove them for good, or show them again.">
              {askedRows.map((p) => (
                <Row key={p.id} p={p} eventId={eventId} note={p.removal_note ? `“${p.removal_note}”` : "No reason given."}>
                  <Small onClick={() => void removeIt([p.id])}>Remove for good</Small>
                  <Small quiet onClick={() => void act([p.id], "shown", "Shown again. A later request won't hide it.")}>Show again</Small>
                </Row>
              ))}
            </Group>
          )}

          {waiting.length > 0 && (
            <Group title="Waiting for your OK" line="Only you and your co-hosts can see these until you show them."
              action={waiting.length > 1 ? <Small onClick={() => void act(waiting.map((p) => p.id), "shown", `${waiting.length} photos are on the wall.`)}>Show all {waiting.length}</Small> : undefined}>
              {waiting.map((p) => (
                <Row key={p.id} p={p} eventId={eventId}>
                  <Small onClick={() => void act([p.id], "shown", "On the wall.")}>Show</Small>
                  <Small quiet onClick={() => void act([p.id], "hidden", "Hidden.")}>Hide</Small>
                </Row>
              ))}
            </Group>
          )}

          <Group title="On the wall" line={shown.length ? "Tap a photo to make it a favourite (it comes round the wheel more often), hide it or remove it. ♥ shows guests' loves." : "No photos yet. Share the photo link or put the table cards out."}>
            <Grid photos={shown} eventId={eventId} onPick={setPicked} />
          </Group>

          {hidden.length > 0 && (
            <Group title="Hidden" line="Guests can't see these. Tap one to show it again or remove it for good.">
              <Grid photos={hidden} eventId={eventId} onPick={setPicked} />
            </Group>
          )}
        </div>
      </div>

      {picked && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black text-white" onClick={(e) => { e.stopPropagation(); setPicked(null); }}>
          <div className="flex min-h-0 flex-1 items-center justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 photo */}
            <img src={photoUrl(eventId, picked.id, "p")} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="grid gap-2 p-4" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
            <p className="text-white/80">{picked.added_by ? `Added by ${picked.added_by}` : "Added by a guest"}{picked.love_count ? ` · ♥ ${picked.love_count} ${picked.love_count === 1 ? "love" : "loves"}` : ""}</p>
            <div className="flex flex-wrap gap-2">
              {picked.status === "shown" && picked.favourite !== undefined && (
                <button type="button" className={`min-h-11 rounded-full px-4 font-bold ${picked.favourite ? "bg-marigold text-ink" : "bg-white text-black"}`}
                  onClick={async () => {
                    const on = !picked.favourite;
                    setPicked(null);
                    say((await state.setFavourite(picked.id, on)) ? (on ? "A favourite: it comes round the wheel more often." : "No longer a favourite.") : "That didn't work. Please try again.");
                  }}>{picked.favourite ? "★ Favourite (tap to undo)" : "☆ Make it a favourite"}</button>
              )}
              {picked.status !== "shown" && <button type="button" className="min-h-11 rounded-full bg-white px-4 font-bold text-black" onClick={() => void act([picked.id], "shown", "On the wall.")}>Show it</button>}
              {picked.status !== "hidden" && <button type="button" className="min-h-11 rounded-full bg-white px-4 font-bold text-black" onClick={() => void act([picked.id], "hidden", "Hidden.")}>Hide it</button>}
              <button type="button" className="min-h-11 rounded-full px-4 font-bold ring-1 ring-white/50" onClick={() => void removeIt([picked.id])}>Remove for good</button>
              <button type="button" className="min-h-11 rounded-full px-4 font-bold text-white/80" onClick={() => setPicked(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Group({ title, line, action, children }: { title: string; line?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid gap-0.5">
          <h3 className="font-display text-lg font-extrabold">{title}</h3>
          {line && <p className="text-[15px] text-muted">{line}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ p, eventId, note, children }: { p: HostPhoto; eventId: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line p-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- R2 thumbnail */}
      <img src={photoUrl(eventId, p.id, "t")} alt="" className="size-20 shrink-0 rounded-xl bg-wash object-cover" loading="lazy" />
      <div className="grid min-w-0 flex-1 gap-1.5">
        <p className="truncate text-[15px]">{p.added_by ? <><strong>{p.added_by}</strong></> : "A guest"}{note ? <span className="block whitespace-normal text-muted">{note}</span> : null}</p>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </div>
  );
}

function Grid({ photos, eventId, onPick }: { photos: HostPhoto[]; eventId: string; onPick: (p: HostPhoto) => void }) {
  if (!photos.length) return null;
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {photos.map((p) => (
        <button key={p.id} type="button" onClick={() => onPick(p)} className="relative aspect-square overflow-hidden rounded-lg bg-wash" aria-label={`Photo${p.added_by ? ` by ${p.added_by}` : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 thumbnail */}
          <img src={photoUrl(eventId, p.id, "t")} alt="" className="size-full object-cover" loading="lazy" />
          {(p.favourite || !!p.love_count) && (
            <span className="absolute bottom-1 left-1 rounded-full bg-ink/75 px-1.5 text-xs font-extrabold text-white">
              {p.favourite ? "★ " : ""}{p.love_count ? `♥ ${p.love_count}` : ""}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function Small({ children, onClick, quiet = false }: { children: ReactNode; onClick: () => void; quiet?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold ${quiet ? "bg-wash hover:bg-line" : "bg-brand text-white hover:bg-brand-deep"}`}>
      {children}
    </button>
  );
}

function Toggle({ checked, label, line, onChange }: { checked: boolean; label: string; line: string; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-3">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`mt-0.5 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition peer-focus-visible:ring-4 peer-focus-visible:ring-marigold/50 ${checked ? "bg-brand" : "bg-line"}`} aria-hidden="true">
        <span className={`size-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : ""}`} />
      </span>
      <span className="grid gap-0.5">
        <span className="font-semibold">{label}</span>
        <span className="text-[15px] leading-snug text-muted">{line}</span>
      </span>
    </label>
  );
}

// Small previews of each sky for the chooser.
export const SKY_SWATCH: Record<Sky, string> = {
  day: "linear-gradient(180deg, #5aa8ec, #cfe9fc)",
  evening: "linear-gradient(180deg, #57286e, #df6956 60%, #ffd38c)",
  night: "radial-gradient(circle at 30% 30%, #fff 0 1px, transparent 2px), radial-gradient(circle at 70% 60%, #fff 0 1px, transparent 2px), linear-gradient(180deg, #06061a, #120d2c)",
  galaxy: "linear-gradient(158deg, #04030f 25%, #6e50dc 40%, #ff96d7 48%, #6eaaff 56%, #04030f 72%)",
  aurora: "radial-gradient(ellipse 70% 30% at 40% 30%, rgba(70,255,170,.8), transparent 70%), radial-gradient(ellipse 50% 25% at 70% 40%, rgba(180,100,255,.6), transparent 70%), linear-gradient(180deg, #020b15, #0a2a31)",
};

// The event's photographers (0009): add one, send them their private link,
// switch it off, or remove them. Up to three.
function Photographers({ list, rows, state, say, title, origin }: {
  list: Photographer[]; rows: HostPhoto[]; state: PhotosState; say: (m: string) => void; title: string; origin: string;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", link: "" });
  const [busy, setBusy] = useState(false);
  const field = "w-full rounded-xl border-2 border-line bg-card px-3 py-2.5 text-[16px] focus:border-brand focus:outline-none";
  async function add() {
    if (!form.name.trim()) { say("Please type the photographer's name."); return; }
    setBusy(true);
    const key = await state.addPhotographer(form);
    setBusy(false);
    if (!key) { say("Couldn't add them. Only the owner and co-hosts can, up to three."); return; }
    setForm({ name: "", business: "", link: "" });
    setAdding(false);
    say("Added. Now send them their link.");
  }
  return (
    <div className="grid gap-3 rounded-2xl border border-line p-4">
      <div className="grid gap-0.5">
        <p className="font-semibold">Your photographer</p>
        <p className="text-sm text-muted">
          Send them a private link: they add their photos with no account, and each one shows their name. Guests see a
          &ldquo;Book them&rdquo; card with their link. Their photos use your event&apos;s photo space.
        </p>
      </div>
      {list.map((g) => {
        const link = `${origin}/photographer/${g.upload_key}`;
        const count = rows.filter((p) => p.photographer_id === g.id && p.status !== "hidden").length;
        return (
          <div key={g.id} className="grid gap-2 rounded-xl bg-wash p-3">
            <p className="font-semibold">{g.business || g.name}{g.business ? <span className="font-normal text-muted"> · {g.name}</span> : null}</p>
            <p className="text-sm text-muted">{count} {count === 1 ? "photo" : "photos"} on the wall{g.active ? "" : " · link switched off"}</p>
            <div className="flex flex-wrap gap-2">
              {g.active && (
                <>
                  <a href={whatsappUrl(link, `Here's your link to add your photos of ${title}. No account needed:`)} target="_blank" rel="noreferrer"
                    className="inline-flex min-h-10 items-center rounded-full bg-[#25D366] px-4 text-sm font-bold text-[#073B1C]">Send their link on WhatsApp</a>
                  <button type="button" className="inline-flex min-h-10 items-center rounded-full bg-card px-4 text-sm font-bold ring-1 ring-line"
                    onClick={async () => say((await copyLink(link)) === "copied" ? "Photographer link copied." : "Couldn't copy here.")}>Copy their link</button>
                </>
              )}
              <button type="button" className="inline-flex min-h-10 items-center rounded-full bg-card px-4 text-sm font-bold ring-1 ring-line"
                onClick={async () => say((await state.changePhotographer(g.id, { active: !g.active })) ? (g.active ? "Link switched off." : "Link switched on.") : "That didn't work.")}>
                {g.active ? "Switch link off" : "Switch link on"}
              </button>
              <button type="button" className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold underline"
                onClick={async () => say((await state.removePhotographer(g.id)) ? "Removed. Their photos stay, without their name." : "That didn't work.")}>Remove</button>
            </div>
          </div>
        );
      })}
      {adding ? (
        <div className="grid gap-2">
          <input className={field} placeholder="Their name, e.g. Ram Thapa" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={field} placeholder="Business name (if any), e.g. Ram Studio" value={form.business} maxLength={80} onChange={(e) => setForm({ ...form, business: e.target.value })} />
          <input className={field} placeholder="Website, @instagram or phone, for Book them" value={form.link} maxLength={200} onChange={(e) => setForm({ ...form, link: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void add()} className="inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-sm font-bold text-white disabled:opacity-60">
              {busy ? "Adding…" : "Add photographer"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="inline-flex min-h-10 items-center rounded-full bg-wash px-4 text-sm font-bold">Cancel</button>
          </div>
        </div>
      ) : list.length < 3 && (
        <button type="button" onClick={() => setAdding(true)} className="inline-flex min-h-10 items-center justify-self-start rounded-full bg-brand px-4 text-sm font-bold text-white">
          {list.length ? "Add another photographer" : "Add your photographer"}
        </button>
      )}
    </div>
  );
}
