"use client";

// The hosts' announcements at the top of the event page (0011): "Car park
// full", "Running 15 minutes late". Checked every minute while the page is
// open, so guests see a new one without reloading.

import { useEffect, useState } from "react";
import { Notices } from "@/components/live/cheers";
import { useLive } from "@/lib/live";

export function LiveNotices({ type, slug, token }: { type: string; slug: string; token: string | null }) {
  const lv = useLive(type, slug, token, 60_000);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(t); }, []);
  return <Notices list={lv.announcements} now={now} />;
}
