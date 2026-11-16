"use client";

// The look: swipe through complete looks, or fine-tune one part at a time
// (photos, colours, border, letters, and the rest), each shown on the
// host's own card. Suggestions for this kind of event come first.

import { useEffect, useRef, useState } from "react";
import EventView from "@/components/event/event-view";
import { Icon } from "@/components/icons";
import {
  BORDERS, COVER_FITS, EFFECTS, HERO_MOTIONS, MAX_SHOWCASE, PALETTE_FAMILIES, PALETTES, PHOTO_STYLES, TEMPLATES, TEXT_STYLES,
  eventType, language, type CoverFit, type EffectKey, type HeroMotion, type PhotoStyle, type Template, type TextStyle,
} from "@/lib/catalog";
import { toViewData } from "@/lib/draft";
import { resizePhoto } from "@/lib/image";
import { useB2 } from "../context";
import { applyLook, currentLook, looksFor } from "../kinds";
import { PanelShell } from "../panels";
import { Chips, Note, Section, Toggle } from "../ui";

type Tab = "looks" | "photos" | "colours" | "border" | "letters" | "more";
const TABS: { key: Tab; label: string }[] = [
  { key: "looks", label: "Looks" }, { key: "photos", label: "Photos" }, { key: "colours", label: "Colours" },
  { key: "border", label: "Border" }, { key: "letters", label: "Letters" }, { key: "more", label: "More" },
];

export function LookPanel() {
  const { d, now } = useB2();
  const [tab, setTab] = useState<Tab>("looks");
  const tabs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabs.current?.querySelector('[aria-checked="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [tab]);
  return (
    <PanelShell icon="palette" title="The look" line="Swipe a complete look, or change one thing at a time.">
      <div className="b2-tabs" ref={tabs}>
        <Chips label="Which part" small value={tab} options={TABS} onChange={(t) => t && setTab(t)} />
      </div>
      {tab !== "looks" && (
        <div className="b2-stage" style={{ padding: 0 }}>
          <div className="b2-float b2-mini" style={{ animation: "none" }}><EventView data={toViewData(d)} view="card" now={now} thumb /></div>
        </div>
      )}
      {tab === "looks" && <Looks />}
      {tab === "photos" && <Photos />}
      {tab === "colours" && <Colours />}
      {tab === "border" && <Borders />}
      {tab === "letters" && <Letters />}
      {tab === "more" && <More />}
    </PanelShell>
  );
}

function Looks() {
  const { d, update, now, say } = useB2();
  const looks = looksFor(d.eventType);
  const on = currentLook(d);
  const [active, setActive] = useState(() => Math.max(0, looks.findIndex((l) => l.key === on)));
  const deck = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = deck.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const w = card ? card.offsetWidth + 16 : el.clientWidth;
    setActive(Math.max(0, Math.min(looks.length - 1, Math.round(el.scrollLeft / w))));
  };
  const use = (i: number) => { update((x) => applyLook(x, looks[i])); say(`Look: ${looks[i].name}.`); };
  return (
    <>
      <div className="b2-deck" ref={deck} onScroll={onScroll}>
        {looks.map((l, i) => (
          <button key={l.key} type="button" className="b2-look" data-active={i === active ? "" : undefined}
            onClick={() => (i === active ? use(i) : (deck.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }))}
            aria-label={`${l.name}${l.key === on ? " (in use)" : i === active ? ", use this look" : ""}`}>
            <div className="b2-look-card"><EventView data={toViewData(applyLook(d, l))} view="card" now={now} thumb /></div>
            <p>{l.key === on ? "✓ " : ""}{l.name}</p>
          </button>
        ))}
      </div>
      <div className="b2-dots" aria-hidden="true">{looks.map((l, i) => <i key={l.key} data-on={i === active ? "" : undefined} />)}</div>
      <button type="button" className="b2-btn b2-secondary b2-block" disabled={looks[active]?.key === on} onClick={() => use(active)}>
        {looks[active]?.key === on ? "In use" : `Use “${looks[active]?.name}”`}
      </button>
    </>
  );
}

