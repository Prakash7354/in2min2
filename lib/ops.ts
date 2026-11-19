// Error alerts (CONCEPT 21; owner: "safety first", 19 Nov 2026). Server only.
//
// When something breaks, a short note goes into the private R2 bucket
// in2min2-backups (binding BACKUPS) under errors/. Once an hour the Worker's
// scheduled job (worker/main.js) emails the owner one list of them, then
// clears them. No names, emails or guest links are kept: only where it
// happened (the page address without its ?… part) and the error message.

import { getCloudflareContext } from "@opennextjs/cloudflare";

type Bucket = {
  put(key: string, value: string, options?: { customMetadata?: Record<string, string> }): Promise<unknown>;
};
declare global {
  interface CloudflareEnv {
    BACKUPS?: Bucket;
  }
}

// At most 20 notes an hour from each copy of the Worker, so a fault that
// repeats on every visit (or someone sending fake reports) can't fill the store.
let windowStart = 0;
let used = 0;

export async function recordError(where: string, message: string, extra?: Record<string, string | undefined>) {
  const now = Date.now();
  if (now - windowStart > 3_600_000) { windowStart = now; used = 0; }
  if (++used > 20) return;
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.BACKUPS) return;
    const clean = (s: string, n: number) => s.replace(/[\r\n]+/g, " ").replace(/\?\S*/g, "").slice(0, n);
    const meta: Record<string, string> = { where: clean(where, 160), message: clean(message, 600) };
    for (const [k, v] of Object.entries(extra ?? {})) if (v) meta[k] = clean(v, 120);
    await env.BACKUPS.put(`errors/${new Date(now).toISOString()}-${crypto.randomUUID().slice(0, 8)}`, "", { customMetadata: meta });
  } catch {
    // Never let an alert break the page.
  }
}
