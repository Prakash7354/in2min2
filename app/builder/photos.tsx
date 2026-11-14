"use client";

// Guests' photos, for the host (0006): what's waiting for an OK, what's on
// the wall, what's hidden, and anything a guest asked to be removed. Plus the
// two settings, and the links for the TV slideshow, the table cards and the
// photos page. Row Level Security decides who sees and changes them: the
// event's own hosts; only the owner and co-hosts can remove one for good.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Draft } from "@/lib/draft";
import { photoUrl, wallPath } from "@/lib/photos";
import { copyLink, whatsappUrl } from "@/lib/share";
import { supabase } from "@/lib/supabase/client";

export type HostPhoto = {
  id: string; status: "waiting" | "shown" | "hidden"; width: number; height: number; added_by: string | null;
  removal_asked_at: string | null; removal_note: string | null; kept_at: string | null; reviewed_at: string | null;
  ready_at: string | null; created_at: string;
};
type Wall = {
  wallKey: string; isPrivate: boolean; photoLimit: number | null; perGuest: number | null;
  settings: Record<string, unknown>; approveFirst: boolean; early: boolean;
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
  saveRules: (patch: { approve_first?: boolean; early?: boolean }) => Promise<boolean>;
};

const asked = (p: HostPhoto) => !!p.removal_asked_at && p.status === "hidden" && !p.kept_at && (!p.reviewed_at || p.reviewed_at <= p.removal_asked_at);

export function usePhotos(eventId: string | undefined, session: Session | null, scale: string, sensitive: boolean): PhotosState {
  const [rows, setRows] = useState<HostPhoto[] | null>(null);
  const [wall, setWall] = useState<Wall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);
  const live = !!eventId && !!session;

  const load = useCallback(async () => {
    if (!eventId || !session) return;
    const sb = supabase();
    const [p, e, f] = await Promise.all([
      sb.from("event_photos").select("id, status, width, height, added_by, removal_asked_at, removal_note, kept_at, reviewed_at, ready_at, created_at")
        .eq("event_id", eventId).neq("status", "uploading").order("ready_at", { ascending: false }).limit(1000),
      sb.from("events").select("wall_key, is_private, plans(photo_limit, photos_per_guest)").eq("id", eventId).maybeSingle(),
      sb.from("feature_toggles").select("settings").eq("event_id", eventId).maybeSingle(),
    ]);
    if (p.error) {
      const missing = p.error.code === "42P01" || p.error.code === "PGRST205" || /event_photos/.test(p.error.message);
      setNotReady(missing);
      setError(missing ? null : `Couldn't load photos. (Details for Claude Code: ${p.error.code ?? ""} ${p.error.message})`);
      return;
    }
    setNotReady(false);
    setError(null);
    setRows(p.data as HostPhoto[]);
    const ev = e.data as { wall_key: string; is_private: boolean; plans: { photo_limit: number | null; photos_per_guest: number | null } | null } | null;
    const settings = ((f.data as { settings?: Record<string, unknown> } | null)?.settings ?? {}) as Record<string, unknown>;
    const pw = (settings.photo_wall ?? {}) as { approve_first?: unknown; early?: unknown };
    if (ev) {
      setWall({
        wallKey: ev.wall_key, isPrivate: ev.is_private, photoLimit: ev.plans?.photo_limit ?? null, perGuest: ev.plans?.photos_per_guest ?? null,
        settings,
        // Same default as photo_rules() in 0006: checked first for community events and memorials.
        approveFirst: typeof pw.approve_first === "boolean" ? pw.approve_first : scale === "community" || sensitive,
        early: pw.early === true,
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

  const saveRules = useCallback(async (patch: { approve_first?: boolean; early?: boolean }) => {
    if (!eventId || !wall) return false;
    const pw = { ...((wall.settings.photo_wall as Record<string, unknown> | undefined) ?? {}), ...patch };
    const r = await supabase().from("feature_toggles").update({ settings: { ...wall.settings, photo_wall: pw } }).eq("event_id", eventId);
    await load();
    return !r.error;
  }, [eventId, wall, load]);

  const list = rows ?? [];
  const needsYou = list.filter((p) => p.status === "waiting" || asked(p)).length;
  return {
    rows: live ? rows : null, wall: live ? wall : null, error, notReady, needsYou: live ? needsYou : 0,
    refresh: () => void load(), setStatus, removeForGood, saveRules,
  };
}

// ─────────────────────────── the window ───────────────────────────

export function PhotosDialog({ d, eventId, state, onClose, say }: { d: Draft; eventId: string; state: PhotosState; onClose: () => void; say: (m: string) => void }) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const [picked, setPicked] = useState<HostPhoto | null>(null);
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
  const printLink = type && slug ? `${origin}${wallPath(type, slug, key, "print")}` : null;
  const title = d.title.trim() || "Our event";
  const wallOff = !d.toggles.photo_wall;

  async function act(ids: string[], status: HostPhoto["status"], done: string) {
    setPicked(null);
    say((await state.setStatus(ids, status)) ? done : "That didn't work. Please try again.");
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
                <a href={printLink ?? "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-wash px-4 text-sm font-bold hover:bg-line">Print table cards with a QR code</a>
                <a href={whatsappUrl(photosLink, `Add your photos from ${title} here. No app needed:`)} target="_blank" rel="noreferrer"
                  className="inline-flex min-h-10 items-center rounded-full bg-[#25D366] px-4 text-sm font-bold text-[#073B1C]">Send the photo link on WhatsApp</a>
                <button type="button" className="inline-flex min-h-10 items-center rounded-full bg-wash px-4 text-sm font-bold hover:bg-line"
                  onClick={async () => say((await copyLink(photosLink)) === "copied" ? "Photo link copied." : "Couldn't copy here.")}>Copy the photo link</button>
              </div>
              <p className="text-sm text-muted">The slideshow runs on a laptop plugged into the venue&apos;s TV, or a smart TV&apos;s web browser. Press <strong>Full screen</strong>.{w?.isPrivate ? " These links carry your event's photo key, so they work for everyone at the venue: share them only there." : ""}</p>
            </div>
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

          <Group title="On the wall" line={shown.length ? "Tap a photo to hide it or remove it." : "No photos yet. Share the photo link or put the table cards out."}>
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
            <p className="text-white/80">{picked.added_by ? `Added by ${picked.added_by}` : "Added by a guest"}</p>
            <div className="flex flex-wrap gap-2">
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
        <button key={p.id} type="button" onClick={() => onPick(p)} className="aspect-square overflow-hidden rounded-lg bg-wash" aria-label={`Photo${p.added_by ? ` by ${p.added_by}` : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 thumbnail */}
          <img src={photoUrl(eventId, p.id, "t")} alt="" className="size-full object-cover" loading="lazy" />
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