function Photos() {
  const { d, update } = useB2();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const more = d.moreCovers ?? [];
  const room = MAX_SHOWCASE - 1 - more.length;
  async function pickMain(file: File | undefined) {
    if (!file) return;
    setBusy(true); setProblem(null);
    try {
      const r = await resizePhoto(file);
      const fit: CoverFit = r.width / r.height >= 1.25 ? "fill" : "whole";
      update((x) => ({ ...x, cover: r.url, coverFit: fit }));
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "That photo couldn't be used. Try another.");
    } finally { setBusy(false); }
  }
  // Up to four more photos that take turns at the top (0007), a little smaller
  // than the main one so the draft fits in the phone's storage.
  async function addMore(files: FileList | null) {
    const list = Array.from(files ?? []).slice(0, room);
    if (!list.length) return;
    setBusy(true); setProblem(null);
    const urls: string[] = [];
    for (const f of list) {
      try { urls.push((await resizePhoto(f, 1080, 0.75)).url); } catch { setProblem("One photo couldn't be used. Try another."); }
    }
    update((x) => ({ ...x, moreCovers: [...(x.moreCovers ?? []), ...urls].slice(0, MAX_SHOWCASE - 1) }));
    setBusy(false);
  }
  const makeMain = (i: number) => update((x) => {
    if (!x.cover) return x;
    const rest = [...(x.moreCovers ?? [])];
    const [picked] = rest.splice(i, 1, x.cover);
    return { ...x, cover: picked, moreCovers: rest };
  });
  return (
    <>
      <Section icon="camera" title="Photos at the top" line="Your main photo, and up to four more that take turns. Made smaller on your phone, with the hidden location removed.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label className="b2-btn b2-secondary" style={{ cursor: "pointer" }}>
            <Icon name="camera" className="" />{busy ? "Preparing…" : d.cover ? "Change main photo" : "Choose a photo"}
            <input type="file" accept="image/*" hidden onChange={(e) => { void pickMain(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {d.cover && (
            <button type="button" className="b2-btn b2-quiet" onClick={() => update((x) => { const [next, ...rest] = x.moreCovers ?? []; return { ...x, cover: next ?? null, moreCovers: rest }; })}>
              Remove
            </button>
          )}
        </div>
        {problem && <Note tone="warn">{problem}</Note>}
        {d.cover && (
          <>
            <p className="b2-label">More photos ({more.length} of {MAX_SHOWCASE - 1})</p>
            <div className="b2-thumbs">
              {more.map((src, i) => (
                <div key={i} className="b2-thumbcell">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local data: URL */}
                  <img src={src} alt={`Photo ${i + 2}`} />
                  <span style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="b2-chip b2-chip-sm" onClick={() => makeMain(i)}>Main</button>
                    <button type="button" className="b2-round b2-round-sm" aria-label={`Remove photo ${i + 2}`}
                      onClick={() => update((x) => ({ ...x, moreCovers: (x.moreCovers ?? []).filter((_, j) => j !== i) }))}><Icon name="close" className="" /></button>
                  </span>
                </div>
              ))}
              {room > 0 && (
                <label className="b2-thumbadd">
                  <Icon name="plus" className="" /><span>Add photos</span>
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => { void addMore(e.target.files); e.target.value = ""; }} />
                </label>
              )}
            </div>
            {more.length > 0 && d.photoStyle === "polaroid" && <p className="b2-small">With the Polaroids photo style, your first three photos show as a still stack.</p>}
            {more.length > 0 && d.photoStyle !== "polaroid" && (
              <div className="b2-field">
                <span className="b2-label">How they change</span>
                <Chips label="How the photos change" small value={d.heroMotion ?? "zoomin"} options={HERO_MOTIONS.map((m) => ({ key: m.key, label: m.name }))}
                  onChange={(k) => k && update((x) => ({ ...x, heroMotion: k as HeroMotion }))} />
                {!d.motion && <Note tone="warn">Turn on <strong>Gentle movement</strong> (under More) to show them all. Until then, only the main photo shows.</Note>}
              </div>
            )}
            <div className="b2-field">
              <span className="b2-label">How they fit</span>
              <Chips label="How the photo fits" small value={d.coverFit} options={COVER_FITS.map((f) => ({ key: f.key, label: f.name }))}
                onChange={(k) => k && update((x) => ({ ...x, coverFit: k as CoverFit }))} />
            </div>
          </>
        )}
      </Section>
      <Section icon="image" title="Photo style">
        <Chips label="Photo style" small value={d.photoStyle} options={PHOTO_STYLES.map((p) => ({ key: p.key, label: p.name }))}
          onChange={(k) => k && update((x) => ({ ...x, photoStyle: k as PhotoStyle }))} />
        <p className="b2-small">{PHOTO_STYLES.find((p) => p.key === d.photoStyle)?.line}</p>
      </Section>
    </>
  );
}

function Colours() {
  const { d, update } = useB2();
  const [all, setAll] = useState(false);
  const t = eventType(d.eventType);
  // Suggested: this kind's own colours, those in its looks, and the popular ones.
  const picks = [...new Set([t?.palette, ...looksFor(d.eventType).map((l) => l.palette), ...PALETTES.filter((p) => p.tag === "popular").map((p) => p.key), d.palette])]
    .filter(Boolean).slice(0, 9) as string[];
  const swatch = (key: string) => {
    const p = PALETTES.find((x) => x.key === key);
    if (!p) return null;
    return (
      <button key={p.key} type="button" role="radio" aria-checked={d.palette === p.key} className="b2-palette" onClick={() => update((x) => ({ ...x, palette: p.key }))}>
        <span className="b2-palette-sw" style={{ background: p.gradient ?? `linear-gradient(135deg, ${p.main} 0 50%, ${p.accent} 50% 75%, ${p.soft} 75%)` }} aria-hidden="true" />
        <span>{p.name}</span>
      </button>
    );
  };
  return (
    <Section icon="palette" title="Colours" line="Every set is checked so the words stay easy to read.">
      {!all ? (
        <div className="b2-palettes" role="radiogroup" aria-label="Suggested colours">{picks.map(swatch)}</div>
      ) : PALETTE_FAMILIES.map((family) => (
        <div key={family} style={{ display: "grid", gap: 8 }}>
          <p className="b2-kicker">{family === "In2Min2" ? "In2Min2 colours" : family}</p>
          <div className="b2-palettes" role="radiogroup" aria-label={`${family} colours`}>{PALETTES.filter((p) => p.family === family).map((p) => swatch(p.key))}</div>
        </div>
      ))}
      <label className="b2-row" style={{ cursor: "pointer" }}>
        <span className="b2-ico" style={{ background: d.customColor }} aria-hidden="true" />
        <span className="b2-grow"><strong>Your own colour{d.palette === "custom" ? " ✓" : ""}</strong><small>The text colour is picked for you</small></span>
        <input type="color" value={d.customColor} aria-label="Your own colour" className="b2-colour"
          onChange={(e) => update((x) => ({ ...x, customColor: e.target.value, palette: "custom" }))} onClick={() => update((x) => ({ ...x, palette: "custom" }))} />
      </label>
      <button type="button" className="b2-btn b2-quiet" onClick={() => setAll((v) => !v)}>{all ? "Show only the suggestions" : `Show all ${PALETTES.length} colour sets`}</button>
    </Section>
  );
}

