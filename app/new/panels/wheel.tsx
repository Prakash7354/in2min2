"use client";

// The photo wheel in the host's Photos panel, there from the very start
// (owner, 16 Nov 2026: "could that feature be accessible from the outset, not
// just on the day … people might like to try it out beforehand").
//
// - Before publishing: drawn sample pictures turning in the event's own sky,
//   and "Try it with your photos". Those are shrunk on this phone and jump on
//   to the wheel at once, with "New" and the confetti guests see on the day.
//   They are never uploaded or saved, and go when the panel closes.
// - After publishing: the real photos on the wall, with the samples filling
//   in until there are four.

import { useRef, useState } from "react";
import { eventVars } from "@/components/event/event-view";
import { Icon } from "@/components/icons";
import { PhotoWheel } from "@/components/photos/photo-wheel";
import { SAMPLE_PHOTOS, sampleSrc } from "@/components/photos/samples";
import { eventType, paletteFor, skyFor } from "@/lib/catalog";
import { resizePhoto } from "@/lib/image";
import { photoUrl, type WallPhoto } from "@/lib/photos";
import type { HostPhoto } from "../../builder/photos";
import { useB2 } from "../context";

type Tried = WallPhoto & { src: string };
const ENOUGH = 4;      // with this many of the host's own, the samples step aside
const MOST = 12;       // try-out photos at a time (they're kept in the phone's memory)

const toWall = (h: HostPhoto): WallPhoto => ({ id: h.id, w: h.width, h: h.height, by: h.added_by, at: h.created_at, loves: h.love_count ?? 0, fav: !!h.favourite });

export function WheelTry({ real, sky, tryOwn }: { real?: HostPhoto[]; sky?: string | null; tryOwn: boolean }) {
  const { d, say } = useB2();
  const palette = paletteFor(d.palette, d.customColor);
  const sensitive = !!eventType(d.eventType)?.sensitive;
  const [tried, setTried] = useState<Tried[]>([]);
  const [busy, setBusy] = useState(false);
  const [arrivals, setArrivals] = useState<{ ids: string[]; n: number }>({ ids: [], n: 0 });
  const input = useRef<HTMLInputElement>(null);
  const mine: WallPhoto[] = [...(real ?? []).map(toWall), ...tried];
  const own = mine.length >= ENOUGH;
  const photos = own ? mine : [...mine, ...SAMPLE_PHOTOS];
  const srcOf = (p: WallPhoto) =>
    p.id.startsWith("sample-") ? sampleSrc(p.id)
      : p.id.startsWith("try-") ? tried.find((x) => x.id === p.id)?.src ?? ""
        : d.eventId ? photoUrl(d.eventId, p.id, "t") : "";

  async function add(files: FileList | null) {
    const room = MOST - tried.length;
    const list = Array.from(files ?? []).slice(0, Math.max(0, room));
    if (!list.length) { if (files?.length) say(`That's plenty to try it: ${MOST} photos.`); return; }
    setBusy(true);
    const added: Tried[] = [];
    for (const f of list) {
      try {
        const r = await resizePhoto(f, 900, 0.78);
        added.push({ id: `try-${Date.now().toString(36)}-${added.length}`, w: r.width, h: r.height, by: "you", at: "", src: r.url });
      } catch { /* not a photo: skip it */ }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    if (!added.length) { say("Those couldn't be opened. Try other photos."); return; }
    setTried((x) => [...x, ...added]);
    // When the samples step aside the wheel starts afresh with the host's own
    // photos, so there's nothing to jump in; otherwise the new ones jump in next.
    const fresh = own || mine.length + added.length < ENOUGH;
    setArrivals((a) => ({ ids: fresh ? added.map((p) => p.id) : [], n: a.n + 1 }));
    say(added.length === 1 ? "Watch it jump on to the wheel." : `${added.length} photos are jumping on to the wheel.`);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ev-frame b2-wheelframe">
        <div className="ev-root" style={eventVars(palette, d.textStyle)} data-motion={d.motion ? "on" : "off"}>
          <div style={{ padding: "0 min(calc(var(--u) * 6), 36px)" }}>
            <PhotoWheel key={own ? "own" : "mixed"} eventId={d.eventId ?? "try"} photos={photos} stars={[]} arrivals={arrivals}
              motion={d.motion} celebrate={d.motion && !sensitive} sky={skyFor(palette, sky)} srcOf={srcOf}
              onLove={() => say("Guests tap the heart to love the photo at the front.")}
              onOpen={() => say("On the day, a tap shows the photo large.")} />
          </div>
        </div>
      </div>
      {!own && <p className="b2-small">{mine.length ? `Drawn pictures fill in until there are ${ENOUGH} photos.` : "Drawn pictures for now. Swipe it to spin it."}</p>}
      {tryOwn && (
        <>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => void add(e.target.files)} />
          <button type="button" className="b2-btn b2-primary b2-block" disabled={busy} onClick={() => input.current?.click()}>
            <Icon name="camera" className="" />{busy ? "Getting them ready…" : tried.length ? "Try more photos" : "Try it with your photos"}
          </button>
          <p className="b2-small" style={{ marginTop: -4 }}>
            Just to try: they stay on this phone, nobody else sees them, and they go when you close this.
            {tried.length > 0 && <> <button type="button" className="b2-link" onClick={() => { setTried([]); setArrivals((a) => ({ ids: [], n: a.n + 1 })); }}>Clear them now</button></>}
          </p>
        </>
      )}
    </div>
  );
}
