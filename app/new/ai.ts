"use client";

// Builder 2.0's calls to the AI writer (POST /api/generate-copy): all five
// boxes at once, or one box made shorter, warmer, more formal or more fun.
// Signed-in hosts only, 20 AI writes a day (take_ai_write, 0002).

import { COPY_KEYS, type Adjustment, type CopyKey, type EventCopy } from "@/lib/ai/copy";
import { copyRequest } from "@/lib/ai/request";
import type { Draft } from "@/lib/draft";
import { supabase } from "@/lib/supabase/client";

export type AiResult =
  | { ok: true; copy: Partial<EventCopy>; translation?: Partial<EventCopy>; trimmed: boolean }
  | { ok: false; signIn?: boolean; message: string };

export async function aiWrite(d: Draft, one?: { key: CopyKey; adjust: Adjustment }): Promise<AiResult> {
  // The token is read fresh, so this also works straight after signing in.
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, signIn: true, message: "Sign in (free) and the AI will write your words." };
  const current = one ? d.copy[one.key].trim().slice(0, 440) : "";
  const body = { ...copyRequest(d), ...(one ? { only: one.key, adjust: one.adjust, ...(current ? { current } : {}) } : {}) };
  try {
    const res = await fetch("/api/generate-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string; translation?: Partial<EventCopy> };
    if (!res.ok) {
      return {
        ok: false, signIn: res.status === 401,
        message: json.error ?? (res.status === 503 ? "The AI writer isn't switched on yet. You can type your own words for now." : "Something went wrong. Please try again."),
      };
    }
    const keys = one ? [one.key] : COPY_KEYS;
    const copy = Object.fromEntries(keys.map((k) => [k, typeof json[k] === "string" ? (json[k] as string) : ""])) as Partial<EventCopy>;
    return { ok: true, copy, translation: json.translation, trimmed: !!res.headers.get("X-Copy-Trimmed") };
  } catch {
    return { ok: false, message: "Couldn't reach In2Min2. Check your signal and try again." };
  }
}
