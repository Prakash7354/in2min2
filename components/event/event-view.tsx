// One event, drawn as guests see it: the invitation card, the event page, the
// page on the day, or the thank-you page afterwards. Used by the builder's
// live preview now, and by the public page in phase 2, so what the host sees
// is exactly what guests get.
//
// Pure: no state, no clock reads (the caller passes `now`), no hooks.

import type { CSSProperties, ReactNode } from "react";
import { COPY_KEYS, type EventCopy } from "@/lib/ai/copy";
import { TEXT_STYLES } from "@/lib/catalog";
import {
  daysUntil, directionsUrl, formatDate, formatTime, monogram,
  type EventStageView, type EventViewData,
} from "@/lib/event-view";
// Styles: components/event/event-view.css, loaded once in app/layout.tsx.
// Class names: s.card → "ev-card" (see event-view.css).
const s = new Proxy({} as Record<string, string>, { get: (_, key) => `ev-${String(key)}` });

type Props = { data: EventViewData; view: EventStageView; now: number };

export default function EventView({ data, view, now }: Props) {
  const p = data.palette;
  const ts = TEXT_STYLES.find((t) => t.key === data.textStyle) ?? TEXT_STYLES[0];
  const vars = {
    "--ev-bg": p.bg, "--ev-main": p.main, "--ev-on-main": p.onMain, "--ev-accent": p.accent, "--ev-on-accent": p.onAccent,
    "--ev-soft": p.soft, "--ev-ink": p.ink, "--ev-muted": p.muted, "--ev-display": ts.display, "--ev-body": ts.body,
  } as CSSProperties;

  return (
    <div className={s.frame}>
      <div
        className={s.root}
        style={vars}
        lang={data.languages[0] ?? "en"}
        data-template={data.template}
        data-text={data.textStyle}
        data-motion={data.motion ? "on" : "off"}
      >
        {data.demo && <span className={s.demo}>Demo</span>}
        {view === "card" && <Card d={data} />}
        {view === "page" && <Page d={data} now={now} />}
        {view === "live" && <Live d={data} />}
        {view === "after" && <After d={data} />}
      </div>
    </div>
  );
}

// ─────────────── words, with the second language underneath ───────────────

function words(d: EventViewData) {
  const second = d.languages.length > 1 && d.translation ? d.translation : null;
  const starNames = d.stars?.names.trim() ?? "";
  const fallback: EventCopy = {
    card_headline: d.title.trim() || starNames || d.typeLabel,
    card_invite_body: d.sensitive
      ? `Family and friends are welcome to join us${starNames ? ` to remember ${starNames}` : ""}.`
      : d.scale === "community"
        ? "Everyone is welcome."
        : `Please join us${starNames ? ` to celebrate ${starNames}` : ""}.`,
    landing_page_story: "",
    guest_note_box: "",
    post_event_thank_you: d.sensitive
      ? "Thank you for being with us and for your kind words."
      : `Thank you for being part of ${d.title.trim() || "our day"}.`,
  };
  const main = Object.fromEntries(COPY_KEYS.map((k) => [k, d.copy[k]?.trim() || fallback[k]])) as EventCopy;
  return { main, second, secondLang: d.languages[1] };
}

function Second({ text, lang }: { text?: string; lang?: string }) {
  if (!text?.trim()) return null;
  return <span className={s.second} lang={lang}>{text}</span>;
}

function Kicker({ children }: { children: ReactNode }) {
  return <span className={s.kicker}>{children}</span>;
}

function Headline({ d, as = "h2" }: { d: EventViewData; as?: "h1" | "h2" }) {
  const { main, second, secondLang } = words(d);
  const Tag = as;
  return (
    <Tag className={s.headline}>
      {main.card_headline}
      {second?.card_headline?.trim() && (
        <span className={s.headlineSecond} lang={secondLang}>{second.card_headline}</span>
      )}
    </Tag>
  );
}

