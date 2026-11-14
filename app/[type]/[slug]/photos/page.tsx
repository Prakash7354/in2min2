// in2min2.com/{type}/{slug}/photos: where the table cards' QR code lands.
// Just the photo wall, in the event's design: add photos, see everyone's.
// A private event's QR carries its photo key (?k=), which opens this page
// only; a guest's own link (?g=) works too.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoWall } from "@/components/photos/photo-wall";
import { WallFrame, WallMessage } from "@/components/photos/wall-frame";
import { getWall, keyParam } from "@/lib/public-wall";

export async function generateMetadata({ params, searchParams }: PageProps<"/[type]/[slug]/photos">): Promise<Metadata> {
  const { type, slug } = await params;
  const w = await getWall(type, slug, keyParam(await searchParams));
  const title = w?.event ? `Photos · ${w.event.headline || w.event.title}` : "Photos";
  return { title: `${title} · In2Min2`, robots: { index: false, follow: false } };
}

export default async function PhotosPage({ params, searchParams }: PageProps<"/[type]/[slug]/photos">) {
  const { type, slug } = await params;
  const key = keyParam(await searchParams);
  const w = await getWall(type, slug, key);
  if (w === null) notFound();
  if (w === undefined) return <WallMessage title="Photos aren't open yet" line="Please try again a little later." />;
  if (w.private) return <WallMessage title="This is a private event" line="Please scan the QR code at the event, or open the personal link the host sent you." />;
  if (!w.event) return <WallMessage title={w.title ?? "This event"} line="This event has ended. Thank you to everyone who came." />;

  const ev = w.event;
  return (
    <WallFrame ev={ev}>
      <div className="ev-banner">{ev.sensitive ? "Photos and memories" : w.stage === "post" ? "The gallery" : "Share your photos"}</div>
      <section className="ev-section">
        <h1 className="ev-sectionTitle">{ev.headline || ev.title}</h1>
        <PhotoWall type={type} slug={slug} token={key ?? null} sensitive={ev.sensitive} live={w.stage === "live"} />
      </section>
      <footer className="ev-footer">
        {!ev.private && <Link href={`/${type}/${slug}`} className="ev-btn ev-btnGhost ev-btnSmall">See the event page</Link>}
        <span className="ev-made">Made with In<b>2</b>Min<b>2</b></span>
      </footer>
    </WallFrame>
  );
}
