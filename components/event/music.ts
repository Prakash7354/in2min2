"use client";

// Plays an event's music (catalog MUSIC), round and round, after a tap.
//
// Phones only allow sound after the person taps, so start() must be called
// from inside a tap (the envelope, the music button, or the builder's Listen).
// It uses Web Audio rather than an <audio> tag: our files are served without
// "byte ranges", which iPhones need for <audio>; Web Audio also repeats with
// no gap and can fade in and out. The tune loads after the tap (about 1 MB)
// and fades in, usually within a second. One tune at a time on a page.
//
// The sound pauses when the guest switches to another app or tab, and comes
// back when they return (unless they turned it off).

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { musicOf, type Track } from "@/lib/catalog";

export type MusicState = "off" | "loading" | "on" | "muted" | "failed";
const VOLUME = 0.7;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let current: string | null = null;    // the track key playing (or loading)
let state: MusicState = "off";
const buffers = new Map<string, Promise<AudioBuffer>>();
const listeners = new Set<() => void>();

function set(s: MusicState) {
  state = s;
  listeners.forEach((l) => l());
}

function audio(): { ctx: AudioContext; gain: GainNode } | null {
  if (ctx && gain) return { ctx, gain };
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  // On iPhones, play like a video does, even with the ring switch on silent
  // (Safari 17+); the guest has just tapped to open it, and can turn it off.
  try { (navigator as unknown as { audioSession?: { type: string } }).audioSession!.type = "playback"; } catch { /* older phones */ }
  ctx = new AC();
  gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (state === "on") void ctx.resume();
  });
  return { ctx, gain };
}

function load(t: Track, c: AudioContext): Promise<AudioBuffer> {
  let p = buffers.get(t.key);
  if (!p) {
    p = fetch(t.file).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`music ${r.status}`))))
      // The callback form works on older iPhones too.
      .then((b) => new Promise<AudioBuffer>((ok, bad) => { c.decodeAudioData(b, ok, bad)?.catch(bad); }));
    p.catch(() => buffers.delete(t.key));
    buffers.set(t.key, p);
  }
  return p;
}

function fade(to: number, seconds: number) {
  if (!ctx || !gain) return;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(to, now + seconds);
}

// Call from inside a tap.
export function startMusic(key: string) {
  const t = musicOf(key);
  const a = t && audio();
  if (!t || !a) { set("failed"); return; }
  void a.ctx.resume();
  if (current === key && source) { fade(VOLUME, 0.6); set("on"); return; }
  stopMusic();
  current = key;
  set("loading");
  load(t, a.ctx).then((buf) => {
    if (current !== key) return;
    const s = a.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.loopStart = t.loop[0];
    s.loopEnd = Math.min(t.loop[1], buf.duration);
    s.connect(a.gain);
    a.gain.gain.setValueAtTime(0, a.ctx.currentTime);
    s.start(0, t.loop[0]);
    source = s;
    fade(VOLUME, 2.5);
    set("on");
  }).catch(() => { if (current === key) { current = null; set("failed"); } });
}

export function muteMusic() {
  if (state === "loading") { stopMusic(); return; }
  if (state !== "on") return;
  fade(0, 0.4);
  set("muted");
  // Rest the sound system (and the battery) once it's faded out.
  window.setTimeout(() => { if (state === "muted") void ctx?.suspend(); }, 500);
}

export function stopMusic() {
  try { source?.stop(); } catch { /* already stopped */ }
  source?.disconnect();
  source = null;
  current = null;
  if (state !== "off") set("off");
}

// const m = useMusic("happy_birthday"): m.state, m.start() (in a tap), m.toggle() (in a tap).
export function useMusic(key: string | null) {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => (key && current === key ? state : state === "failed" && !current ? "failed" : "off"),
    () => "off" as MusicState,
  );
  const start = useCallback(() => { if (key) startMusic(key); }, [key]);
  const toggle = useCallback(() => {
    if (!key) return;
    if (s === "on" || s === "loading") muteMusic(); else startMusic(key);
  }, [key, s]);
  return { state: s, start, toggle };
}

// The builder's "Listen": stops when the panel closes.
export function useStopOnLeave() {
  useEffect(() => () => stopMusic(), []);
}
