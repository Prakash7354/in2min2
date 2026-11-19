"use client";

// Your events (owner, 19 Nov 2026: "the same event on my phone and my
// laptop"): every event in the host's account, coming up first, and any kept
// only on this phone. Tapping one opens it; the one open now is kept safe.
// Opened from Home ("Your events"), the You sheet, and the welcome screens.

import { Icon } from "@/components/icons";
import { eventType } from "@/lib/catalog";
import { formatDate, formatTime } from "@/lib/event-view";
import { sortEvents, shelfKey, type MyEvent } from "@/lib/my-events";
import { unpublishedChanges, type Draft } from "@/lib/draft";
import { useB2 } from "./context";
import { TYPE_ART } from "./kinds";

const todayIso = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

type Item = {
  key: string; fromAccount: boolean; title: string; type: string | null; date: string; time: string;
  colour: string | null; cover: string | null; tag: string; tone: "live" | "draft" | "past" | "local"; owner: boolean;
};

export function useEventItems(): { items: Item[]; current: string } {
  const { d, mine } = useB2();
  const today = todayIso();
  const current = shelfKey(d) || "current";
  const onPhone = new Map(mine.shelf.map((s) => [s.key, s.draft]));
  const fromDraft = (x: Draft, key: string): Item => ({
    key, fromAccount: !!x.eventId, title: x.title || eventType(x.eventType)?.label || "Your event", type: x.eventType,
    date: x.date, time: x.startTime, colour: null, cover: x.cover && !x.cover.startsWith("data:") ? x.cover : null,
    tag: x.eventId ? (unpublishedChanges(x) ? "Changes not live yet" : "Live") : "Only on this phone · not published",
    tone: x.eventId ? (unpublishedChanges(x) ? "draft" : "live") : "local", owner: true,
  });
  const fromAccount = (e: MyEvent): Item => {
    // The one open now shows as it is on screen; one kept on this phone, as kept.
    const local = e.id === d.eventId ? d : onPhone.get(e.id);
    if (local) return { ...fromDraft(local, e.id), colour: e.colour, cover: e.cover, owner: e.owner };
    return {
      key: e.id, fromAccount: true, title: e.title, type: e.type, date: e.date, time: e.time, colour: e.colour, cover: e.cover, owner: e.owner,
      tag: e.status === "cancelled" ? "Cancelled" : e.status !== "published" ? "Not published" : e.date < today ? "Past" : "Live",
      tone: e.status === "published" ? (e.date < today ? "past" : "live") : "draft",
    };
  };
  const items: Item[] = [
    ...(mine.list ?? []).map(fromAccount),
    ...mine.shelf.filter((s) => !s.draft.eventId || !(mine.list ?? []).some((e) => e.id === s.key)).map((s) => fromDraft(s.draft, s.key)),
  ];
  // The one open now, if it isn't in the account yet.
  if (d.eventType && !items.some((i) => i.key === current)) items.unshift(fromDraft(d, current));
  return { items: sortEvents(items, today), current };
}

export function EventsBody() {
  const b = useB2();
  const { items, current } = useEventItems();
  const signedIn = !!b.session;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {!signedIn && (
        <div className="b2-note" data-tone="info" style={{ display: "grid", gap: 10 }}>
          <span>Sign in to see the events you’ve made on your other phones and computers.</span>
          <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" style={{ justifySelf: "start" }}
            onClick={() => void b.back().then(() => b.askSignIn("Sign in to see all your events, on any phone or computer.", () => b.openSheet("events")))}>
            <Icon name="lock" className="" />Sign in
          </button>
        </div>
      )}
      {signedIn && b.mine.list === null && !b.mine.error && <p className="b2-small" role="status">Fetching your events…</p>}
      {b.mine.error && <p className="b2-note" data-tone="warn">Your events couldn’t be fetched. Check your signal, then close this and open it again. (Details for Claude Code: {b.mine.error})</p>}

      {items.length > 0 && (
        <ul className="b2-events" aria-label="Your events">
          {items.map((it) => {
            const art = TYPE_ART[it.type ?? ""];
            const open = it.key === current;
            const busy = b.mine.opening === it.key;
            return (
              <li key={it.key}>
                <button type="button" className="b2-row b2-eventrow" data-open={open ? "" : undefined} data-tone={it.tone}
                  disabled={!!b.mine.opening} onClick={() => void b.openEvent(it.key, it.fromAccount)}>
                  <span className="b2-eventpic" style={{ background: it.colour ?? (art ? `linear-gradient(135deg, ${art.from}, ${art.to})` : "var(--b2-s3)") }} aria-hidden="true">
                    {it.cover
                      // eslint-disable-next-line @next/next/no-img-element -- the event's own stored photo, small
                      ? <img src={it.cover} alt="" />
                      : <Icon name={art?.icon ?? "calendar"} className="" />}
                  </span>
                  <span className="b2-grow">
                    <strong>{it.title}</strong>
                    <small>{[it.date ? formatDate(it.date, false) : "Date to be set", it.time && formatTime(it.time)].filter(Boolean).join(" · ")}</small>
                    <span className="b2-eventtags">
                      <span className="b2-eventtag" data-tone={it.tone}>{busy ? "Opening…" : it.tag}</span>
                      {open && <span className="b2-eventtag" data-tone="open">Open now</span>}
                      {!it.owner && <span className="b2-eventtag">Co-host</span>}
                    </span>
                  </span>
                  {!open && <Icon name="next" className="size-5" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {signedIn && b.mine.list !== null && items.length === 0 && <p className="b2-small">No events yet. Your first one will show here once you start it.</p>}

      <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => void b.back().then(b.startAgain)}>
        <Icon name="plus" className="" />Start a new event
      </button>
      <p className="b2-small">Events you’ve published are kept in your account, so they open on any phone or computer once you sign in. One you haven’t published stays on the phone you made it on.</p>
    </div>
  );
}

// On the welcome and "What are you celebrating?" screens: a way back to the
// events already made (signed in), or to sign in and see them.
export function YourEventsRow() {
  const b = useB2();
  const { items } = useEventItems();
  if (!b.session) {
    return (
      <button type="button" className="b2-link" style={{ justifySelf: "start" }}
        onClick={() => b.askSignIn("Sign in to see all your events, on any phone or computer.", () => b.openSheet("events"))}>
        Made one already? Sign in to open it
      </button>
    );
  }
  if (!items.length) return null;
  return (
    <button type="button" className="b2-row" onClick={() => b.openSheet("events")}>
      <span className="b2-ico" style={{ background: "linear-gradient(135deg, #8b7cff, #5e35b1)", color: "#fff" }} aria-hidden="true"><Icon name="list" className="" /></span>
      <span className="b2-grow"><strong>Your events · {items.length}</strong><small>Carry on with one you’ve made</small></span>
      <Icon name="next" className="size-5" />
    </button>
  );
}

// On Home: back to the list, to open another or start a new one.
export function YourEventsChip() {
  const b = useB2();
  const { items } = useEventItems();
  return (
    <button type="button" className="b2-chip b2-chip-sm" style={{ justifySelf: "start" }} onClick={() => b.openSheet("events")}>
      <Icon name="list" className="" />Your events{items.length > 1 ? ` · ${items.length}` : ""}
    </button>
  );
}
