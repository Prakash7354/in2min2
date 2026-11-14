-- 0005: where each event's main photo and preview picture are kept.
-- (14 Nov 2026: guests now see the host's photo, and WhatsApp shows a picture
-- when the link is pasted.)
--
-- A Supabase Storage bucket, "event-media", in the same London project:
-- - files sit in the event's own folder: {event id}/cover-….jpg and
--   {event id}/share-….png (events.cover_image_key, events.share_image_key);
-- - only that event's owner or co-hosts can add, replace or remove them;
-- - anyone with a file's exact address can see it, as WhatsApp must to show
--   the preview. The address carries the event's random id, so it can't be
--   guessed, and nobody can list the files;
-- - pictures only (JPEG, PNG or WebP), up to 3 MB. The phone makes them
--   smaller first and removes the photo's location (lib/image.ts).
-- The guests' photo wall comes later, on Cloudflare R2 (CONCEPT 12a).
--
-- Kept separate from 0004 so that, if Supabase ever refuses a storage
-- setting, replies and the festive designs still work.
--
-- Run once in Supabase › SQL Editor › New query › paste › Run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-media', 'event-media', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Is this a file name the caller may write? "{event id}/cover-abc123.jpg" for
-- an event they own or co-host.
create or replace function public.media_path_ok(p_name text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  parts text[] := string_to_array(coalesce(p_name, ''), '/');
  ev uuid;
begin
  if array_length(parts, 1) is distinct from 2 or parts[2] !~ '^(cover|share)-[a-z0-9]{6,40}\.(jpg|png|webp)$' then
    return false;
  end if;
  begin
    ev := parts[1]::uuid;
  exception when others then
    return false;
  end;
  return public.is_event_host(ev, 'co_host');
end $$;
revoke execute on function public.media_path_ok(text) from public, anon;
grant execute on function public.media_path_ok(text) to authenticated, service_role;

create policy event_media_add on storage.objects for insert to authenticated
  with check (bucket_id = 'event-media' and public.media_path_ok(name));
create policy event_media_replace on storage.objects for update to authenticated
  using (bucket_id = 'event-media' and public.media_path_ok(name))
  with check (bucket_id = 'event-media' and public.media_path_ok(name));
create policy event_media_remove on storage.objects for delete to authenticated
  using (bucket_id = 'event-media' and public.media_path_ok(name));
-- Hosts see their own events' files (needed to replace one); nobody else lists them.
create policy event_media_see on storage.objects for select to authenticated
  using (bucket_id = 'event-media' and public.media_path_ok(name));
