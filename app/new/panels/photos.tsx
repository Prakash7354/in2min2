"use client";

// Guests' photos (0006–0009), for the host: add your own, check new ones,
// favourites, the sky behind the wheel, your photographer's private link,
// and the TV slideshow, TV wheel and printed table cards for the day.
// The same data and rules as the classic builder (app/builder/photos.tsx).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { SKIES, eventType, paletteFor, skyFor } from "@/lib/catalog";
import { photoUrl, wallPath } from "@/lib/photos";
import { copyLink, whatsappUrl } from "@/lib/share";
import { SKY_SWATCH, asked, type HostPhoto, type Photographer, type PhotosState } from "../../builder/photos";
import { useB2 } from "../context";
import { PanelShell } from "../panels";
import { Field, Note, Row, Section, Toggle } from "../ui";

export function PhotosPanel() {
  const b = useB2();
  const { d, photos: state } = b;
  const [picked, setPicked] = useState<HostPhoto | null>(null);
  const [own, setOwn] = useState<{ total: number; done: number } | null>(null);
  const ownInput = useRef<HTMLInputElement>(null);
  const { refresh } = state;
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, on opening

  if (!d.eventId) {
    return (
      <PanelShell icon="images" title="Photos" line="Guests add photos from their phones, with no app. Show them on a TV, and print table cards with a QR code.">
        <Note>Once your page is published, guests’ photos appear here. You can add your own too.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.open("publish")}>Check and publish</button>
      </PanelShell>
    );
  }
  if (!b.session) {
    return (
      <PanelShell icon="images" title="Photos">
        <Note>Sign in to see your guests’ photos.</Note>
        <button type="button" className="b2-btn b2-secondary b2-block" onClick={() => b.askSignIn("Sign in to see your guests' photos.")}>Sign in</button>
      </PanelShell>
    );
  }

  const eventId = d.eventId;
  const rows = state.rows ?? [];
  const w = state.wall;
  const waiting = rows.filter((p) => p.status === "waiting");
  const askedRows = rows.filter(asked);
  const shown = rows.filter((p) => p.status === "shown");
  const hidden = rows.filter((p) => p.status === "hidden" && !asked(p));
  const [, type, slug] = (d.publishedPath ?? "").split("/");
  const origin = window.location.origin;
  const key = w?.isPrivate ? w.wallKey : null;
  const linkTo = (page?: "tv" | "print", style?: "wheel") => (type && slug ? `${origin}${wallPath(type, slug, key, page, style)}` : null);
  const photosLink = linkTo();
  const title = d.title.trim() || "Our event";
  const wallOff = !d.toggles.photo_wall;
  const autoSky = skyFor(paletteFor(d.palette, d.customColor));
  const ownName = d.scale === "community" ? (d.organiserName.trim() || "The organisers") : eventType(d.eventType)?.sensitive ? "The family" : "The hosts";

  async function act(ids: string[], status: HostPhoto["status"], done: string) {
    setPicked(null);
    b.say((await state.setStatus(ids, status)) ? done : "That didn't work. Please try again.");
  }
  async function removeIt(ids: string[]) {
    setPicked(null);
    b.say((await state.removeForGood(ids)) ? (ids.length === 1 ? "Photo removed for good." : `${ids.length} photos removed for good.`) : "Couldn't remove it. Only the owner and co-hosts can.");
  }
  async function addOwn(files: FileList | null) {
    const list = Array.from(files ?? []).slice(0, 50);
    if (!list.length) return;
    setOwn({ total: list.length, done: 0 });
    const r = await state.addOwn(list, ownName, (done) => setOwn({ total: list.length, done }));
    setOwn(null);
    if (ownInput.current) ownInput.current.value = "";
    b.say([r.added ? `${r.added === 1 ? "Your photo is" : `${r.added} photos are`} on the wall.` : null, r.problem].filter(Boolean).join(" ") || "Nothing was added.");
  }

  return (
    <PanelShell icon="images" title="Photos" line="Guests add photos from their phones, with no app.">
      {state.notReady && <Note tone="warn">Photos switch on once the database file 0006 has been run.</Note>}
      {state.error && <Note tone="warn">{state.error}</Note>}
      {wallOff && (
        <button type="button" className="b2-note b2-notebtn" data-tone="warn" onClick={() => b.open("settings")}>
          <span>The photo wall is switched off. Turn on <strong>Photo wall</strong> in Settings, then update your page.</span><Icon name="next" className="size-5" />
        </button>
      )}

      <div className="b2-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {([["On the wall", shown.length], ["Waiting", waiting.length], ["Hidden", hidden.length + askedRows.length]] as const).map(([k, n]) => (
          <div key={k} className="b2-stat"><span className="b2-small">{k}</span><strong>{n}</strong></div>
        ))}
      </div>
      {w && <p className="b2-small">{w.photoLimit !== null ? `${rows.length} of ${w.photoLimit} photos on your plan` : `${rows.length} photos`}{w.perGuest !== null ? `, up to ${w.perGuest} from each phone.` : "."}</p>}

      <input ref={ownInput} type="file" accept="image/*" multiple hidden onChange={(e) => void addOwn(e.target.files)} />
      <button type="button" className="b2-btn b2-primary b2-block" disabled={!!own || wallOff || state.notReady} onClick={() => ownInput.current?.click()}>
        <Icon name="camera" className="" />{own ? `Adding ${Math.min(own.done + 1, own.total)} of ${own.total}…` : "Add your own photos"}
      </button>
      <p className="b2-small" style={{ marginTop: -12 }}>They go straight on the wall as from “{ownName}”, and don’t use up any guest’s share.</p>

      {askedRows.length > 0 && (
        <Section icon="shield" title="Asked to be removed" line="A guest asked for these to come down, so they're hidden.">
          {askedRows.map((p) => (
            <PhotoRow key={p.id} p={p} eventId={eventId} note={p.removal_note ? `“${p.removal_note}”` : "No reason given."}>
              <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={() => void removeIt([p.id])}>Remove for good</button>
              <button type="button" className="b2-chip b2-chip-sm" onClick={() => void act([p.id], "shown", "Shown again. A later request won't hide it.")}>Show again</button>
            </PhotoRow>
          ))}
        </Section>
      )}

      {waiting.length > 0 && (
        <Section icon="clock" title="Waiting for your OK" line="Only you and your co-hosts see these until you show them."
          action={waiting.length > 1 ? <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={() => void act(waiting.map((p) => p.id), "shown", `${waiting.length} photos are on the wall.`)}>Show all</button> : undefined}>
          {waiting.map((p) => (
            <PhotoRow key={p.id} p={p} eventId={eventId}>
              <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={() => void act([p.id], "shown", "On the wall.")}>Show</button>
              <button type="button" className="b2-chip b2-chip-sm" onClick={() => void act([p.id], "hidden", "Hidden.")}>Hide</button>
            </PhotoRow>
          ))}
        </Section>
      )}

      <Section icon="images" title="On the wall" line={shown.length ? "Tap one to make it a favourite (it comes round the wheel more often), hide it or remove it. ♥ shows guests' loves." : "No photos yet. Share the photo link, or put the table cards out."}>
        <Grid photos={shown} eventId={eventId} onPick={setPicked} />
      </Section>
      {hidden.length > 0 && (
        <Section icon="eye" title="Hidden" line="Guests can't see these. Tap one to show it again or remove it for good.">
          <Grid photos={hidden} eventId={eventId} onPick={setPicked} />
        </Section>
      )}

      {w && (
        <Section icon="switches" title="Rules">
          <Toggle label="Check each photo before it shows" line="New photos wait here for your OK. Best for community events and memorials." checked={w.approveFirst}
            onChange={async (v) => b.say((await state.saveRules({ approve_first: v })) ? (v ? "New photos will wait for your OK." : "New photos will show straight away.") : "Couldn't save. Please try again.")} />
          <Toggle label="Let guests add photos before the day" line="For photos through the years, or to try it out. Otherwise photos open at midnight on the day." checked={w.early}
            onChange={async (v) => b.say((await state.saveRules({ early: v })) ? (v ? "Guests can add photos now." : "Photos will open on the day.") : "Couldn't save. Please try again.")} />
        </Section>
      )}

      {photosLink && (
        <Section icon="tv" title="On the day" line={`Run the TV on a laptop plugged into the venue's TV, or a smart TV's browser, and press Full screen.${w?.isPrivate ? " These links carry your event's photo key: share them only at the venue." : ""}`}>
          <Row icon="tv" tone="linear-gradient(135deg, #5e35b1, #22b8cf)" label="TV wheel" line="Photos turning in the sky" href={linkTo("tv", "wheel") ?? undefined} />
          <Row icon="tv" label="TV slideshow" line="One photo at a time, full screen" href={linkTo("tv") ?? undefined} />
          <Row icon="printer" label="Print table cards" line="Four to a page, with a QR code to add photos" href={linkTo("print") ?? undefined} />
          <Row icon="message" tone="#1faa59" label="Send the photo link on WhatsApp" href={whatsappUrl(photosLink, `Add your photos from ${title} here. No app needed:`)} />
          <Row icon="copy" label="Copy the photo link" onClick={async () => b.say((await copyLink(photosLink)) === "copied" ? "Photo link copied." : "Couldn't copy here.")} end={<span />} />
        </Section>
      )}

      {w && (
        <Section icon="star" title="Sky behind the photo wheel" line={`${SKIES.find((k) => k.key === (w.sky || "auto"))?.line}${(w.sky || "auto") === "auto" ? ` (now: ${SKIES.find((k) => k.key === autoSky)?.name})` : ""}`}>
          <div className="b2-palettes" role="radiogroup" aria-label="Sky behind the photo wheel">
            {SKIES.map((k) => (
              <button key={k.key} type="button" role="radio" aria-checked={(w.sky || "auto") === k.key} className="b2-palette"
                onClick={async () => b.say((await state.saveRules({ sky: k.key })) ? `Sky: ${k.name}.` : "Couldn't save. Please try again.")}>
                <span className="b2-palette-sw" style={{ background: SKY_SWATCH[k.key === "auto" ? autoSky : k.key] }} aria-hidden="true" />
                <span>{k.name}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {state.photographers && <Photographers list={state.photographers} rows={rows} state={state} title={title} origin={origin} />}

      {picked && (
        <div className="b2-viewer" role="dialog" aria-modal="true" aria-label="Photo" onClick={() => setPicked(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 photo */}
          <img src={photoUrl(eventId, picked.id, "p")} alt="" />
          <div className="b2-viewerbar" onClick={(e) => e.stopPropagation()}>
            <p className="b2-small" style={{ color: "#ddd" }}>{picked.added_by ? `Added by ${picked.added_by}` : "Added by a guest"}{picked.love_count ? ` · ♥ ${picked.love_count}` : ""}</p>
            <div className="b2-chips">
              {picked.status === "shown" && picked.favourite !== undefined && (
                <button type="button" className="b2-chip b2-chip-sm b2-chip-strong" onClick={async () => {
                  const on = !picked.favourite;
                  setPicked(null);
                  b.say((await state.setFavourite(picked.id, on)) ? (on ? "A favourite: it comes round the wheel more often." : "No longer a favourite.") : "That didn't work. Please try again.");
                }}>{picked.favourite ? "★ Favourite (undo)" : "☆ Make it a favourite"}</button>
              )}
              {picked.status !== "shown" && <button type="button" className="b2-chip b2-chip-sm" onClick={() => void act([picked.id], "shown", "On the wall.")}>Show it</button>}
              {picked.status !== "hidden" && <button type="button" className="b2-chip b2-chip-sm" onClick={() => void act([picked.id], "hidden", "Hidden.")}>Hide it</button>}
              <button type="button" className="b2-chip b2-chip-sm" onClick={() => void removeIt([picked.id])}>Remove for good</button>
              <button type="button" className="b2-chip b2-chip-sm" onClick={() => setPicked(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </PanelShell>
  );
}

function PhotoRow({ p, eventId, note, children }: { p: HostPhoto; eventId: string; note?: string; children: ReactNode }) {
  return (
    <div className="b2-subcard" style={{ gridTemplateColumns: "80px 1fr", alignItems: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- R2 thumbnail */}
      <img src={photoUrl(eventId, p.id, "t")} alt="" className="b2-thumbimg" loading="lazy" />
      <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
        <p style={{ margin: 0 }}><strong>{p.added_by || "A guest"}</strong>{note && <span className="b2-small" style={{ display: "block" }}>{note}</span>}</p>
        <div className="b2-chips">{children}</div>
      </div>
    </div>
  );
}

function Grid({ photos, eventId, onPick }: { photos: HostPhoto[]; eventId: string; onPick: (p: HostPhoto) => void }) {
  if (!photos.length) return null;
  return (
    <div className="b2-grid3">
      {photos.map((p) => (
        <button key={p.id} type="button" onClick={() => onPick(p)} aria-label={`Photo${p.added_by ? ` by ${p.added_by}` : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 thumbnail */}
          <img src={photoUrl(eventId, p.id, "t")} alt="" loading="lazy" />
          {(p.favourite || !!p.love_count) && <span>{p.favourite ? "★ " : ""}{p.love_count ? `♥ ${p.love_count}` : ""}</span>}
        </button>
      ))}
    </div>
  );
}

// The event's photographers (0009): add one, send them their private link,
// switch it off, or remove them. Up to three.
function Photographers({ list, rows, state, title, origin }: { list: Photographer[]; rows: HostPhoto[]; state: PhotosState; title: string; origin: string }) {
  const b = useB2();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", business: "", link: "" });
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!form.name.trim()) { b.say("Please type the photographer's name."); return; }
    setBusy(true);
    const k = await state.addPhotographer(form);
    setBusy(false);
    if (!k) { b.say("Couldn't add them. Only the owner and co-hosts can, up to three."); return; }
    setForm({ name: "", business: "", link: "" });
    setAdding(false);
    b.say("Added. Now send them their link.");
  }
  return (
    <Section icon="camera" title="Your photographer" line="A private link: they add photos with no account, each with their name. Guests see a “Book them” card.">
      {list.map((g) => {
        const link = `${origin}/photographer/${g.upload_key}`;
        const count = rows.filter((p) => p.photographer_id === g.id && p.status !== "hidden").length;
        return (
          <div key={g.id} className="b2-subcard">
            <p style={{ margin: 0 }}><strong>{g.business || g.name}</strong>{g.business ? <span className="b2-small"> · {g.name}</span> : null}</p>
            <p className="b2-small">{count} {count === 1 ? "photo" : "photos"} on the wall{g.active ? "" : " · link switched off"}</p>
            <div className="b2-chips">
              {g.active && (
                <>
                  <a className="b2-chip b2-chip-sm b2-wa" href={whatsappUrl(link, `Here's your link to add your photos of ${title}. No account needed:`)} target="_blank" rel="noreferrer">
                    <Icon name="message" className="" />Send their link
                  </a>
                  <button type="button" className="b2-chip b2-chip-sm" onClick={async () => b.say((await copyLink(link)) === "copied" ? "Photographer link copied." : "Couldn't copy here.")}>
                    <Icon name="copy" className="" />Copy link
                  </button>
                </>
              )}
              <button type="button" className="b2-chip b2-chip-sm" onClick={async () => b.say((await state.changePhotographer(g.id, { active: !g.active })) ? (g.active ? "Link switched off." : "Link switched on.") : "That didn't work.")}>
                {g.active ? "Switch link off" : "Switch link on"}
              </button>
              <button type="button" className="b2-chip b2-chip-sm" onClick={async () => b.say((await state.removePhotographer(g.id)) ? "Removed. Their photos stay, without their name." : "That didn't work.")}>Remove</button>
            </div>
          </div>
        );
      })}
      {adding ? (
        <div style={{ display: "grid", gap: 10 }}>
          <Field label="Their name"><input className="b2-input b2-input-sm" placeholder="e.g. Ram Thapa" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Business name (if any)"><input className="b2-input b2-input-sm" placeholder="e.g. Ram Studio" value={form.business} maxLength={80} onChange={(e) => setForm({ ...form, business: e.target.value })} /></Field>
          <Field label="Website, @instagram or phone" hint="For their “Book them” card."><input className="b2-input b2-input-sm" value={form.link} maxLength={200} onChange={(e) => setForm({ ...form, link: e.target.value })} /></Field>
          <div className="b2-chips">
            <button type="button" className="b2-chip b2-chip-strong" disabled={busy} onClick={() => void add()}>{busy ? "Adding…" : "Add photographer"}</button>
            <button type="button" className="b2-chip" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : list.length < 3 && (
        <button type="button" className="b2-btn b2-secondary" onClick={() => setAdding(true)}><Icon name="plus" className="" />{list.length ? "Add another photographer" : "Add your photographer"}</button>
      )}
    </Section>
  );
}