function Borders() {
  const { d, update, now } = useB2();
  const [all, setAll] = useState(false);
  const t = eventType(d.eventType);
  const suggested = t?.borders ?? ["none"];
  const shown = all ? BORDERS : BORDERS.filter((b) => suggested.includes(b.key) || b.key === d.border)
    .sort((a, b) => suggested.indexOf(a.key) - suggested.indexOf(b.key));
  const data = toViewData(d);
  return (
    <Section icon="frame" title="Border" line={all ? "Every border takes your colours." : `Suggested for ${t ? t.label.toLowerCase() : "your event"}. Each takes your colours.`}>
      <div className="b2-cardgrid" role="radiogroup" aria-label="Border">
        {shown.map((b) => (
          <button key={b.key} type="button" role="radio" aria-checked={d.border === b.key} className="b2-cardpick" onClick={() => update((x) => ({ ...x, border: b.key }))}>
            <span className="b2-cardpick-view" aria-hidden="true"><EventView data={{ ...data, border: b.key }} view="card" now={now} thumb /></span>
            <span>{b.name}</span>
          </button>
        ))}
      </div>
      <button type="button" className="b2-btn b2-quiet" onClick={() => setAll((v) => !v)}>{all ? "Show only the suggestions" : `Show all ${BORDERS.length} borders`}</button>
    </Section>
  );
}

function Letters() {
  const { d, update } = useB2();
  const t = eventType(d.eventType);
  const script = d.languages.map((c) => language(c)?.sample).find((x) => x && x !== "Aa" && x !== "Ąa");
  return (
    <>
      <Section icon="type" title="Letters" line="Each style has matching letters for Nepali, Hindi, Punjabi, Gujarati, Bengali and Tamil.">
        <div className="b2-cardgrid" role="radiogroup" aria-label="Letters">
          {TEXT_STYLES.map((ts) => (
            <button key={ts.key} type="button" role="radio" aria-checked={d.textStyle === ts.key} className="b2-cardpick b2-fontpick"
              onClick={() => update((x) => ({ ...x, textStyle: ts.key as TextStyle }))}>
              <span style={{ fontFamily: ts.display, fontStyle: ts.key === "elegant" ? "italic" : undefined, textTransform: ts.key === "bold" ? "uppercase" : undefined }} aria-hidden="true">
                {(d.title || t?.label || "Our event").slice(0, 22)}
              </span>
              <span style={{ fontFamily: ts.display, fontSize: 18, opacity: 0.8 }} aria-hidden="true">Aa {script ?? "अ"}</span>
              <span>{ts.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section icon="layout" title="Layout">
        <Chips label="Layout" small value={d.template} options={TEMPLATES.map((x) => ({ key: x.key, label: x.name }))}
          onChange={(k) => k && update((x) => ({ ...x, template: k as Template }))} />
        <p className="b2-small">{TEMPLATES.find((x) => x.key === d.template)?.line}</p>
      </Section>
    </>
  );
}

function More() {
  const { d, update } = useB2();
  const sensitive = !!eventType(d.eventType)?.sensitive;
  return (
    <Section icon="sparkle" title="Movement">
      <Toggle label="Gentle movement" line="A slow zoom on the photo and a few small moments. Phones set to reduce motion never see it."
        checked={d.motion} onChange={(v) => update((x) => ({ ...x, motion: v }))} />
      {d.motion && !sensitive && (
        <div className="b2-field">
          <span className="b2-label">Moving effect</span>
          <Chips label="Moving effect" small value={d.effect} options={EFFECTS.map((f) => ({ key: f.key, label: f.name }))}
            onChange={(k) => k && update((x) => ({ ...x, effect: k as EffectKey }))} />
          <span className="b2-small">{EFFECTS.find((f) => f.key === d.effect)?.line}. It falls over the top of the page for about half a minute; see it in the full-screen preview.</span>
        </div>
      )}
    </Section>
  );
}

