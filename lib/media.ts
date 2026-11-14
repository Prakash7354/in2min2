// Where an event's main photo and preview picture live: the public
// "event-media" bucket in Supabase Storage, London (0005). Files sit in the
// event's own folder: {event id}/cover-….jpg and {event id}/share-….png.

import { SUPABASE_URL } from "@/lib/supabase/config";

export const MEDIA_BUCKET = "event-media";

export function mediaUrl(key: string | null | undefined): string | null {
  return key && /^[0-9a-f-]{36}\/(cover|share)-[a-z0-9]{6,40}\.(jpg|png|webp)$/.test(key)
    ? `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${key}`
    : null;
}
