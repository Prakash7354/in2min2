"use client";

// The photo wheel on the website, turning with real-looking photos and a few
// guests' comments drifting over it, as on the day.

import { useEffect, useState } from "react";
import { CheerFloats, LiveOverlay } from "@/components/live/cheers";
import { PhotoWheel } from "@/components/photos/photo-wheel";
import type { Cheer, Float } from "@/lib/live";
import type { WallPhoto } from "@/lib/photos";

const PICS: [string, number, number, string][] = [
  ["hero-birthday-s", 560, 376, "Asha"], ["joyful-s", 256, 256, "Hari"], ["marquee-s", 600, 400, "Gita"], ["wedding-s", 600, 403, "Bikash"],
  ["party-s", 480, 719, "Maya"], ["christmas-s", 600, 400, "Kamala"], ["birthday-s", 600, 452, "Ram"], ["newyear-s", 600, 431, "Suman"], ["festival-s", 600, 335, "Anita"],
];
const PHOTOS: WallPhoto[] = PICS.map(([id, w, h, by], i) => ({ id, w, h, by, at: "", loves: [24, 9, 15, 31, 6, 12, 8, 19, 4][i], fav: i === 3 }));
const CHEERS: Cheer[] = [
  { id: "c1", name: "Asha", body: "What a beautiful evening! 😍", emoji: null, at: "" },
  { id: "c2", name: "Hari", body: "Congratulations from all of us", emoji: "love", at: "" },
];

export function WheelDemo({ vars }: { vars: React.CSSProperties }) {
  // A few cheers float up every few seconds, as guests send them.
  const [round, setRound] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setRound((r) => r + 1), 5200);
    return () => window.clearInterval(t);
  }, []);
  const floats: Float[] = (["love", "clap", "party", "love"] as const).map((emoji, i) => ({ key: `f${round}-${i}`, emoji }));
  return (
    <div className="ev-frame s-wheelframe">
      <div className="ev-root" style={vars} data-motion="on">
        <div className="ev-wheelHold">
          <PhotoWheel eventId="site" photos={PHOTOS} stars={[PHOTOS[3].id]} arrivals={{ ids: [], n: 0 }} motion celebrate={false}
            sky="night" srcOf={(p) => `/site/${p.id}.jpg`} />
          <LiveOverlay cheers={CHEERS} />
          <CheerFloats floats={floats} />
        </div>
      </div>
    </div>
  );
}
