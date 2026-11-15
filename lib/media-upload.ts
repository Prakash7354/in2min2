"use client";

// After publishing: keep the main photo, and make the preview picture that
// WhatsApp, Messenger and iMessage show when the link is pasted (1200 × 630).
// The picture is drawn on the host's own phone or computer (no server cost,
// CONCEPT 11), in the event's colours and fonts, then both go to the event's
// own folder in Supabase Storage (0005). Only redone when something it shows
// has changed.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Draft } from "@/lib/draft";
import { toViewData } from "@/lib/draft";
import { formatDate, formatTime, monogram, type EventViewData } from "@/lib/event-view";
import { MEDIA_BUCKET } from "@/lib/media";

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => (b % 36).toString(36)).join("");

// The fonts the preview is using, as the browser resolved them.
function fontOf(selector: string, fallback: string): string {
  const el = document.querySelector(selector);
  return el ? getComputedStyle(el).fontFamily || fallback : fallback;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fail(new Error("image"));
    img.src = src;
  });
}

// Words wrapped to fit a width, shrinking the size until they fit in `lines`.
function fitText(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, maxW: number, start: number, min: number, lines: number) {
  for (let px = start; px >= min; px -= 2) {
    ctx.font = font(px);
    const words = text.split(/\s+/);
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width <= maxW) cur = next;
      else { if (cur) out.push(cur); cur = w; }
    }
    if (cur) out.push(cur);
    if (out.length <= lines && out.every((l) => ctx.measureText(l).width <= maxW)) return { px, lines: out };
  }
  ctx.font = font(min);
  return { px: min, lines: [text.slice(0, 40)] };
}

