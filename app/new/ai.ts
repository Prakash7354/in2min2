"use client";

// Builder 2.0's calls to the AI writer (POST /api/generate-copy): all five
// boxes at once, or one box made shorter, warmer, more formal or more fun.
// Signed-in hosts only, 20 AI writes a day (take_ai_write, 0002).
//
// The words come back as they're written (one JSON line per piece), and
// `onPartial` gets each box so far, so the host watches them appear instead
// of waiting. If nothing arrives for 20 seconds, or it takes over a minute,
// it stops and says so, rather than showing "Writing…" for ever.

import { COPY_KEYS, type Adjustment, type CopyKey, type EventCopy } from "@/lib/ai/copy";
import { copyRequest } from "@/lib/ai/request";
import type { Draft } from "@/lib/draft";
import { supabase } from "@/lib/supabase/client";

export type AiResult =
  | { ok: true; copy: Partial<EventCopy>; translation?: Partial<EventCopy>; trimmed: boolean }
  | { ok: false; signIn?: boolean; message: string };

type Boxes = Partial<EventCopy>;
const QUIET_MS = 20_000;
const LONGEST_MS = 60_000;

// The boxes written so far, from the unfinished JSON: each key's string up to
// where the writing has got. The main boxes come first, then "translation".
function unescape(s: string): string {
  const safe = s.replace(/\\(u[0-9a-fA-F]{0,3})?$/, "");
  try { return JSON.parse(`"${safe}"`) as string; } catch { return safe; }
}
export function partialBoxes(raw: string, keys: readonly CopyKey[]): { copy: Boxes; translation?: Boxes } {
  const at = raw.indexOf('"translation"');
  const grab = (src: string): Boxes => {
    const out: Boxes = {};
    for (const k of keys) {
      const m = new RegExp(`"${k}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`).exec(src);
      if (m) out[k] = unescape(m[1]);
    }
    return out;
  };
  return at < 0 ? { copy: grab(raw) } : { copy: grab(raw.slice(0, at)), translation: grab(raw.slice(at)) };
}

export async function aiWrite(d: Draft, one?: { key: CopyKey; adjust: Adjustment }, onPartial?: (copy: Boxes, translation?: Boxes) => void): Promise<AiResult> {
  // The token is read fresh, so this also works straight after signing in.
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, signIn: true, message: "Sign in (free) and the AI will write your words." };
  const current = one ? d.copy[one.key].trim().slice(0, 440) : "";
  const body = { ...copyRequest(d), ...(one ? { only: one.key, adjust: one.adjust, ...(current ? { current } : {}) } : {}) };
  const keys = one ? [one.key] : COPY_KEYS;
  const stop = new AbortController();
  let why: "quiet" | "long" | null = null;
  let quiet = window.setTimeout(() => { why = "quiet"; stop.abort(); }, QUIET_MS);
  const longest = window.setTimeout(() => { why = "long"; stop.abort(); }, LONGEST_MS);
  const heard = () => { window.clearTimeout(quiet); quiet = window.setTimeout(() => { why = "quiet"; stop.abort(); }, QUIET_MS); };
  try {
    const res = await fetch("/api/generate-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/x-ndjson, application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: stop.signal,
    });
    heard();
    const pick = (src: Record<string, unknown>) => Object.fromEntries(keys.map((k) => [k, typeof src[k] === "string" ? (src[k] as string) : ""])) as Boxes;

    // The words as they're written.
    if (res.ok && res.body && res.headers.get("content-type")?.includes("ndjson")) {
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let all = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        heard();
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const msg = JSON.parse(line) as { t?: string; done?: Record<string, unknown> & { translation?: Boxes }; trimmed?: string[]; error?: string };
          if (msg.error) return { ok: false, message: msg.error };
          if (msg.done) return { ok: true, copy: pick(msg.done), translation: msg.done.translation, trimmed: !!msg.trimmed?.length };
          if (msg.t) {
            all += msg.t;
            if (onPartial) { const p = partialBoxes(all, keys); onPartial(p.copy, p.translation); }
          }
        }
      }
      return { ok: false, message: "The AI stopped part-way. Please try again." };
    }

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string; translation?: Boxes };
    if (!res.ok) {
      return {
        ok: false, signIn: res.status === 401,
        message: json.error ?? (res.status === 503 ? "The AI writer isn't switched on yet. You can type your own words for now." : "Something went wrong. Please try again."),
      };
    }
    return { ok: true, copy: pick(json), translation: json.translation, trimmed: !!res.headers.get("X-Copy-Trimmed") };
  } catch {
    if (why) return { ok: false, message: why === "quiet" ? "The AI went quiet, so we stopped waiting. Please try again." : "The AI took too long this time. Please try again, or write it yourself." };
    return { ok: false, message: "Couldn't reach In2Min2. Check your signal and try again." };
  } finally {
    window.clearTimeout(quiet);
    window.clearTimeout(longest);
  }
}
