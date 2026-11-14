// in2min2.com/{type}/{slug}: the page guests open from the shared link.
// Drawn by the same EventView as the builder's preview. The stage (before,
// on the day, after) comes from the clock in the database, not from the host.
// Never listed by search engines: event pages carry people's names.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventView from "@/components/event/event-view";
import { eventFontVariables } from "@/components/event/fonts";
import { getPublicEvent } from "@/lib/public-event";

const token = (sp: Record<string, string | string[] | undefined>) => (typeof sp.g === "string" && /^[A-Za-z0-9]{16,64}$/.test(sp.g) ? sp.g : undefined);

export async function generateMetadata({ params, searchParams }: PageProps<"/[type]/[slug]">): Promise<Metadata> {
  const { type, slug } = await params;
  const page = await getPublicEvent(type, slug, token(await searchParams));
  const title = page.kind === "event" ? page.title : page.kind === "ended" ? page.title : "In2Min2";
  return { title: `${title} · In2Min2`, robots: { index: false, follow: false } };
}

function serverNow(): number {
  return Date.now();
}

export default async function EventPage({ params, searchParams }: PageProps<"/[type]/[slug]">) {
  const { type, slug } = await params;
  const page = await getPublicEvent(type, slug, token(await searchParams));
  if (page.kind === "missing") notFound();

  if (page.kind !== "event") {
    return (
      <main className="grid min-h-dvh place-items-center bg-cream px-4">
        <div className="grid max-w-md gap-4 text-center">
          <p className="font-display text-xl font-extrabold text-brand">In<span className="text-marigold-deep">2</span>Min<span className="text-marigold-deep">2</span></p>
          {page.kind === "private" ? (
            <>
              <h1 className="font-display text-3xl font-extrabold">This is a private event</h1>
              <p className="text-muted">Please open it with the personal link the host sent you.</p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-extrabold">{page.title}</h1>
              <p className="text-muted">This event has ended. Thank you to everyone who came.</p>
            </>
          )}
          <Link href="/" className="font-semibold text-brand underline underline-offset-4">Make your own event page</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`${eventFontVariables} min-h-dvh`} style={{ background: page.data.palette.soft }}>
      <div className="mx-auto w-full max-w-2xl">
        <EventView data={page.data} view={page.view} now={serverNow()} />
      </div>
    </main>
  );
}
