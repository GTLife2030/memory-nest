-- Hardening after the phase 0 security review. Each block names the hole it closes;
-- supabase/tests/090_hardening.sql reproduces every one of them.

-- ---------- 1. Leaving a family ends all access, also to your own content ----------
create or replace function app.story_readable(
  p_id uuid, p_family uuid, p_created_by uuid, p_vault boolean,
  p_visibility public.story_visibility, p_status public.story_status
) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    (p_created_by = (select auth.uid()) and app.is_member(p_family))
    or app.has_role(p_family, 'owner')
    or (not p_vault and p_visibility = 'family' and app.has_role(p_family, 'co_author'))
    or (not p_vault and p_visibility = 'family' and p_status = 'approved' and app.has_role(p_family, 'viewer'))
    -- Explicit shares count only for roles that may read stories at all (not legacy contacts).
    or (not p_vault and p_visibility <> 'private' and p_status = 'approved'
        and app.has_role(p_family, 'recipient', 'viewer', 'co_author')
        and exists (select 1 from public.story_shares sh
                    where sh.story_id = p_id and sh.user_id = (select auth.uid())))
$$;

-- Capsule media: readable by its creator, and after release by the recipients of a capsule
-- written by that same creator (so a capsule cannot "adopt" someone else's media).
create or replace function app.media_readable(
  p_id uuid, p_family uuid, p_created_by uuid, p_bucket text, p_story uuid
) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when p_created_by = (select auth.uid()) and app.is_member(p_family) then true
    when p_bucket = 'capsules' then exists (
      select 1 from public.capsules c
      where c.message_media_id = p_id and c.author_id = p_created_by and c.family_id = p_family
        and app.capsule_released_to_me(c.id))
    else app.has_role(p_family, 'owner') or (p_story is not null and app.can_read_story(p_story))
  end
$$;

create function app.can_write_media(p_family uuid, p_created_by uuid, p_bucket text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (p_created_by = (select auth.uid()) and app.has_role(p_family, 'owner', 'co_author'))
      or (p_bucket = 'media' and app.has_role(p_family, 'owner'))
$$;

create or replace function app.capsule_is_mine(p_capsule uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.capsules c
    where c.id = p_capsule and c.author_id = (select auth.uid()) and app.is_member(c.family_id))
$$;

create or replace function app.capsule_is_mine_and_sealed(p_capsule uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.capsules c
    where c.id = p_capsule and c.author_id = (select auth.uid()) and c.status = 'sealed'
      and app.has_role(c.family_id, 'owner', 'co_author'))
$$;

drop policy media_assets_update on public.media_assets;
drop policy media_assets_delete on public.media_assets;
create policy media_assets_update on public.media_assets for update to authenticated
  using (app.can_write_media(family_id, created_by, bucket))
  with check (app.can_write_media(family_id, created_by, bucket)
              and (story_id is null or app.can_write_story(story_id)));
create policy media_assets_delete on public.media_assets for delete to authenticated
  using (app.can_write_media(family_id, created_by, bucket));

drop policy capsules_select on public.capsules;
drop policy capsules_update on public.capsules;
drop policy capsules_delete on public.capsules;
create policy capsules_select on public.capsules for select to authenticated
  using ((author_id = (select auth.uid()) and app.is_member(family_id)) or app.capsule_released_to_me(id));
create policy capsules_update on public.capsules for update to authenticated
  using (author_id = (select auth.uid()) and status = 'sealed' and app.has_role(family_id, 'owner', 'co_author'))
  with check (author_id = (select auth.uid()) and status in ('sealed', 'cancelled'));
create policy capsules_delete on public.capsules for delete to authenticated
  using (author_id = (select auth.uid()) and status <> 'released' and app.has_role(family_id, 'owner', 'co_author'));

-- ---------- 2. Raw transcripts and earlier versions are for the author and the owner ----------
drop policy story_versions_select on public.story_versions;
create policy story_versions_select on public.story_versions for select to authenticated
  using (app.can_write_story(story_id));

drop policy transcripts_select on public.transcripts;
create policy transcripts_select on public.transcripts for select to authenticated
  using (exists (select 1 from public.media_assets m
                 where m.id = media_asset_id and app.can_write_media(m.family_id, m.created_by, m.bucket)));

-- ---------- 3. References stay inside one family ----------
-- Generic guard: TG_ARGV = pairs of (column, referenced table). The row's family is its own
-- family_id, or that of its story or capsule.
create function app.guard_same_family() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r jsonb := to_jsonb(new);
  v_family uuid;
  v_ref uuid;
  v_ref_family uuid;
  i int := 0;
begin
  if r ? 'family_id' then
    v_family := (r ->> 'family_id')::uuid;
  elsif r ? 'story_id' then
    select s.family_id into v_family from public.stories s where s.id = (r ->> 'story_id')::uuid;
  elsif r ? 'capsule_id' then
    select c.family_id into v_family from public.capsules c where c.id = (r ->> 'capsule_id')::uuid;
  end if;
  while i < tg_nargs loop
    v_ref := (r ->> tg_argv[i])::uuid;
    if v_ref is not null then
      execute format('select family_id from public.%I where id = $1', tg_argv[i + 1]) into v_ref_family using v_ref;
      -- Same error whether the row is in another family or does not exist: no existence oracle.
      if v_ref_family is null or v_family is null or v_ref_family <> v_family then
        raise exception 'reference outside the family' using errcode = '42501';
      end if;
    end if;
    i := i + 2;
  end loop;
  return new;
end $$;

create trigger guard_same_family before insert or update on public.stories for each row
  execute function app.guard_same_family('chapter_id', 'chapters', 'storyteller_id', 'storytellers', 'source_transcript_id', 'transcripts');
create trigger guard_same_family before insert or update on public.story_shares for each row
  execute function app.guard_same_family('story_id', 'stories');
create trigger guard_same_family before insert or update on public.media_assets for each row
  execute function app.guard_same_family('story_id', 'stories', 'original_asset_id', 'media_assets');
create trigger guard_same_family before insert or update on public.transcripts for each row
  execute function app.guard_same_family('media_asset_id', 'media_assets');
create trigger guard_same_family before insert or update on public.story_sources for each row
  execute function app.guard_same_family('transcript_id', 'transcripts');
create trigger guard_same_family before insert or update on public.story_people for each row
  execute function app.guard_same_family('person_id', 'people');
create trigger guard_same_family before insert or update on public.story_places for each row
  execute function app.guard_same_family('place_id', 'places');
create trigger guard_same_family before insert or update on public.timeline_events for each row
  execute function app.guard_same_family('story_id', 'stories');
create trigger guard_same_family before insert or update on public.prompts_sent for each row
  execute function app.guard_same_family('storyteller_id', 'storytellers', 'answered_story_id', 'stories');
create trigger guard_same_family before insert or update on public.interviews for each row
  execute function app.guard_same_family('storyteller_id', 'storytellers', 'transcript_id', 'transcripts');
create trigger guard_same_family before insert or update on public.print_orders for each row
  execute function app.guard_same_family('book_id', 'books');
create trigger guard_same_family before insert or update on public.capsule_recipients for each row
  execute function app.guard_same_family('person_id', 'people');

-- A story can only be shared with someone who is in the family in a reading role.
create function app.user_can_receive_share(p_family uuid, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.family_id = p_family and m.user_id = p_user and m.status = 'active'
      and m.role in ('recipient', 'viewer', 'co_author'))
$$;
drop policy story_shares_insert on public.story_shares;
create policy story_shares_insert on public.story_shares for insert to authenticated
  with check (app.can_write_story(story_id) and app.user_can_receive_share(family_id, user_id));

-- ---------- 4. Capsules: only their author's own capsule media; frozen once released ----------
create function app.guard_capsule_media() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.message_media_id is not null and not exists (
       select 1 from public.media_assets m
       where m.id = new.message_media_id and m.created_by = new.author_id
         and m.family_id = new.family_id and m.bucket = 'capsules') then
    raise exception 'capsule media must be the author''s own capsule recording' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_capsule_media before insert or update on public.capsules
  for each row execute function app.guard_capsule_media();

alter table public.capsules drop constraint capsules_message_media_id_fkey;
alter table public.capsules add constraint capsules_message_media_id_fkey
  foreign key (message_media_id) references public.media_assets (id) on delete restrict;

create function app.guard_released_media() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.capsules c where c.message_media_id = old.id and c.status = 'released') then
    raise exception 'media of a released capsule cannot be changed' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger guard_released_media before update or delete on public.media_assets
  for each row execute function app.guard_released_media();

create function app.object_is_locked(p_bucket text, p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.media_assets m join public.capsules c on c.message_media_id = m.id
    where m.bucket = p_bucket and m.storage_path = p_name and c.status = 'released')
$$;

drop policy mn_media_read on storage.objects;
drop policy mn_media_delete on storage.objects;
create policy mn_media_read on storage.objects for select to authenticated
  using (bucket_id in ('media', 'capsules')
         and ((app.path_uploader(name) = (select auth.uid()) and app.is_member(app.path_family(name)))
              or app.can_read_object(bucket_id, name)));
create policy mn_media_delete on storage.objects for delete to authenticated
  using (bucket_id in ('media', 'capsules')
         and app.path_uploader(name) = (select auth.uid())
         and app.has_role(app.path_family(name), 'owner', 'co_author')
         and not app.object_is_locked(bucket_id, name));

-- ---------- 5. Vault: close the two remaining routes ----------
create or replace function app.guard_vault_media() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Media never leaves a vault story (otherwise it could be transcribed once detached).
  if tg_op = 'UPDATE' and old.story_id is not null and new.story_id is distinct from old.story_id
     and app.story_is_vault(old.story_id) then
    perform app.raise_vault();
  end if;
  -- No AI-edited copy of a vault photo.
  if new.original_asset_id is not null and (new.ai_edited or new.ai_description is not null)
     and exists (select 1 from public.media_assets o
                 where o.id = new.original_asset_id and app.story_is_vault(o.story_id)) then
    perform app.raise_vault();
  end if;
  if new.story_id is not null and app.story_is_vault(new.story_id) and (
       new.ai_description is not null or new.ai_decade_guess is not null or new.ai_edited
       or exists (select 1 from public.transcripts t where t.media_asset_id = new.id)) then
    perform app.raise_vault();
  end if;
  return new;
end $$;

-- Only the author decides to take a story out of the vault. The owner can read it, not open it up.
create function app.guard_vault_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
  if app.is_end_user() and old.vault and not new.vault and old.created_by <> (select auth.uid()) then
    raise exception 'only the author can take a story out of the vault' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_vault_owner before update on public.stories
  for each row execute function app.guard_vault_owner();

-- ---------- 6. Memberships: nobody is put into a family without accepting ----------
create function app.guard_membership_activation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if app.is_end_user() and new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active') then
    raise exception 'a membership becomes active when the invited person accepts it' using errcode = '42501';
  end if;
  if app.is_end_user() and tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'a membership cannot be handed to someone else' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_membership_activation before insert or update on public.memberships
  for each row execute function app.guard_membership_activation();

-- The invited person accepts. Matches on their verified sign-in e-mail address.
create function public.accept_invitation(p_membership uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_family uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  update public.memberships m
     set status = 'active', user_id = v_user
   where m.id = p_membership and m.status = 'invited'
     and (m.user_id = v_user or (m.user_id is null and v_email is not null and lower(m.invited_email) = v_email))
  returning m.family_id into v_family;
  if v_family is null then
    raise exception 'invitation not found' using errcode = '42501';
  end if;
  perform app.audit('membership.accepted', 'memberships', p_membership);
  return v_family;
end $$;
revoke all on function public.accept_invitation(uuid) from public, anon;
grant execute on function public.accept_invitation(uuid) to authenticated;

-- ---------- 7. Legacy reports: only about someone in this family, evidence in your own folder ----------
create function app.profile_in_family(p_profile uuid, p_family uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join public.memberships m on m.user_id = p.user_id
    where p.id = p_profile and m.family_id = p_family and m.status = 'active')
$$;
drop policy legacy_events_insert on public.legacy_events;
create policy legacy_events_insert on public.legacy_events for insert to authenticated
  with check (reported_by = (select auth.uid()) and type = 'death_reported'
              and confirm_count = 0 and waiting_until is null
              and app.has_role(family_id, 'legacy_contact')
              and app.profile_in_family(subject_profile_id, family_id)
              and (evidence_path is null
                   or evidence_path like family_id::text || '/' || (select auth.uid())::text || '/%'));

-- ---------- 8. Smaller write surfaces ----------
-- Books: only the owner changes them (a co-author could otherwise point pdf_path elsewhere).
drop policy books_insert on public.books;
drop policy books_update on public.books;
create policy books_insert on public.books for insert to authenticated
  with check (app.has_role(family_id, 'owner'));
create policy books_update on public.books for update to authenticated
  using (app.has_role(family_id, 'owner')) with check (app.has_role(family_id, 'owner'));
revoke update on public.books from authenticated;
grant update (title, template) on public.books to authenticated;

-- Interviews: cost, duration and transcript are written by the server.
revoke update on public.interviews from authenticated;
grant update (scheduled_at, status) on public.interviews to authenticated;

-- Consent can be withdrawn once, at the current time; never un-withdrawn or backdated.
create function app.guard_consent_withdrawal() returns trigger
language plpgsql set search_path = '' as $$
begin
  if app.is_end_user() then
    if old.withdrawn_at is not null then
      raise exception 'a withdrawn consent stays withdrawn; give a new consent instead' using errcode = '42501';
    end if;
    if new.withdrawn_at is not null then
      new.withdrawn_at := now();
    end if;
  end if;
  return new;
end $$;
create trigger guard_consent_withdrawal before update on public.consents
  for each row execute function app.guard_consent_withdrawal();

-- ---------- 9. Least privilege on helper functions ----------
-- End users may execute only the helpers that policies call. Trigger functions, app.audit and
-- app.apply_standard_triggers are not callable by them.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' loop
    execute format('revoke all on function %s from public, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
    if f.proname in ('has_role', 'is_member', 'story_readable', 'can_read_story', 'can_write_story',
                     'capsule_released_to_me', 'capsule_is_mine', 'capsule_is_mine_and_sealed',
                     'media_readable', 'can_read_media', 'can_write_media', 'user_can_receive_share',
                     'path_family', 'path_uploader', 'can_read_object', 'object_is_locked', 'is_end_user', 'profile_in_family') then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
