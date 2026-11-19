// One event, drawn as guests see it: the invitation card, the event page, the
// page on the day, or the thank-you page afterwards. Used by the builder's
// live preview now, and by the public page in phase 2, so what the host sees
// is exactly what guests get.
//
// Pure: no state, no clock reads (the caller passes `now`), no hooks.

import type { CSSProperties, ReactNode } from "react";
import { COPY_KEYS, type EventCopy } from "@/lib/ai/copy";
import { partyColours, skyFor, textStyle, type HeroMotion, type Palette, backdropOf } from "@/lib/catalog";
import {
  daysUntil, directionsUrl, formatDate, formatTime, monogram, runningOrder,
  type EventStageView, type EventViewData, type MenuItem,
} from "@/lib/event-view";
import { Icon, type IconName } from "@/components/icons";
import { PreviewWheel } from "@/components/photos/preview-wheel";
import BorderArt from "./borders";
import Effect from "./effects";
// Styles: components/event/event-view.css, loaded once in app/layout.tsx.
// Class names: s.card → "ev-card" (see event-view.css).
const s = new Proxy({} as Record<string, string>, { get: (_, key) => `ev-${String(key)}` });

// thumb: a small copy in the builder (a tile or the little preview). Full-size
// pages get minimum text sizes; thumbnails shrink everything evenly.
// anchors: the public page only. Sections get ids (#running-order, #where,
// #reply) so a shared link can jump straight to them; the builder shows several
// copies at once, so it leaves them out.
// reply: the public page's working reply form (app/[type]/[slug]/rsvp.tsx).
// Without it, the reply buttons are drawn as a preview.
// photos: the public page's working photo wall (components/photos). Shown on
// the day and afterwards; before the day only if the host opened it early.
// notice: the public page's live announcements (app/[type]/[slug]/live-notices.tsx), at the very top.
type Props = { data: EventViewData; view: EventStageView; now: number; thumb?: boolean; anchors?: boolean; reply?: ReactNode; photos?: ReactNode; notice?: ReactNode };

// The event's colours and fonts as CSS variables. Also used by the photos
// page, the TV slideshow and the table cards, which wear the event's design.
export function eventVars(p: Palette, textStyleKey: string): CSSProperties {
  const ts = textStyle(textStyleKey);
  const party = partyColours(p);
  return {
    "--ev-bg": p.bg, "--ev-main": p.main, "--ev-on-main": p.onMain, "--ev-accent": p.accent, "--ev-on-accent": p.onAccent,
    "--ev-soft": p.soft, "--ev-ink": p.ink, "--ev-muted": p.muted, "--ev-display": ts.display, "--ev-body": ts.body,
    ...(p.gradient ? { "--ev-gradient": p.gradient } : {}),
    ...Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`--ev-c${i + 1}`, party[i % party.length]])),
  } as CSSProperties;
}

