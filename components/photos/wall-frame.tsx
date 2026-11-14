// The event's own colours and fonts around the photos page and the table
// cards, plus the plain pages for "private", "ended" and "not ready yet".

import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { eventVars } from "@/components/event/event-view";
import { eventFontVariables } from "@/components/event/fonts";
import { paletteFor } from "@/lib/catalog";
import type { WallEvent } from "@/lib/photos";

export function WallFrame({ ev, children }: { ev: WallEvent; children: ReactNode }) {
  const p = paletteFor(ev.palette, ev.primary_color);
  return (
    <main className={`${eventFontVariables} min-h-dvh sm:py-8`} style={{ background: p.gradient ? `linear-gradient(${p.soft}e6, ${p.soft}e6), ${p.gradient}` : p.soft }}>
      <div className="mx-auto w-full max-w-2xl overflow-hidden sm:rounded-3xl sm:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]">
        <div className="ev-frame">
          <div className="ev-root" style={eventVars(p, ev.text_style)} data-text={ev.text_style} data-motion="off" data-border="none">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export function WallMessage({ title, line }: { title: string; line: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4">
      <div className="grid max-w-md gap-4 text-center">
        <p className="text-2xl"><Wordmark /></p>
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        <p className="text-muted">{line}</p>
        <Link href="/" className="font-semibold text-brand underline underline-offset-4">Make your own event page</Link>
      </div>
    </main>
  );
}