function whenLine(d: EventViewData): string {
  if (!d.date) return "Date to follow";
  const time = formatTime(d.startTime);
  const end = formatTime(d.endTime);
  return [formatDate(d.date), time && (end ? `${time} to ${end}` : time)].filter(Boolean).join(" · ");
}

function Blessing({ d }: { d: EventViewData }) {
  const names = d.family.map((f) => f.names.trim()).filter(Boolean);
  if (!names.length) return null;
  return (
    <p className={s.blessing}>
      {d.sensitive ? "With love from " : "With blessings from "}
      <strong>{names.join(", ")}</strong>
    </p>
  );
}

// ─────────────── photos ───────────────

function PhotoBox({ d, className }: { d: EventViewData; className: string }) {
  return (
    <div className={`${s.photo} ${className}`}>
      {d.cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local data: URL while drafting; R2 images later
        <img src={d.cover} alt="" />
      ) : (
        <span className={s.mono} aria-hidden="true">{monogram((d.scale === "community" ? d.title : d.stars?.names) || d.title || d.typeLabel)}</span>
      )}
    </div>
  );
}

function Photo({ d }: { d: EventViewData }) {
  switch (d.photoStyle) {
    case "arch":
      return <PhotoBox d={d} className={s.photoArch} />;
    case "polaroid":
      return (
        <div className={s.polaroids}>
          <div className={s.polaroid}><div className={s.photo} /></div>
          <div className={s.polaroid}><div className={s.photo} /></div>
          <div className={s.polaroid}><PhotoBox d={d} className="" /></div>
        </div>
      );
    case "split":
      return <PhotoBox d={d} className={s.photoSplit} />;
    default:
      return <PhotoBox d={d} className={s.photoHero} />;
  }
}

// ─────────────── views ───────────────

function Card({ d }: { d: EventViewData }) {
  const { main, second, secondLang } = words(d);
  return (
    <div className={s.cardWrap}>
      <div className={`${s.deco}`} />
      <article className={s.card}>
        <Photo d={d} />
        <Kicker>{d.sensitive ? "In loving memory" : d.scale === "community" ? d.typeLabel : "You’re invited"}</Kicker>
        <Headline d={d} />
        <p className={s.body}>
          {main.card_invite_body}
          <Second text={second?.card_invite_body} lang={secondLang} />
        </p>
        <p className={s.when}>{whenLine(d)}</p>
        {d.venueName && <p className={s.where}>{d.venueName}</p>}
        <Blessing d={d} />
        {d.toggles.rsvp && <span className={s.btn}>{d.sensitive ? "Let the family know" : "Reply"}</span>}
      </article>
      <div className={`${s.deco} ${s.decoBottom}`} />
    </div>
  );
}

