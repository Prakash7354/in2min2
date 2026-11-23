// in2min2.com/photographer/{key}: the private link the host sends their
// photographer (0009). No account and no app: choose photos, and they go on
// the guests' photo wall with the photographer's name on each one.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhotographerUpload } from "@/components/photos/photographer-upload";
import { WallFrame, WallMessage } from "@/components/photos/wall-frame";
import type { WallEvent } from "@/lib/photos";
import { rpc } from "@/lib/supabase/rest";

export const metadata: Metadata = { title: "Add your photos · in2min2", robots: { index: false, follow: false } };

type PgWall = {
  active: boolean; stage: string; on: boolean; limit: number | null; used: number; mine: number;
  photographer: { name: string; business: string | null };
  event: { id: string; type: string; slug: string; title: string; headline: string | null; scale: WallEvent["scale"];
    palette: string; primary_color: string; text_style: string; private: boolean; wall_key: string | null };
};

export default async function PhotographerPage({ params }: PageProps<"/photographer/[key]">) {
  const { key } = await params;
  if (!/^[0-9a-f]{32}$/.test(key)) notFound();
  const r = await rpc<PgWall | null>("photographer_wall", { p_key: key });
  if (!r.ok) return <WallMessage title="Photos aren't open yet" line="Please try again a little later." />;
  if (!r.data) return <WallMessage title="This link doesn't work" line="Please ask the host for a new photographer link." />;
  const w = r.data;
  if (!w.active) return <WallMessage title="This link is switched off" line="Please ask the host if you'd like to add more photos." />;
  if (w.stage === "expired" || w.stage === "cancelled") return <WallMessage title={w.event.title} line="This event's page has closed." />;
  if (!w.on) return <WallMessage title={w.event.title} line="The host has switched off photos for this event." />;

  const ev = w.event;
  const frame: WallEvent = { ...ev, short_code: "", sensitive: false };
  const wallHref = `/${ev.type}/${ev.slug}/photos${ev.wall_key ? `?k=${ev.wall_key}` : ""}`;
  return (
    <WallFrame ev={frame}>
      <div className="ev-banner">For the photographer</div>
      <section className="ev-section">
        <h1 className="ev-sectionTitle">{ev.headline || ev.title}</h1>
        <PhotographerUpload pgKey={key} name={w.photographer.business || w.photographer.name}
          limit={w.limit} used={w.used} mine={w.mine} wallHref={wallHref} />
      </section>
      <footer className="ev-footer"><span className="ev-made">Made with In<b>2</b>Min<b>2</b></span></footer>
    </WallFrame>
  );
}
