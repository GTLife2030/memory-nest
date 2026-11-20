-- Private buckets and object policies. Path convention: {family_id}/{uploader_user_id}/{file}.
insert into storage.buckets (id, name, public) values
  ('media', 'media', false),
  ('capsules', 'capsules', false),
  ('books', 'books', false),
  ('exports', 'exports', false),
  ('evidence', 'evidence', false)
on conflict (id) do nothing;

create function app.path_family(p_name text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end $$;

create function app.path_uploader(p_name text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return split_part(p_name, '/', 2)::uuid;
exception when others then
  return null;
end $$;

-- An object is readable exactly when the media_assets row that points at it is readable.
create function app.can_read_object(p_bucket text, p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.media_assets m
    where m.bucket = p_bucket and m.storage_path = p_name
      and app.media_readable(m.id, m.family_id, m.created_by, m.bucket, m.story_id)
  )
$$;

revoke all on function app.path_family(text), app.path_uploader(text), app.can_read_object(text, text) from public;
grant execute on function app.path_family(text), app.path_uploader(text), app.can_read_object(text, text)
  to authenticated, service_role;

create policy mn_media_read on storage.objects for select to authenticated
  using (bucket_id in ('media', 'capsules')
         and (app.path_uploader(name) = (select auth.uid()) or app.can_read_object(bucket_id, name)));

create policy mn_media_upload on storage.objects for insert to authenticated
  with check (bucket_id in ('media', 'capsules')
              and app.path_uploader(name) = (select auth.uid())
              and app.has_role(app.path_family(name), 'owner', 'co_author'));

create policy mn_media_delete on storage.objects for delete to authenticated
  using (bucket_id in ('media', 'capsules') and app.path_uploader(name) = (select auth.uid()));

create policy mn_books_read on storage.objects for select to authenticated
  using (bucket_id = 'books' and app.has_role(app.path_family(name), 'owner', 'co_author', 'viewer'));

create policy mn_exports_read on storage.objects for select to authenticated
  using (bucket_id = 'exports' and app.has_role(app.path_family(name), 'owner'));

-- Evidence (for example a death certificate extract) can be uploaded, never read back by end users.
create policy mn_evidence_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence'
              and app.path_uploader(name) = (select auth.uid())
              and app.has_role(app.path_family(name), 'owner', 'legacy_contact'));
