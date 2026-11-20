-- Invariants that must hold whatever the application code does.

-- A media row can only point at an object inside its own family and uploader folder. Object read
-- access is derived from this row, so without this a member could claim someone else's object.
alter table public.media_assets add constraint storage_path_matches_owner
  check (storage_path like family_id::text || '/' || created_by::text || '/%');

-- ---------- vault: never any AI artefact ----------
create function app.story_is_vault(p_story uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select s.vault from public.stories s where s.id = p_story), false)
$$;

create function app.raise_vault() returns void
language plpgsql set search_path = '' as $$
begin
  raise exception 'vault stories are never processed by AI' using errcode = '23514';
end $$;

create function app.guard_vault_transcript() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.media_assets m
             where m.id = new.media_asset_id and app.story_is_vault(m.story_id)) then
    perform app.raise_vault();
  end if;
  return new;
end $$;
create trigger guard_vault before insert or update on public.transcripts
  for each row execute function app.guard_vault_transcript();

create function app.guard_vault_story_source() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if app.story_is_vault(new.story_id) then
    perform app.raise_vault();
  end if;
  return new;
end $$;
create trigger guard_vault before insert or update on public.story_sources
  for each row execute function app.guard_vault_story_source();

create function app.guard_vault_story_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.author = 'ai' and app.story_is_vault(new.story_id) then
    perform app.raise_vault();
  end if;
  return new;
end $$;
create trigger guard_vault before insert or update on public.story_versions
  for each row execute function app.guard_vault_story_version();

create function app.guard_vault_media() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.story_id is not null and app.story_is_vault(new.story_id) and (
       new.ai_description is not null or new.ai_decade_guess is not null or new.ai_edited
       or exists (select 1 from public.transcripts t where t.media_asset_id = new.id)) then
    perform app.raise_vault();
  end if;
  return new;
end $$;
create trigger guard_vault before insert or update on public.media_assets
  for each row execute function app.guard_vault_media();

-- A story can only become a vault story while it has no AI artefacts.
create function app.guard_vault_story() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.vault and (tg_op = 'INSERT' or not old.vault) and (
       exists (select 1 from public.story_sources x where x.story_id = new.id)
       or exists (select 1 from public.story_versions v where v.story_id = new.id and v.author = 'ai')
       or exists (select 1 from public.media_assets m where m.story_id = new.id
                  and (m.ai_description is not null or m.ai_decade_guess is not null or m.ai_edited
                       or exists (select 1 from public.transcripts t where t.media_asset_id = m.id)))) then
    perform app.raise_vault();
  end if;
  return new;
end $$;
create trigger guard_vault before insert or update on public.stories
  for each row execute function app.guard_vault_story();

-- ---------- stories: authorship cannot be reassigned by end users ----------
create function app.guard_created_by() returns trigger
language plpgsql set search_path = '' as $$
begin
  if app.is_end_user() and new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_created_by before update on public.stories
  for each row execute function app.guard_created_by();
create trigger guard_created_by before update on public.media_assets
  for each row execute function app.guard_created_by();

-- ---------- capsules: only the server releases, released capsules are immutable ----------
create function app.guard_capsule() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not app.is_end_user() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status <> 'sealed' or new.released_at is not null then
      raise exception 'capsules are created sealed' using errcode = '42501';
    end if;
    return new;
  end if;
  if old.status = 'released' or new.status = 'released' or new.released_at is not null then
    raise exception 'only the release job can release a capsule' using errcode = '42501';
  end if;
  if new.author_id is distinct from old.author_id then
    raise exception 'author_id is immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_capsule before insert or update on public.capsules
  for each row execute function app.guard_capsule();

-- ---------- memberships: a family always keeps an active owner ----------
create function app.guard_last_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and old.status = 'active'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active')
     and exists (select 1 from public.families f where f.id = old.family_id)
     and not exists (select 1 from public.memberships m
                     where m.family_id = old.family_id and m.role = 'owner'
                       and m.status = 'active' and m.id <> old.id) then
    raise exception 'a family must keep at least one owner' using errcode = '23514';
  end if;
  return coalesce(new, old);
end $$;
create trigger guard_last_owner before update or delete on public.memberships
  for each row execute function app.guard_last_owner();

-- ---------- audit log: append-only, written through one function ----------
create function app.audit(p_action text, p_entity text, p_entity_id uuid, p_meta jsonb default '{}')
returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor, action, entity, entity_id, meta)
  values ((select auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_meta, '{}'))
$$;

create function app.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end $$;
create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function app.audit_log_immutable();

-- ---------- sign-up bootstrap ----------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Creates a family with the caller as its owner. The only way a family comes into existence
-- for an end user; memberships cannot be self-inserted.
create function public.create_family(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_family uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if (select count(*) from public.memberships m
      where m.user_id = v_user and m.role = 'owner' and m.status = 'active') >= 5 then
    raise exception 'too many families' using errcode = '23514';
  end if;
  insert into public.families (name) values (p_name) returning id into v_family;
  insert into public.memberships (family_id, user_id, role, status)
  values (v_family, v_user, 'owner', 'active');
  perform app.audit('family.created', 'families', v_family);
  return v_family;
end $$;

-- Capsule metadata for the people who must be able to confirm a milestone, without the content.
create function public.family_capsule_overview(p_family uuid)
returns table (id uuid, title text, status public.capsule_status, author_id uuid, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.status, c.author_id, c.created_at
  from public.capsules c
  where c.family_id = p_family and app.has_role(p_family, 'owner', 'legacy_contact')
$$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' loop
    execute format('revoke all on function %s from public', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.create_family(text) from public, anon;
revoke all on function public.family_capsule_overview(uuid) from public, anon;
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.family_capsule_overview(uuid) to authenticated;