function Hero({ d, children }: { d: EventViewData; children?: ReactNode }) {
  const kicker = d.sensitive ? "In loving memory" : d.typeLabel;
  if (d.photoStyle === "split") {
    return (
      <header className={`${s.hero} ${s.heroBand}`} data-photo="split">
        <div className={s.splitGrid}>
          <Photo d={d} />
          <div className={s.splitText}>
            <Kicker>{kicker}</Kicker>
            <Headline d={d} as="h1" />
            {children}
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className={`${s.hero} ${s.heroBand}`} data-photo={d.photoStyle}>
      <Photo d={d} />
      <Kicker>{kicker}</Kicker>
      <Headline d={d} as="h1" />
      {children}
    </header>
  );
}

function Page({ d, now }: { d: EventViewData; now: number }) {
  const { main, second, secondLang } = words(d);
  const days = d.toggles.countdown && d.date ? daysUntil(d.date, d.timezone, now) : null;
  const countdown = days === null || days < 0 ? null : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
  const story = main.landing_page_story.split(/\n\s*\n/).filter((x) => x.trim());
  return (
    <>
      <div className={s.deco} />
      <Hero d={d}>
        <p className={s.when}>{whenLine(d)}</p>
        {d.venueName && <p className={s.where}>{d.venueName}</p>}
        {countdown && <span className={s.chip}>{countdown}</span>}
      </Hero>

      {(story.length > 0 || main.card_invite_body) && (
        <section className={`${s.section} ${s.story}`}>
          {story.length ? story.map((para, i) => <p key={i}>{para}</p>) : <p>{main.card_invite_body}</p>}
          {second?.landing_page_story?.trim() && (
            <div className={s.storySecond} lang={secondLang}>
              {second.landing_page_story.split(/\n\s*\n/).filter((x) => x.trim()).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          )}
        </section>
      )}

      <People d={d} />
      <WhenWhere d={d} />
      {d.toggles.schedule && d.functions.length > 0 && <Schedule d={d} />}

      {main.guest_note_box && (
        <section className={s.section}>
          <p className={s.note}>
            {main.guest_note_box}
            <Second text={second?.guest_note_box} lang={secondLang} />
          </p>
        </section>
      )}

      {d.toggles.rsvp && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{d.sensitive ? "Will you attend?" : "Can you come?"}</h2>
          <div className={s.rsvpRow}>
            <span className={s.btn}>{d.sensitive ? "I’ll be there" : "Yes, we’ll come"}</span>
            <span className={`${s.btn} ${s.btnGhost}`}>Maybe</span>
            <span className={`${s.btn} ${s.btnGhost}`}>{d.sensitive ? "I can’t attend" : "Sorry, can’t come"}</span>
          </div>
        </section>
      )}

      {(d.toggles.gift_registry || d.toggles.guestbook) && !d.sensitive && (
        <section className={s.section}>
          {d.toggles.gift_registry && <p className={s.muted}>Gifts: details from the family will appear here.</p>}
          {d.toggles.guestbook && <p className={s.muted}>Guestbook: leave a message for {d.stars?.names || "the family"}.</p>}
        </section>
      )}
      {d.toggles.guestbook && d.sensitive && (
        <section className={s.section}>
          <p className={s.muted}>Book of condolence: share a memory or a message for the family.</p>
        </section>
      )}

      <Footer d={d} />
      <div className={`${s.deco} ${s.decoBottom}`} />
    </>
  );
}

function People({ d }: { d: EventViewData }) {
  const fam = d.family.filter((f) => f.names.trim());
  if (!d.stars?.names.trim() && !fam.length) return null;
  return (
    <section className={s.section}>
      <div className={s.people}>
        {d.stars?.names.trim() && (
          <div className={s.person}>
            <span className={s.relation}>{d.stars.relation || "For"}</span>
            <span className={s.names}>{d.stars.names}</span>
          </div>
        )}
        {fam.length > 0 && (
          <div className={s.person}>
            <span className={s.relation}>{d.sensitive ? "With love from" : "With blessings from"}</span>
            {fam.map((f, i) => (
              <span key={i} className={s.names}>{f.relation ? `${f.relation}: ` : ""}{f.names}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const PARKING_TEXT: Record<string, string> = {
  free: "Free car park", paid: "Paid parking", street: "Street parking nearby", none: "No parking at the venue",
};

function WhenWhere({ d }: { d: EventViewData }) {
  const url = d.toggles.map_directions ? directionsUrl(d) : null;
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>When and where</h2>
      <div className={s.facts}>
        <div className={s.fact}>
          <span className={s.icon}><CalendarIcon /></span>
          <div>
            <div className={s.factMain}>{d.date ? formatDate(d.date) : "Date to follow"}</div>
            {d.startTime && <div className={s.factSub}>{[formatTime(d.startTime), formatTime(d.endTime)].filter(Boolean).join(" to ")}</div>}
          </div>
        </div>
        {(d.venueName || d.venueAddress) && (
          <div className={s.fact}>
            <span className={s.icon}><PinIcon /></span>
            <div>
              {d.venueName && <div className={s.factMain}>{d.venueName}</div>}
              {d.venueAddress && <div className={s.factSub}>{d.venueAddress}</div>}
            </div>
          </div>
        )}
        {d.parking !== "unknown" && (
          <div className={s.fact}>
            <span className={s.icon} aria-hidden="true">P</span>
            <div>
              <div className={s.factMain}>{PARKING_TEXT[d.parking]}</div>
              {d.parkingNote && <div className={s.factSub}>{d.parkingNote}</div>}
            </div>
          </div>
        )}
      </div>
      {url && (
        <div>
          <a className={`${s.btn} ${s.btnAccent}`} href={url} target="_blank" rel="noreferrer">Directions</a>
        </div>
      )}
    </section>
  );
}

function Schedule({ d, highlightFirst = false }: { d: EventViewData; highlightFirst?: boolean }) {
  const items = [...d.functions].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const multiDay = new Set(items.map((f) => f.date)).size > 1;
  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>{d.scale === "community" ? "Programme" : "Schedule"}</h2>
      <ol className={s.schedule}>
        {items.map((f, i) => (
          <li key={i} className={highlightFirst && i === 0 ? s.now : undefined}>
            <span className={s.schedTime}>
              {formatTime(f.time) || "Time to follow"}
              {multiDay && f.date && <span className={s.schedDay}>{shortDate(f.date)}</span>}
            </span>
            <span>
              <span className={s.factMain}>{f.title || "Function"}</span>
              {f.place && <span className={s.factSub}> · {f.place}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// "Sat 13 Mar"
function shortDate(date: string): string {
  const [dow, day, month] = formatDate(date, false).split(" ");
  return `${dow.slice(0, 3)} ${day} ${month.slice(0, 3)}`;
}

function Live({ d }: { d: EventViewData }) {
  return (
    <>
      <div className={s.banner}>{d.sensitive ? "Today" : "Happening today"}</div>
      <Hero d={d}>
        <p className={s.when}>{whenLine(d)}</p>
      </Hero>
      {d.toggles.photo_wall && (
        <section className={s.section}>
          <span className={`${s.btn} ${s.btnAccent} ${s.btnBig}`}>{d.sensitive ? "Share a photo or memory" : "Add your photos"}</span>
          <div className={s.wall} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div>
          <p className={s.muted}>Guests’ photos appear here as they are added.</p>
        </section>
      )}
      {d.toggles.schedule && d.functions.length > 0 && <Schedule d={d} highlightFirst />}
      <WhenWhere d={d} />
      <Footer d={d} />
    </>
  );
}

function After({ d }: { d: EventViewData }) {
  const { main, second, secondLang } = words(d);
  return (
    <>
      <div className={s.deco} />
      <Hero d={d}>
        <p className={s.body}>
          {main.post_event_thank_you}
          <Second text={second?.post_event_thank_you} lang={secondLang} />
        </p>
      </Hero>
      {d.toggles.photo_wall && (
        <section className={s.section}>
          <h2 className={s.sectionTitle}>{d.sensitive ? "Photos and memories" : "The gallery"}</h2>
          <div className={s.wall} aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <span key={i} />)}</div>
          <p className={s.muted}>Every guest’s photos, in one place.</p>
        </section>
      )}
      {d.toggles.guestbook && (
        <section className={s.section}>
          <p className={s.muted}>{d.sensitive ? "Messages for the family" : "Messages from guests"} will appear here.</p>
        </section>
      )}
      <Footer d={d} />
      <div className={`${s.deco} ${s.decoBottom}`} />
    </>
  );
}

function Footer({ d }: { d: EventViewData }) {
  const o = d.organiser;
  return (
    <footer className={s.footer}>
      {o?.name && (
        <span>
          Organised by <strong>{o.name}</strong>
          {o.typeLabel && ` · ${o.typeLabel}`}
          {o.charityNumber && ` · Charity ${o.charityNumber}`}
          {o.forProfit !== null && (o.forProfit ? " · Run for profit" : " · Not for profit")}
          {o.contact && ` · ${o.contact}`}
        </span>
      )}
      {!d.hideBranding && <span className={s.made}><i />Made with In2Min2</span>}
    </footer>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" fill="none" />
      <circle cx="12" cy="9.5" r="2.5" fill="none" />
    </svg>
  );
}
