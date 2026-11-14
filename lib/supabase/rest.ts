// Calling a database function from the server with plain fetch (no client
// library in the Worker). As the public, or as the signed-in host when their
// access token is passed.

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

export async function rpc<T>(fn: string, args: Record<string, unknown>, accessToken?: string): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken ?? SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    return { ok: false, status: res.status, message: body.message ?? res.statusText };
  }
  return { ok: true, data: (await res.json()) as T };
}
