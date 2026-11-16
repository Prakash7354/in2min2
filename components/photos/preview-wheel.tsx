"use client";

// The builder's preview of the photo wheel, turning as it will on the day
// (owner, 16 Nov 2026: in the preview "those wheel photos are not moving").
// The host's own photos first, then drawn sample pictures until guests add
// theirs. Thumbnails keep the still fan (event-view.tsx, Fan).

import type { EventViewData } from "@/lib/event-view";
import { skyFor } from "@/lib/catalog";
import type { WallPhoto } from "@/lib/photos";
import { PhotoWheel } from "./photo-wheel";
import { SAMPLE_PHOTOS, sampleSrc } from "./samples";

const NONE = { ids: [] as string[], n: 0 };

export function PreviewWheel({ d }: { d: EventViewData }) {
  const own = d.cover ? [d.cover, ...d.moreCovers] : [];
  const photos: WallPhoto[] = [...own.map((_, i) => ({ id: `own-${i}`, w: 1200, h: 1600, by: "You", at: "" })), ...SAMPLE_PHOTOS];
  const srcOf = (p: WallPhoto) => (p.id.startsWith("own-") ? own[Number(p.id.slice(4))] ?? "" : sampleSrc(p.id));
  return (
    <PhotoWheel eventId="preview" photos={photos} stars={[]} arrivals={NONE} motion={d.motion} celebrate={false}
      sky={skyFor(d.palette)} srcOf={srcOf} />
  );
}
