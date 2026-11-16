"use client";

// Everything a host can share, in one place (owner's request, 14 Nov 2026:
// "all of these links made available here, to share any one of them or all of
// them as and when they want").
//
// There is one event link. It is the whole event page and changes by itself:
// the invitation before, the live page on the day, the thank-you afterwards.
// Each "moment" below is a ready-typed message with that link (some jump
// straight to a part of the page), for the host to send when the time comes.

import type { Draft } from "@/lib/draft";
import { eventType } from "@/lib/catalog";
import { formatDate, formatTime } from "@/lib/event-view";
import { copyLink, shareLink, whatsappUrl } from "@/lib/share";

export type Moment = { key: string; label: string; when: string; text: string; hash?: string; opens?: string };

export function moments(d: Draft): Moment[] {
  const t = eventType(d.eventType);
  const sensitive = t?.sensitive ?? false;
  const community = d.scale === "community";
  const title = d.title.trim() || "Our event";
  const date = d.date ? formatDate(d.date) : "";
  const time = formatTime(d.startTime);
  const when = [date, time].filter(Boolean).join(", ");
  const venue = d.venueName.trim();
  const whenWhere = [when, venue].filter(Boolean).join(" · ");
  const hasOrder = d.toggles.schedule && d.functions.some((f) => f.title.trim());
  const hasMenu = d.toggles.menu && d.functions.some((f) => f.meal && (f.menu ?? []).some((m) => m.dish.trim()));

  const list: Moment[] = [];
  list.push({
    key: "invite", label: community ? "The announcement" : "The invitation", when: "Now",
    text: sensitive ? `${title}\n${whenWhere}\nDetails from the family:`
      : community ? `${title}\n${whenWhere}\nEveryone is welcome. All the details:`
      : `You're invited: ${title}\n${whenWhere}\n${d.toggles.rsvp ? "All the details, and please reply here:" : "All the details here:"}`,
  });
  if (hasOrder) list.push({
    key: "order", label: community ? "The programme" : "The running order", when: "The week before",
    text: `${community ? "The programme" : "The running order"} for ${title}${hasMenu ? ", with the menu" : ""}:`, hash: "#running-order",
    opens: `Opens the page at the ${community ? "programme" : "running order"}`,
  });
  if (venue || d.venueAddress.trim()) list.push({
    key: "where", label: "Directions and parking", when: "The day before",
    text: `How to find ${venue || "the venue"}${d.parking !== "unknown" ? ", and where to park" : ""}:`, hash: "#where",
    opens: "Opens the page at the map and directions",
  });
  if (!sensitive && date) list.push({
    key: "reminder", label: "A reminder", when: "The day before",
    text: `Reminder: ${title} is on ${date}${time ? ` at ${time}` : ""}. See you there!`,
  });
  if (!sensitive) list.push({
    key: "today", label: "On the day", when: "On the day",
    text: `${title} is today!${hasOrder ? " What's on and when:" : " All the details:"}`,
  });
  list.push({
    key: "thanks", label: "Thank you", when: "Afterwards",
    text: sensitive ? "Thank you for being with us. The family's message:" : `Thank you for being part of ${title}! A message from us:`,
  });
  return list;
}

const pill = "inline-flex min-h-10 items-center justify-center rounded-full px-3.5 text-sm font-bold";

export function ShareLinks({ d, say, link }: { d: Draft; say: (m: string) => void; link: string }) {
  const short = d.shortPath && typeof window !== "undefined" ? `${window.location.origin}${d.shortPath}` : null;
  const title = d.title.trim() || "Our event";
  const bare = (u: string) => u.replace(/^https?:\/\//, "");

  async function share(url: string, text: string) {
    const r = await shareLink(url, title, text);
    if (r === "copied") say("Message and link copied. Paste them into WhatsApp or a text.");
    if (r === "failed") say("Couldn't share from this browser. Use Copy instead.");
  }
  async function copy(text: string, what: string) {
    const r = await copyLink(text);
    say(r === "copied" ? `${what} copied.` : "Couldn't copy here. Press and hold the text to copy it.");
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1 rounded-2xl bg-wash p-3">
        <p className="font-bold">One link does it all</p>
        <p className="text-[15px] leading-snug text-muted">
          It&apos;s your whole event page, and it changes by itself: the invitation now, the live page on the day, the thank-you
          afterwards. Send it once, or send a message below at each moment.
        </p>
      </div>

      <div className="grid gap-2">
        <LinkRow label="Your link" url={link} shown={bare(link)} onCopy={() => void copy(link, "Link")} />
        {short && <LinkRow label="Short link, for posters and reading aloud" url={short} shown={bare(short)} onCopy={() => void copy(short, "Short link")} />}
      </div>

      <p className="px-1 pt-1 text-sm font-bold uppercase tracking-wider text-muted">Ready-made messages</p>
      <ul className="grid gap-2">
        {moments(d).map((m) => {
          const url = link + (m.hash ?? "");
          return (
            <li key={m.key} className="grid gap-2 rounded-2xl border border-line bg-card p-3">
              <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-semibold">{m.label}</span>
                <span className="rounded-full bg-wash px-2 py-0.5 text-xs font-bold text-muted">{m.when}</span>
              </p>
              <p className="whitespace-pre-line text-[15px] leading-snug text-muted">{m.text}</p>
              {m.opens && <p className="text-sm font-semibold text-brand">{m.opens}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`${pill} bg-brand text-white hover:bg-brand-deep`} onClick={() => void share(url, m.text)}>Share</button>
                <a href={whatsappUrl(url, m.text)} target="_blank" rel="noreferrer" className={`${pill} bg-[#25D366] text-[#073B1C] hover:brightness-95`}>WhatsApp</a>
                <button type="button" className={`${pill} bg-wash text-ink hover:bg-line`} onClick={() => void copy(`${m.text}\n${url}`, "Message")}>Copy</button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="px-1 text-sm leading-snug text-muted">
        Coming next: a personal link for each guest, and a poster with a QR code to print or download. Tournaments get a big-screen link in March.
      </p>
    </div>
  );
}

function LinkRow({ label, url, shown, onCopy }: { label: string; url: string; shown: string; onCopy: () => void }) {
  return (
    <div className="grid gap-1">
      <span className="px-1 text-sm font-semibold text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 break-all rounded-xl bg-card px-3 py-2 font-semibold text-brand underline underline-offset-4 ring-1 ring-line">{shown}</a>
        <button type="button" onClick={onCopy} className={`${pill} shrink-0 bg-wash text-ink hover:bg-line`}>Copy</button>
      </div>
    </div>
  );
}
