// The guests' photos in Cloudflare R2 (bucket in2min2-photos, EU
// jurisdiction, binding PHOTOS in wrangler.jsonc). Server only.
// R2 charges nothing for downloads, which is why galleries live here
// (CONCEPT 12a). Until the bucket and binding exist, photoStore() is null and
// the app says "Photos aren't switched on yet" instead of failing.

import { getCloudflareContext } from "@opennextjs/cloudflare";

// The few parts of R2's API used here.
export interface PhotoStore {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpEtag: string; size: number } | null>;
  delete(keys: string | string[]): Promise<void>;
}

declare global {
  interface CloudflareEnv {
    PHOTOS?: PhotoStore;
  }
}

export async function photoStore(): Promise<PhotoStore | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.PHOTOS ?? null;
  } catch {
    return null;
  }
}

export const photoKeys = (eventId: string, id: string) => [`${eventId}/p/${id}.jpg`, `${eventId}/t/${id}.jpg`];