export async function drawShareImage(v: EventViewData): Promise<Blob | null> {
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const p = v.palette;
  const display = fontOf(".ev-root .ev-headline", "Georgia, serif");
  const body = fontOf(".ev-root", "system-ui, sans-serif");
  try {
    await document.fonts.ready;
    await Promise.all([document.fonts.load(`700 72px ${display}`), document.fonts.load(`600 30px ${body}`)]);
  } catch { /* fall back to whatever is loaded */ }

  // Background and a band of the event's party colours along the top.
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  const party = p.party ?? [p.main, p.accent, p.main, p.accent, p.main];
  party.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect((W / party.length) * i, 0, W / party.length + 1, 14); });

  // The photo on the left, or the initials on the event's colour.
  const PW = 500, PY = 14, PH = H - 14;
  if (v.cover) {
    try {
      const img = await loadImage(v.cover);
      const cover = (iw: number, ih: number, bw: number, bh: number) => { const s = Math.max(bw / iw, bh / ih); return { w: iw * s, h: ih * s }; };
      const contain = (iw: number, ih: number, bw: number, bh: number) => { const s = Math.min(bw / iw, bh / ih); return { w: iw * s, h: ih * s }; };
      ctx.save();
      ctx.beginPath(); ctx.rect(0, PY, PW, PH); ctx.clip();
      const c = cover(img.width, img.height, PW, PH);
      if (v.coverFit === "whole") {
        ctx.filter = "blur(22px) saturate(1.1)";
        ctx.drawImage(img, (PW - c.w) / 2, PY + (PH - c.h) / 2, c.w, c.h);
        ctx.filter = "none";
        const w = contain(img.width, img.height, PW - 40, PH - 40);
        ctx.drawImage(img, (PW - w.w) / 2, PY + (PH - w.h) / 2, w.w, w.h);
      } else {
        ctx.drawImage(img, (PW - c.w) / 2, PY + (PH - c.h) / 2, c.w, c.h);
      }
      ctx.restore();
    } catch { /* no photo: the initials below */ }
  }
  if (!v.cover) {
    ctx.fillStyle = p.main;
    ctx.fillRect(0, PY, PW, PH);
    ctx.fillStyle = p.onMain;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 150px ${display}`;
    ctx.fillText(monogram((v.scale === "community" ? v.title : v.stars?.names) || v.title || v.typeLabel) || "★", PW / 2, PY + PH / 2);
  }

  // The words on the right.
  const X = PW + 56, MAXW = W - X - 56;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let y = 112;
  ctx.fillStyle = p.dark ? p.accent : p.main;
  ctx.font = `700 26px ${body}`;
  const kicker = (v.sensitive ? "In loving memory" : v.scale === "community" ? v.typeLabel : "You’re invited").toUpperCase();
  ctx.fillText(kicker, X, y);
  y += 26;
  const headline = (v.copy.card_headline || v.title || v.typeLabel).trim();
  const fit = fitText(ctx, headline, (px) => `700 ${px}px ${display}`, MAXW, 76, 40, 3);
  ctx.fillStyle = p.dark ? p.ink : p.main;
  for (const line of fit.lines) { y += fit.px * 1.12; ctx.fillText(line, X, y); }
  y += 30;
  ctx.fillStyle = p.accent;
  ctx.fillRect(X, y, 72, 6);
  y += 54;
  ctx.fillStyle = p.ink;
  ctx.font = `600 32px ${body}`;
  const when = [v.date && formatDate(v.date), formatTime(v.startTime)].filter(Boolean).join(" · ");
  if (when) { ctx.fillText(fitText(ctx, when, (px) => `600 ${px}px ${body}`, MAXW, 32, 22, 1).lines[0], X, y); y += 46; }
  if (v.venueName) {
    ctx.fillStyle = p.muted;
    ctx.fillText(fitText(ctx, v.venueName, (px) => `500 ${px}px ${body}`, MAXW, 28, 20, 1).lines[0], X, y);
  }
  ctx.fillStyle = p.muted;
  ctx.font = `600 24px ${body}`;
  ctx.fillText("Made with In2Min2", X, H - 44);

  return new Promise((ok) => canvas.toBlob((b) => ok(b), "image/jpeg", 0.86));
}

export type MediaResult =
  | { ok: true; coverKey: string | null; shareKey: string | null; mediaHash: string; heroKeys: string[]; heroHash: string; heroNote: string | null }
  | { ok: false; message: string };

export async function saveMedia(sb: SupabaseClient, d: Draft, eventId: string): Promise<MediaResult> {
  const v = toViewData(d);
  const coverHash = d.cover ? djb2(d.cover) : "none";
  const shows = djb2(JSON.stringify([coverHash, v.coverFit, v.title, v.copy.card_headline, v.date, v.startTime, v.venueName, d.palette, d.customColor, d.textStyle, v.typeLabel, v.scale]));
  const store = sb.storage.from(MEDIA_BUCKET);
  if (d.mediaHash === shows && d.shareKey && d.shareKey.startsWith(eventId)) {
    const hero = await saveShowcase(sb, d, eventId, d.coverKey ?? null);
    return { ok: true, coverKey: d.coverKey ?? null, shareKey: d.shareKey, mediaHash: shows, ...hero };
  }

  const old = [d.coverKey, d.shareKey].filter((k): k is string => !!k && k.startsWith(eventId));
  let coverKey: string | null = d.coverKey && d.coverKey.startsWith(eventId) ? d.coverKey : null;

  // 1. The main photo, if it changed.
  const coverChanged = !coverKey || !coverKey.includes(`/cover-${coverHash.slice(0, 6)}`);
  if (!d.cover) coverKey = null;
  else if (coverChanged) {
    const blob = await (await fetch(d.cover)).blob();
    const key = `${eventId}/cover-${coverHash.slice(0, 6)}${rand()}.jpg`;
    const up = await store.upload(key, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
    if (up.error) return { ok: false, message: up.error.message };
    coverKey = key;
  }

  // 2. The preview picture.
  const pic = await drawShareImage({ ...v, cover: d.cover });
  if (!pic) return { ok: false, message: "This browser couldn't draw the preview picture." };
  const shareKey = `${eventId}/share-${rand()}${rand()}.jpg`;
  const up = await store.upload(shareKey, pic, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (up.error) return { ok: false, message: up.error.message };

  // 3. Point the event at them, then tidy away the old files.
  const r = await sb.from("events").update({ cover_image_key: coverKey, share_image_key: shareKey }).eq("id", eventId);
  if (r.error) return { ok: false, message: `${r.error.code ?? ""} ${r.error.message}` };
  const gone = old.filter((k) => k !== coverKey && k !== shareKey && !(d.heroKeys ?? []).includes(k));
  if (gone.length) await store.remove(gone);
  const hero = await saveShowcase(sb, d, eventId, coverKey);
  return { ok: true, coverKey, shareKey, mediaHash: shows, ...hero };
}

// The up-to-four more photos at the top of the page, and how they change
// (0007). A photo already stored is kept (its name starts with its content's
// fingerprint); new ones are uploaded; ones taken out are deleted. Saved
// separately from the main photo, so a problem here never stops publishing.
async function saveShowcase(sb: SupabaseClient, d: Draft, eventId: string, coverKey: string | null): Promise<{ heroKeys: string[]; heroHash: string; heroNote: string | null }> {
  const more = d.cover ? (d.moreCovers ?? []).slice(0, 4) : [];
  const hashes = more.map((u) => djb2(u));
  const heroHash = djb2(JSON.stringify([hashes, d.heroMotion ?? "zoomin"]));
  const had = (d.heroKeys ?? []).filter((k) => k.startsWith(eventId));
  if (d.heroHash === heroHash) return { heroKeys: had, heroHash, heroNote: null };

  const store = sb.storage.from(MEDIA_BUCKET);
  const keys: string[] = [];
  for (let i = 0; i < more.length; i++) {
    const same = had.find((k) => k.includes(`/cover-${hashes[i].slice(0, 6)}`) && !keys.includes(k));
    if (same) { keys.push(same); continue; }
    const blob = await (await fetch(more[i])).blob();
    const key = `${eventId}/cover-${hashes[i].slice(0, 6)}${rand()}.jpg`;
    const up = await store.upload(key, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
    if (up.error) return { heroKeys: had, heroHash: d.heroHash ?? "", heroNote: up.error.message };
    keys.push(key);
  }
  let r = await sb.from("events").update({ hero_keys: keys, hero_motion: d.heroMotion ?? "zoomin" }).eq("id", eventId);
  // Before 0008 has run, the database knows only the old names.
  if (r.error?.code === "23514") {
    r = await sb.from("events").update({ hero_keys: keys, hero_motion: d.heroMotion === "zoomout" ? "zoom" : d.heroMotion === "slide" ? "slide" : "fade" }).eq("id", eventId);
  }
  if (r.error) {
    if (keys.length) await store.remove(keys.filter((k) => !had.includes(k)));
    return { heroKeys: had, heroHash: d.heroHash ?? "", heroNote: `${r.error.code ?? ""} ${r.error.message}` };
  }
  const gone = had.filter((k) => !keys.includes(k) && k !== coverKey);
  if (gone.length) await store.remove(gone);
  return { heroKeys: keys, heroHash, heroNote: null };
}