export default function EventView({ data, view, now, thumb = false, anchors = false, reply, photos, notice }: Props) {
  const p = data.palette;
  const bd = backdropOf(data.backdrop);
  const vars = bd ? { ...eventVars(p, data.textStyle), ["--ev-backdrop" as string]: `url(${bd.file})`, ["--ev-shade" as string]: String(bd.shade ?? 0) } : eventVars(p, data.textStyle);

  return (
    <div className={s.frame}>
      <div
        className={s.root}
        style={vars}
        lang={data.languages[0] ?? "en"}
        data-template={data.template}
        data-text={data.textStyle}
        data-motion={data.motion ? "on" : "off"}
        data-border={data.border}
        data-gradient={p.gradient ? "on" : "off"}
        data-thumb={thumb ? "" : undefined}
        data-backdrop={bd ? (bd.dark ? "dark" : "light") : undefined}
      >
        {data.demo && <span className={s.demo}>Demo</span>}
        {!thumb && data.motion && !data.sensitive && <Effect kind={data.effect} />}
        {view !== "card" && notice}
        {view === "card" && <Card d={data} />}
        {view === "page" && <Page d={data} now={now} a={anchors} reply={reply} photos={photos} />}
        {view === "live" && <Live d={data} now={now} a={anchors} photos={photos} thumb={thumb} />}
        {view === "after" && <After d={data} a={anchors} photos={photos} thumb={thumb} />}
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

// The builder's still preview of the photo wheel (components/photos/
// photo-wheel.tsx): five cards on a ring, the middle one a little larger,
// using the host's own photos when there are some.
const FAN = [-2, -1, 0, 1, 2];
function Fan({ d }: { d: EventViewData }) {
  const pics = d.cover ? [d.cover, ...d.moreCovers] : [];
  const R = 50; // in --u (1% of the page width), as the real wheel; thumbnails stay exact small copies
  return (
    <div className={`${s.fan} ${s.sky}`} data-sky={skyFor(d.palette)} aria-hidden="true">
      {FAN.map((k, i) => {
        const th = (k * Math.PI) / 5;
        const c = Math.cos(th);
        const style = {
          transform: `translate3d(calc(var(--u) * ${(Math.sin(th) * R).toFixed(2)}), calc(var(--u) * ${(-(1 - c) * R * 0.14).toFixed(2)}), calc(var(--u) * ${((c - 1) * R).toFixed(2)})) rotateY(${k * 36}deg) scale(${k === 0 ? 1.14 : 1})`,
          zIndex: 10 - Math.abs(k),
          background: pics.length ? undefined : `var(--ev-c${i + 1})`,
          filter: k === 0 ? undefined : `brightness(${(0.65 + 0.35 * c).toFixed(2)})`,
        } as CSSProperties;
        const src = pics.length ? pics[[3, 1, 0, 2, 4][i] % pics.length] : null; // the main photo in the middle
        return (
          // eslint-disable-next-line @next/next/no-img-element -- the host's own photo
          <span key={k} style={style}>{src && <img src={src} alt="" />}</span>
        );
      })}
    </div>
  );
}

// A section heading with its little picture (components/icons.tsx).
function Title({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <h2 className={s.sectionTitle}>
      <span className={s.titleIcon} aria-hidden="true"><Icon name={icon} className="" /></span>
      {children}
    </h2>
  );
}

// ─────────────── photos ───────────────

// "whole": the whole picture, never cropped, on a soft blurred copy of itself
// (for logos, posters, and photos with words on them). "fill": cropped to fill.
//
// Showcase (0007): with more photos, the main one sits still underneath and
// each further photo arrives in turn as a layer on top; the last layer is the
// main photo again, so the loop restarts without a jump. All CSS (the
// ev-zoomin-, ev-zoomout- and ev-slide- keyframes in event-view.css, one set per
// number of photos), so this stays pure and the builder's thumbnails stay still.
// zoomin and zoomout: each photo glides in from the right as it fades up, then
// slowly zooms closer (or draws back) while it's on top. slide: as before.
const SHOW_SECONDS: Record<HeroMotion, number> = { zoomin: 6, zoomout: 6, slide: 5 };

function PhotoBox({ d, className }: { d: EventViewData; className: string }) {
  const whole = d.coverFit === "whole";
  const all = d.cover ? [d.cover, ...d.moreCovers].slice(0, 5) : [];
  const n = all.length;
  const layer = (src: string) => (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- a local data: URL while drafting; stored photos when published */}
      {whole && <img src={src} alt="" aria-hidden="true" className={s.photoBlur} />}
      {/* eslint-disable-next-line @next/next/no-img-element -- as above */}
      <img src={src} alt="" className={s.photoImg} />
    </>
  );
  const vars = { "--cycle": `${n * SHOW_SECONDS[d.heroMotion]}s`, "--base": `ev-${d.heroMotion}base-${n}` } as CSSProperties;
  return (
    <div className={`${s.photo} ${className}`} data-fit={d.cover ? d.coverFit : undefined}
      data-show={n > 1 ? d.heroMotion : undefined} style={n > 1 ? vars : undefined}>
      {d.cover ? (
        <>
          {layer(all[0])}
          {n > 1 && [...all.slice(1), all[0]].map((src, i) => (
            <div key={i} className={s.slide} aria-hidden="true" style={{ "--slide": `ev-${d.heroMotion}-${n}-${i + 1}` } as CSSProperties}>
              {layer(src)}
            </div>
          ))}
        </>
      ) : (
        <span className={s.mono} aria-hidden="true">{monogram((d.scale === "community" ? d.title : d.stars?.names) || d.title || d.typeLabel)}</span>
      )}
    </div>
  );
}

// A still photo in one of the back polaroids.
function Still({ src }: { src?: string }) {
  return (
    <div className={s.photo}>
      {/* eslint-disable-next-line @next/next/no-img-element -- as above */}
      {src && <img src={src} alt="" className={s.photoImg} />}
    </div>
  );
}

function Photo({ d }: { d: EventViewData }) {
  switch (d.photoStyle) {
    case "arch":
      return <PhotoBox d={d} className={s.photoArch} />;
    case "polaroid":
      // A still stack: the main photo on top, the next two behind it.
      return (
        <div className={s.polaroids}>
          <div className={s.polaroid}><Still src={d.moreCovers[1]} /></div>
          <div className={s.polaroid}><Still src={d.moreCovers[0]} /></div>
          <div className={s.polaroid}><PhotoBox d={{ ...d, moreCovers: [] }} className="" /></div>
        </div>
      );
    case "split":
      return <PhotoBox d={d} className={s.photoSplit} />;
    case "heart":
      // A soft heart with a fine outline in the event's accent colour (0010).
      return <div className={s.heartWrap}><PhotoBox d={d} className={s.photoHeart} /></div>;
    default:
      return <PhotoBox d={d} className={s.photoHero} />;
  }
}

function Card({ d }: { d: EventViewData }) {
  const { main, second, secondLang } = words(d);
  return (
    <div className={s.cardWrap}>
      <article className={s.card}>
        <BorderArt kind={d.border} />
        <div className={s.cardInner}>
        {d.topLine && <p className={s.topLine} lang="ne">{d.topLine}</p>}
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
        </div>
      </article>
    </div>
  );
}

// The top of the page. A "hero" photo runs edge to edge ABOVE the border, so
// the border frames the words and never sits under the picture.
function Hero({ d, children }: { d: EventViewData; children?: ReactNode }) {
  const kicker = d.sensitive ? "In loving memory" : d.typeLabel;
  if (d.photoStyle === "split") {
    return (
      <header className={s.hero} data-photo="split">
        <div className={`${s.heroBody} ${s.heroBand}`}>
          <BorderArt kind={d.border} className={s.heroArt} />
          <div className={s.splitGrid}>
            <Photo d={d} />
            <div className={s.splitText}>
              <Kicker>{kicker}</Kicker>
              <Headline d={d} as="h1" />
              {children}
            </div>
          </div>
        </div>
      </header>
    );
  }
  const top = d.photoStyle === "hero";
  return (
    <header className={s.hero} data-photo={d.photoStyle}>
      {top && <Photo d={d} />}
      <div className={`${s.heroBody} ${s.heroBand}`}>
        <BorderArt kind={d.border} className={s.heroArt} />
        {d.topLine && <p className={s.topLine} lang="ne">{d.topLine}</p>}
        {!top && <Photo d={d} />}
        <Kicker>{kicker}</Kicker>
        <Headline d={d} as="h1" />
        {children}
      </div>
    </header>
  );
}

function Countdown({ d, now }: { d: EventViewData; now: number }) {
  const days = d.toggles.countdown && d.date ? daysUntil(d.date, d.timezone, now) : null;
  if (days === null || days < 0) return null;
  return (
    <span className={s.count}>
      {days === 0 ? <b>Today</b> : days === 1 ? <b>Tomorrow</b> : <><b>{days}</b> days to go</>}
    </span>
  );
}

function Page({ d, now, a, reply, photos }: { d: EventViewData; now: number; a: boolean; reply?: ReactNode; photos?: ReactNode }) {
  const { main, second, secondLang } = words(d);
  const story = main.landing_page_story.split(/\n\s*\n/).filter((x) => x.trim());
  return (
    <>
      <Hero d={d}>
        <p className={s.when}>{whenLine(d)}</p>
        {d.venueName && <p className={s.where}>{d.venueName}</p>}
        <Countdown d={d} now={now} />
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
      <WhenWhere d={d} a={a} />
      {d.toggles.schedule && d.functions.length > 0 && <RunningOrder d={d} now={now} a={a} />}

      {main.guest_note_box && (
        <section className={s.section}>
          <p className={s.note}>
            <span className={s.noteIcon} aria-hidden="true">i</span>
            <span>
              {main.guest_note_box}
              <Second text={second?.guest_note_box} lang={secondLang} />
            </span>
          </p>
        </section>
      )}

      {d.toggles.rsvp && (
        <section className={`${s.section} ${s.rsvp}`} id={a ? "reply" : undefined}>
          <Title icon="envelope">{d.sensitive ? "Will you attend?" : "Can you come?"}</Title>
          {reply ?? (
            <div className={s.rsvpRow}>
              <span className={s.btn}>{d.sensitive ? "I’ll be there" : "Yes, we’ll come"}</span>
              <span className={`${s.btn} ${s.btnGhost}`}>Maybe</span>
              <span className={`${s.btn} ${s.btnGhost}`}>{d.sensitive ? "I can’t attend" : "Sorry, can’t come"}</span>
            </div>
          )}
        </section>
      )}

      {d.toggles.photo_wall && photos && (
        <section className={s.section} id={a ? "photos" : undefined}>
          <Title icon="camera">{d.sensitive ? "Photos and memories" : "Photos"}</Title>
          {photos}
        </section>
      )}

      {(d.toggles.gift_registry || d.toggles.guestbook) && (
        <section className={s.section}>
          <div className={s.extras}>
            {d.toggles.gift_registry && !d.sensitive && (
              <div className={s.extra}><span className={s.icon} aria-hidden="true"><GiftIcon /></span>
                <span><span className={s.factMain}>Gifts</span><span className={s.factSub}>Details from the family will appear here.</span></span></div>
            )}
            {d.toggles.guestbook && (
              <div className={s.extra}><span className={s.icon} aria-hidden="true"><PenIcon /></span>
                <span>
                  <span className={s.factMain}>{d.sensitive ? "Book of condolence" : "Guestbook"}</span>
                  <span className={s.factSub}>{d.sensitive ? "Share a memory or a message for the family." : `Leave a message for ${d.stars?.names || "the family"}.`}</span>
                </span></div>
            )}
          </div>
        </section>
      )}

      <Footer d={d} />
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

function WhenWhere({ d, a = false }: { d: EventViewData; a?: boolean }) {
  const url = d.toggles.map_directions ? directionsUrl(d) : null;
  return (
    <section className={s.section} id={a ? "where" : undefined}>
      <Title icon="pin">When and where</Title>
      <div className={`${s.facts} ${s.panel}`}>
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
          <a className={`${s.btn} ${s.btnAccent}`} href={url} target="_blank" rel="noreferrer"><PinIcon /> Directions</a>
        </div>
      )}
    </section>
  );
}

// What happens when. A meal shows its menu underneath. On the day, the item
// on now and the one coming next are marked.
function RunningOrder({ d, now, live = false, a = false }: { d: EventViewData; now: number; live?: boolean; a?: boolean }) {
  const ro = runningOrder(d.functions, d.date, now, d.timezone);
  return (
    <section className={s.section} id={a ? "running-order" : undefined}>
      <Title icon="clock">{d.scale === "community" ? "Programme" : "Running order"}</Title>
      <ol className={s.timeline}>
        {ro.items.map((f, i) => {
          const state = live ? (i === ro.current ? "now" : i === ro.next ? "next" : i < ro.current ? "done" : undefined) : undefined;
          return (
            <li key={i} className={s.tItem} data-state={state} data-meal={f.meal ? "" : undefined}>
              <span className={s.tTime}>
                {formatTime(f.time) || "Time to follow"}
                {ro.multiDay && f.date && <span className={s.tDay}>{shortDate(f.date)}</span>}
              </span>
              <span className={s.tDot} aria-hidden="true">{f.meal && <ForkIcon />}</span>
              <span className={s.tBody}>
                {state === "now" && <span className={s.tTag}>On now</span>}
                {state === "next" && <span className={`${s.tTag} ${s.tTagNext}`}>Next</span>}
                <span className={s.tTitle}>{f.title || "To follow"}</span>
                {f.place && <span className={s.factSub}>{f.place}</span>}
                {f.note && <span className={s.tNote}>{f.note}</span>}
                {d.toggles.menu && f.meal && (f.menu?.length ?? 0) > 0 && <MenuCard items={f.menu ?? []} />}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// A menu card, like a printed one. Dishes under the same course are grouped.
function MenuCard({ items }: { items: MenuItem[] }) {
  const groups: { course: string; dishes: string[] }[] = [];
  for (const m of items) {
    if (!m.dish.trim()) continue;
    const last = groups[groups.length - 1];
    if (last && last.course === m.course.trim()) last.dishes.push(m.dish.trim());
    else groups.push({ course: m.course.trim(), dishes: [m.dish.trim()] });
  }
  return (
    <span className={s.menu}>
      <span className={s.menuHead}>Menu</span>
      {groups.map((g, i) => (
        <span key={i} className={s.menuGroup}>
          {g.course && <span className={s.menuCourse}>{g.course}</span>}
          {g.dishes.map((dish, j) => <span key={j} className={s.menuDish}>{dish}</span>)}
        </span>
      ))}
    </span>
  );
}

// "Sat 13 Mar"
function shortDate(date: string): string {
  const [dow, day, month] = formatDate(date, false).split(" ");
  return `${dow.slice(0, 3)} ${day} ${month.slice(0, 3)}`;
}

function Live({ d, now, a, photos, thumb }: { d: EventViewData; now: number; a: boolean; photos?: ReactNode; thumb: boolean }) {
  return (
    <>
      <div className={s.banner}>{d.sensitive ? "Today" : "Happening today"}</div>
      <Hero d={d}>
        <p className={s.when}>{whenLine(d)}</p>
      </Hero>
      {d.toggles.schedule && d.functions.length > 0 && <RunningOrder d={d} now={now} live a={a} />}
      {d.toggles.photo_wall && photos && (
        <section className={s.section} id={a ? "photos" : undefined}>
          <Title icon="camera">{d.sensitive ? "Photos and memories" : "Photos from today"}</Title>
          {photos}
        </section>
      )}
      {d.toggles.photo_wall && !photos && (
        <section className={s.section}>
          <Title icon="camera">{d.sensitive ? "Photos and memories" : "Photos from today"}</Title>
          {thumb ? <Fan d={d} /> : <PreviewWheel d={d} />}
          <span className={`${s.btn} ${s.btnAccent} ${s.btnBig}`}>{d.sensitive ? "Share a photo or memory" : "Add your photos"}</span>
          <div className={s.wall} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div>
          <p className={s.muted}>Preview: guests&apos; photos turn on this wheel, with their comments. Drawn pictures stand in until then, and the button works on the day.</p>
        </section>
      )}
      <WhenWhere d={d} a={a} />
      <Footer d={d} />
    </>
  );
}

function After({ d, a, photos, thumb }: { d: EventViewData; a: boolean; photos?: ReactNode; thumb: boolean }) {
  const { main, second, secondLang } = words(d);
  return (
    <>
      <Hero d={d}>
        <p className={s.body}>
          {main.post_event_thank_you}
          <Second text={second?.post_event_thank_you} lang={secondLang} />
        </p>
      </Hero>
      {d.toggles.photo_wall && photos && (
        <section className={s.section} id={a ? "photos" : undefined}>
          <Title icon="images">{d.sensitive ? "Photos and memories" : "The gallery"}</Title>
          {photos}
        </section>
      )}
      {d.toggles.photo_wall && !photos && (
        <section className={s.section}>
          <Title icon="images">{d.sensitive ? "Photos and memories" : "The gallery"}</Title>
          {thumb ? <Fan d={d} /> : <PreviewWheel d={d} />}
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
    </>
  );
}

// Who's behind the event on the left ("Organised by …", "Hosted by …"), with
// a public event's details under it; a quiet "Made with In2Min2" on the right
// (owner, 16 Nov 2026: the old badge was "too obvious").
function Footer({ d }: { d: EventViewData }) {
  const o = d.organiser;
  const details = o ? [o.typeLabel, o.charityNumber && `Charity ${o.charityNumber}`,
    o.forProfit === null ? "" : o.forProfit ? "Run for profit" : "Not for profit", o.contact].filter(Boolean).join(" · ") : "";
  return (
    <footer className={s.footer}>
      <span className={s.credit}>
        {d.credit && <span>{d.credit.label} <strong>{d.credit.name}</strong></span>}
        {details && <span className={s.creditMore}>{d.credit?.name === o?.name ? details : `${o?.name} · ${details}`}</span>}
      </span>
      {!d.hideBranding && <span className={s.made}>Made with In<b>2</b>Min<b>2</b></span>}
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

function ForkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.2 1.2-3.5 3.8-3.5 7.5V13H17" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5S10.5 4 8 4.5 7 8.5 12 8.5zM12 8.5s1.5-4.5 4-4 1 4-4 4z" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
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
