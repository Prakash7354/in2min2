// in2min2.com/{type}/{slug}/tv: the guests' photos as a slideshow for a TV
// or projector (components/photos/slideshow.tsx). The QR code in the corner
// opens the photos page, with a private event's photo key when it has one.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eventFontVariables } from "@/components/event/fonts";
import { Slideshow } from "@/components/photos/slideshow";
import { WallMessage } from "@/components/photos/wall-frame";
import { paletteFor, textStyle } from "@/lib/catalog";
import { wallPath } from "@/lib/photos";
import { getWall, keyParam, siteOrigin } from "@/lib/public-wall";

export async function generateMetadata({ params, searchParams }: PageProps<"/[type]/[slug]/tv">): Promise<Metadata> {
  const { type, slug } = await params;
  const w = await getWall(type, slug, keyParam(await searchParams));
  return { title: `${w?.event ? `${w.event.headline || w.event.title} · ` : ""}Photo slideshow · In2Min2`, robots: { index: false, follow: false } };
}

export default async function TvPage({ params, searchParams }: PageProps<"/[type]/[slug]/tv">) {
  const { type, slug } = await params;
  const key = keyParam(await searchParams);
  const w = await getWall(type, slug, key);
  if (w === null) notFound();
  if (w === undefined) return <WallMessage title="Photos aren't open yet" line="Please try again a little later." />;
  if (w.private) return <WallMessage title="This is a private event" line="Please open the slideshow from the link in your In2Min2 builder." />;
  if (!w.event) return <WallMessage title={w.title ?? "This event"} line="This event has ended." />;

  const ev = w.event;
  const p = paletteFor(ev.palette, ev.primary_color);
  const origin = await siteOrigin();
  const join = `${origin}${wallPath(type, slug, ev.private ? key : null)}`;
  const joinText = ev.private ? "Point your phone’s camera at the code" : `or go to ${origin.replace(/^https?:\/\//, "")}/e/${ev.short_code}`;
  return (
    <main className={eventFontVariables}>
      <Slideshow type={type} slug={slug} token={key ?? null} eventId={ev.id} title={ev.headline || ev.title} joinUrl={join} joinText={joinText}
        main={p.main} onMain={p.onMain} accent={p.accent} display={textStyle(ev.text_style).display} motion={!ev.sensitive} />
    </main>
  );
}
