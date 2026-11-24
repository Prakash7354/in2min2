// in2min2.com/{type}/{slug}: the page guests open from the shared link.
// Drawn by the same EventView as the builder's preview. The stage (before,
// on the day, after) comes from the clock in the database, not from the host.
// Never listed by search engines: event pages carry people's names.

import { eventJsonLd } from "@/lib/event-schema";
import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { notFound } from "next/navigation";
import EventView from "@/components/event/event-view";
import { eventFontVariables } from "@/components/event/fonts";
import { formatDate, formatTime, openedKey } from "@/lib/event-view";
import { SHARE_IMAGE } from "@/lib/site-share";
import { getPublicEvent } from "@/lib/public-event";
import { PhotoWall } from "@/components/photos/photo-wall";
import { Opening } from "@/components/event/opening";
import { Rsvp } from "./rsvp";
import { LiveNotices } from "./live-notices";
import { ShareButton } from "./share-button";
import { AddToCalendar } from "./add-to-calendar";

const token = (sp: Record<string, string | string[] | undefined>) => (typeof sp.g === "string" && /^[A-Za-z0-9]{16,64}$/.test(sp.g) ? sp.g : undefined);

// What WhatsApp, Messenger, iMessage and others show when the link is pasted:
// the title, the date and place, and the preview picture made on the host's
// phone when they published (or their main photo).
export async function generateMetadata({ params, searchParams }: PageProps<"/[type]/[slug]">): Promise<Metadata> {
  const { type, slug } = await params;
  const g = token(await searchParams);
  const page = await getPublicEvent(type, slug, g);
  const robots = { index: false, follow: false };
  if (page.kind !== "event") return { title: `${page.kind === "ended" ? page.title : "in2min2"} · in2min2`, robots };
  const d = page.data;
  const when = [d.date && formatDate(d.date), formatTime(d.startTime)].filter(Boolean).join(", ");
  const description = [when, d.venueName].filter(Boolean).join(" · ") || "An invitation made with in2min2";
  const images = page.shareImage ? [{ url: page.shareImage, width: 1200, height: 630, alt: page.title }] : [SHARE_IMAGE]; // no photo yet: the in2min2 picture
  // Never listed, unless the host of a public event chose "Show on Google"
  // (owner, 23 Nov 2026); a personal link (?g=) is never listed either.
  const listed = !!d.searchable && !g;
  return {
    title: `${page.title} · in2min2`,
    description,
    robots: listed ? { index: true, follow: true } : robots,
    ...(listed ? { alternates: { canonical: `/${type}/${slug}` } } : {}),
    openGraph: { type: "website", siteName: "in2min2", title: page.title, description, images },
    twitter: { card: images ? "summary_large_image" : "summary", title: page.title, description, images: images?.map((i) => i.url) },
  };
}

function serverNow(): number {
  return Date.now();
}

export default async function EventPage({ params, searchParams }: PageProps<"/[type]/[slug]">) {
  const { type, slug } = await params;
  const g = token(await searchParams);
  const page = await getPublicEvent(type, slug, g);
  if (page.kind === "missing") notFound();

  if (page.kind !== "event") {
    return (
      <main className="grid min-h-dvh place-items-center bg-cream px-4">
        <div className="grid max-w-md gap-4 text-center">
          <p className="text-2xl"><Wordmark /></p>
          {page.kind === "private" ? (
            <>
              <h1 className="font-display text-3xl font-extrabold">This is a private event</h1>
              <p className="text-muted">Please open it with the personal link the host sent you.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-extrabold">{page.title}</h1>
              <p className="text-muted">This page is now closed. Thank you to everyone who was part of it.</p>
            </>
          )}
          <Link href="/" className="font-semibold text-brand underline underline-offset-4">Make your own event page</Link>
        </div>
      </main>
    );
  }

  const p = page.data.palette;
  const d = page.data;
  const reply = page.view === "page" && d.toggles.rsvp ? (
    <Rsvp type={type} slug={slug} token={page.viaGuestLink ? g ?? null : null} guestName={page.guestName} guestReply={page.guestReply}
      sensitive={d.sensitive} hostName={d.stars?.names.trim() || (d.sensitive ? "the family" : d.scale === "community" ? "the organisers" : "the hosts")}
      cal={{ title: page.title, date: d.date, startTime: d.startTime, endTime: d.endTime, timezone: d.timezone, venue: [d.venueName, d.venueAddress].filter(Boolean).join(", ") }}
      askFood={!!d.askFood} />
  ) : undefined;
  const photos = d.toggles.photo_wall && (page.view !== "page" || page.photosEarly) ? (
    <PhotoWall type={type} slug={slug} token={page.viaGuestLink ? g ?? null : null} sensitive={d.sensitive} live={page.view === "live"} motion={d.motion} compact />
  ) : undefined;
  // "Show on Google" (owner, 23 Nov 2026): the event's facts for Google's search and events listings.
  const schema = d.searchable && !g ? eventJsonLd(d, `https://in2min2.com/${type}/${slug}`, page.title) : null;
  return (
    <main className={`${eventFontVariables} min-h-dvh sm:py-8`} style={{ background: p.gradient ? `linear-gradient(${p.soft}e6, ${p.soft}e6), ${p.gradient}` : p.soft }}>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />}
      {d.envelope && page.view !== "after" && <>
        {/* The envelope to tap (opening.tsx), shown once per visit. These hide
            it before the page appears if it was opened already in this tab,
            or if JavaScript is off. */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(sessionStorage.getItem(${JSON.stringify(openedKey(`${type}/${slug}`))})){var s=document.createElement("style");s.textContent=${JSON.stringify(`[data-op="${type}/${slug}"]{display:none}`)};document.head.appendChild(s)}}catch(e){}` }} />
        <noscript><style>{"[data-op]{display:none}"}</style></noscript>
      </>}
      {/* First, so it covers the page from the very start. */}
      {(d.envelope || d.music) && (
        <Opening data={page.view === "after" ? { ...d, envelope: false } : d} title={page.title} to={page.viaGuestLink ? page.guestName : null} id={`${type}/${slug}`} />
      )}
      <div className="mx-auto w-full max-w-2xl overflow-hidden sm:rounded-3xl sm:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]">
        <EventView data={page.data} view={page.view} now={serverNow()} anchors reply={reply} photos={photos}
          notice={<LiveNotices type={type} slug={slug} token={page.viaGuestLink ? g ?? null : null} />} />
      </div>
      {d.date && page.view !== "after" && (
        <AddToCalendar className="px-4 pt-6" type={type} slug={slug} token={page.viaGuestLink ? g ?? null : null} colour={p.main} textColour={p.onMain}
          cal={{ title: page.title, date: d.date, startTime: d.startTime, endTime: d.endTime, timezone: d.timezone, venue: [d.venueName, d.venueAddress].filter(Boolean).join(", ") }} />
      )}
      <ShareButton title={page.title} colour={p.main} textColour={p.onMain} />
    </main>
  );
}
