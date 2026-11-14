// in2min2.com/{type}/{slug}/print: table cards (four A6 cards on one A4
// sheet, to cut out) or one A4 poster, each with a QR code that opens the
// photos page. Print on any printer from a phone or computer, or choose
// "Save as PDF" in the print window and take it to a print shop.
// Opened from the builder's Photos window; a private event's link carries
// its photo key, so the QR code works for everyone at the venue.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eventVars } from "@/components/event/event-view";
import { eventFontVariables } from "@/components/event/fonts";
import { WallMessage } from "@/components/photos/wall-frame";
import { QrCode } from "@/components/qr-code";
import { paletteFor } from "@/lib/catalog";
import { wallPath } from "@/lib/photos";
import { getWall, keyParam, siteOrigin } from "@/lib/public-wall";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Table cards · In2Min2", robots: { index: false, follow: false } };

export default async function PrintPage({ params, searchParams }: PageProps<"/[type]/[slug]/print">) {
  const { type, slug } = await params;
  const sp = await searchParams;
  const key = keyParam(sp);
  const poster = sp.layout === "poster";
  const w = await getWall(type, slug, key);
  if (w === null) notFound();
  if (w === undefined) return <WallMessage title="Photos aren't open yet" line="Please try again a little later." />;
  if (w.private) return <WallMessage title="This is a private event" line="Please open the table cards from your In2Min2 builder." />;
  if (!w.event) return <WallMessage title={w.title ?? "This event"} line="This event has ended." />;

  const ev = w.event;
  const p = paletteFor(ev.palette, ev.primary_color);
  const origin = await siteOrigin();
  const url = `${origin}${wallPath(type, slug, ev.private ? key : null)}`;
  const typed = ev.private ? null : `${origin.replace(/^https?:\/\//, "")}/e/${ev.short_code}`;
  const title = ev.headline || ev.title;
  const kick = ev.sensitive ? "Photos and memories" : "Share your photos";
  const here = (layout: "cards" | "poster") => `/${type}/${slug}/print?${new URLSearchParams({ ...(key ? { k: key } : {}), ...(layout === "poster" ? { layout } : {}) })}`;

  const card = (i: number) => (
    <div key={i} className="print-card">
      <div className="print-band">{kick}</div>
      <p className="print-title">{title}</p>
      <QrCode text={url} className="print-qr" label="Scan to add your photos" />
      <p className="print-steps">
        <strong>1</strong> Open your phone’s camera &nbsp;·&nbsp; <strong>2</strong> Point it at the code<br />
        <strong>3</strong> Tap the link, then <strong>{ev.sensitive ? "Share a photo or memory" : "Add your photos"}</strong>
      </p>
      <p className="print-small">No app needed{typed ? ` · or go to ${typed}` : ""} · Made with In2Min2</p>
    </div>
  );

  return (
    <main className={`${eventFontVariables} min-h-dvh bg-wash py-6 print:bg-white print:py-0`}>
      <div className="no-print mx-auto mb-6 grid max-w-2xl gap-3 px-4">
        <h1 className="font-display text-2xl font-extrabold">{poster ? "A poster" : "Table cards"} for {title}</h1>
        <p className="text-[15px] text-muted">
          {poster ? "One A4 poster for the entrance or the photo table." : "Four cards on one A4 sheet. Cut along the dashed lines and stand one on each table."}
          {" "}Print on your own printer, or choose <strong>Save as PDF</strong> in the print window and take it to a print shop.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton />
          <Link href={here(poster ? "cards" : "poster")} className="inline-flex min-h-11 items-center rounded-full bg-card px-5 font-bold ring-1 ring-line">
            {poster ? "Table cards instead" : "A poster instead"}
          </Link>
        </div>
      </div>
      <div className="print-sheet" data-layout={poster ? "poster" : "cards"} style={eventVars(p, ev.text_style)}>
        {poster ? card(0) : [0, 1, 2, 3].map(card)}
      </div>
    </main>
  );
}
