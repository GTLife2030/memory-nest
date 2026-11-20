-- Row level security. Rules, from docs/ARCHITECTURE.md:
--   owner          full access to the family, except other people's sealed capsules
--   co_author      create/edit own stories, read stories with visibility = family
--   viewer         read approved stories with visibility = family
--   recipient      read only approved stories shared with them and capsules released to them
--   legacy_contact report a death; no story access
--   vault stories  author + owner only
-- All helpers are SECURITY DEFINER so policies never recurse into other tables' policies.

create function app.has_role(p_family uuid, variadic p_roles public.membership_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.family_id = p_family
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any (p_roles)
  )
$$;

create function app.is_member(p_family uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.family_id = p_family and m.user_id = (select auth.uid()) and m.status = 'active'
  )
$$;

-- The single definition of "may the caller read this story".
create function app.story_readable(
  p_id uuid, p_family uuid, p_created_by uuid, p_vault boolean,
  p_visibility public.story_visibility, p_status public.story_status
) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    p_created_by = (select auth.uid())
    or app.has_role(p_family, 'owner')
    or (not p_vault and p_visibility = 'family' and app.has_role(p_family, 'co_author'))
    or (not p_vault and p_visibility = 'family' and p_status = 'approved' and app.has_role(p_family, 'viewer'))
    or (not p_vault and p_visibility <> 'private' and p_status = 'approved'
        and app.is_member(p_family)
        and exists (select 1 from public.story_shares sh
                    where sh.story_id = p_id and sh.user_id = (select auth.uid())))
$$;

create function app.can_read_story(p_story uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select app.story_readable(s.id, s.family_id, s.created_by, s.vault, s.visibility, s.status)
    from public.stories s where s.id = p_story), false)
$$;

create function app.can_write_story(p_story uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.stories s
    where s.id = p_story
      and (app.has_role(s.family_id, 'owner')
           or (s.created_by = (select auth.uid()) and app.has_role(s.family_id, 'co_author')))
  )
$$;

create function app.capsule_released_to_me(p_capsule uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.capsules c
    join public.capsule_recipients r on r.capsule_id = c.id
    where c.id = p_capsule and c.status = 'released' and r.user_id = (select auth.uid())
  )
$$;

create function app.capsule_is_mine_and_sealed(p_capsule uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.capsules c
    where c.id = p_capsule and c.author_id = (select auth.uid()) and c.status = 'sealed'
  )
$$;

create function app.capsule_is_mine(p_capsule uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.capsules c where c.id = p_capsule and c.author_id = (select auth.uid())
  )
$$;

-- Capsule media is readable by its creator and, after release, by the recipients.
-- The family owner is deliberately excluded. All other media follows its story.
create function app.media_readable(
  p_id uuid, p_family uuid, p_created_by uuid, p_bucket text, p_story uuid
) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when p_created_by = (select auth.uid()) then true
    when p_bucket = 'capsules' then exists (
      select 1 from public.capsules c
      where c.message_media_id = p_id and app.capsule_released_to_me(c.id))
    else app.has_role(p_family, 'owner') or (p_story is not null and app.can_read_story(p_story))
  end
$$;

create function app.can_read_media(p_media uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select app.media_readable(m.id, m.family_id, m.created_by, m.bucket, m.story_id)
    from public.media_assets m where m.id = p_media), false)
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

-- ---------- grants (RLS decides the rows; these decide the verbs and columns) ----------
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
revoke all on all tables in schema public from anon;

revoke insert, update, delete on public.families from authenticated;
grant update (name, locale) on public.families to authenticated;
revoke update on public.consents from authenticated;
grant update (withdrawn_at) on public.consents to authenticated;
revoke delete on public.consents, public.profiles, public.legacy_events from authenticated;
revoke insert, update, delete on
  public.prompts_sent, public.transcripts, public.print_orders, public.subscriptions,
  public.gift_codes, public.usage_counters from authenticated;
revoke all on public.audit_log from authenticated;
revoke update, delete on public.exports, public.legacy_events from authenticated;

-- ---------- families, profiles, memberships, storytellers ----------
create policy families_select on public.families for select to authenticated
  using (app.is_member(id));
create policy families_update on public.families for update to authenticated
  using (app.has_role(id, 'owner')) with check (app.has_role(id, 'owner'));

create policy profiles_select on public.profiles for select to authenticated
  using (user_id = (select auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy memberships_select on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or app.has_role(family_id, 'owner', 'co_author'));
create policy memberships_insert on public.memberships for insert to authenticated
  with check (app.has_role(family_id, 'owner'));
create policy memberships_update on public.memberships for update to authenticated
  using (app.has_role(family_id, 'owner')) with check (app.has_role(family_id, 'owner'));
create policy memberships_delete on public.memberships for delete to authenticated
  using (app.has_role(family_id, 'owner'));

create policy storytellers_select on public.storytellers for select to authenticated
  using (app.has_role(family_id, 'owner', 'co_author', 'viewer'));
create policy storytellers_insert on public.storytellers for insert to authenticated
  with check (app.has_role(family_id, 'owner'));
create policy storytellers_update on public.storytellers for update to authenticated
  using (app.has_role(family_id, 'owner')) with check (app.has_role(family_id, 'owner'));
create policy storytellers_delete on public.storytellers for delete to authenticated
  using (app.has_role(family_id, 'owner'));

-- ---------- questions ----------
create policy questions_select on public.questions for select to authenticated
  using (family_id is null or app.has_role(family_id, 'owner', 'co_author'));
create policy questions_insert on public.questions for insert to authenticated
  with check (family_id is not null and created_by = (select auth.uid())
              and app.has_role(family_id, 'owner', 'co_author', 'recipient', 'viewer'));
create policy questions_update on public.questions for update to authenticated
  using (family_id is not null and app.has_role(family_id, 'owner'))
  with check (family_id is not null and app.has_role(family_id, 'owner'));
create policy questions_delete on public.questions for delete to authenticated
  using (family_id is not null and app.has_role(family_id, 'owner'));

create policy prompts_sent_select on public.prompts_sent for select to authenticated
  using (app.has_role(family_id, 'owner', 'co_author'));

-- ---------- stories ----------
create policy stories_select on public.stories for select to authenticated
  using (app.story_readable(id, family_id, created_by, vault, visibility, status));
create policy stories_insert on public.stories for insert to authenticated
  with check (created_by = (select auth.uid()) and app.has_role(family_id, 'owner', 'co_author'));
create policy stories_update on public.stories for update to authenticated
  using (app.has_role(family_id, 'owner')
         or (created_by = (select auth.uid()) and app.has_role(family_id, 'co_author')))
  with check (app.has_role(family_id, 'owner')
         or (created_by = (select auth.uid()) and app.has_role(family_id, 'co_author')));
create policy stories_delete on public.stories for delete to authenticated
  using (app.has_role(family_id, 'owner')
         or (created_by = (select auth.uid()) and app.has_role(family_id, 'co_author')));

create policy story_shares_select on public.story_shares for select to authenticated
  using (user_id = (select auth.uid()) or app.can_write_story(story_id));
create policy story_shares_insert on public.story_shares for insert to authenticated
  with check (app.can_write_story(story_id)
              and family_id = (select s.family_id from public.stories s where s.id = story_id));
create policy story_shares_delete on public.story_shares for delete to authenticated
  using (app.can_write_story(story_id));

-- Child tables follow their story.
do $$
declare t text;
begin
  foreach t in array array['story_versions', 'story_sources', 'story_people', 'story_places'] loop
    execute format('create policy %1$s_select on public.%1$I for select to authenticated
                    using (app.can_read_story(story_id))', t);
    execute format('create policy %1$s_insert on public.%1$I for insert to authenticated
                    with check (app.can_write_story(story_id))', t);
    execute format('create policy %1$s_update on public.%1$I for update to authenticated
                    using (app.can_write_story(story_id)) with check (app.can_write_story(story_id))', t);
    execute format('create policy %1$s_delete on public.%1$I for delete to authenticated
                    using (app.can_write_story(story_id))', t);
  end loop;
end $$;

create policy media_assets_select on public.media_assets for select to authenticated
  using (app.media_readable(id, family_id, created_by, bucket, story_id));
create policy media_assets_insert on public.media_assets for insert to authenticated
  with check (created_by = (select auth.uid()) and app.has_role(family_id, 'owner', 'co_author')
              and (story_id is null or app.can_write_story(story_id)));
create policy media_assets_update on public.media_assets for update to authenticated
  using (created_by = (select auth.uid()) or (bucket = 'media' and app.has_role(family_id, 'owner')))
  with check ((created_by = (select auth.uid()) or (bucket = 'media' and app.has_role(family_id, 'owner')))
              and (story_id is null or app.can_write_story(story_id)));
create policy media_assets_delete on public.media_assets for delete to authenticated
  using (created_by = (select auth.uid()) or (bucket = 'media' and app.has_role(family_id, 'owner')));

create policy transcripts_select on public.transcripts for select to authenticated
  using (app.can_read_media(media_asset_id));

create policy interviews_select on public.interviews for select to authenticated
  using (created_by = (select auth.uid()) or app.has_role(family_id, 'owner'));
create policy interviews_insert on public.interviews for insert to authenticated
  with check (created_by = (select auth.uid()) and app.has_role(family_id, 'owner', 'co_author'));
create policy interviews_update on public.interviews for update to authenticated
  using (created_by = (select auth.uid()) or app.has_role(family_id, 'owner'))
  with check (created_by = (select auth.uid()) or app.has_role(family_id, 'owner'));

-- Family reference data: owner, co-author and viewer read; owner and co-author write.
do $$
declare t text;
begin
  foreach t in array array['people', 'places', 'chapters', 'books'] loop
    execute format('create policy %1$s_select on public.%1$I for select to authenticated
                    using (app.has_role(family_id, ''owner'', ''co_author'', ''viewer''))', t);
    execute format('create policy %1$s_insert on public.%1$I for insert to authenticated
                    with check (app.has_role(family_id, ''owner'', ''co_author''))', t);
    execute format('create policy %1$s_update on public.%1$I for update to authenticated
                    using (app.has_role(family_id, ''owner'', ''co_author''))
                    with check (app.has_role(family_id, ''owner'', ''co_author''))', t);
    execute format('create policy %1$s_delete on public.%1$I for delete to authenticated
                    using (app.has_role(family_id, ''owner''))', t);
  end loop;
end $$;

create policy timeline_events_select on public.timeline_events for select to authenticated
  using (case when story_id is null then app.has_role(family_id, 'owner', 'co_author', 'viewer')
              else app.can_read_story(story_id) end);
create policy timeline_events_insert on public.timeline_events for insert to authenticated
  with check (case when story_id is null then app.has_role(family_id, 'owner', 'co_author')
                   else app.can_write_story(story_id) end);
create policy timeline_events_update on public.timeline_events for update to authenticated
  using (case when story_id is null then app.has_role(family_id, 'owner', 'co_author')
              else app.can_write_story(story_id) end)
  with check (case when story_id is null then app.has_role(family_id, 'owner', 'co_author')
                   else app.can_write_story(story_id) end);
create policy timeline_events_delete on public.timeline_events for delete to authenticated
  using (case when story_id is null then app.has_role(family_id, 'owner', 'co_author')
              else app.can_write_story(story_id) end);

create policy print_orders_select on public.print_orders for select to authenticated
  using (app.has_role(family_id, 'owner'));

-- ---------- capsules ----------
create policy capsules_select on public.capsules for select to authenticated
  using (author_id = (select auth.uid()) or app.capsule_released_to_me(id));
create policy capsules_insert on public.capsules for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'sealed'
              and app.has_role(family_id, 'owner', 'co_author'));
create policy capsules_update on public.capsules for update to authenticated
  using (author_id = (select auth.uid()) and status = 'sealed')
  with check (author_id = (select auth.uid()) and status in ('sealed', 'cancelled'));
create policy capsules_delete on public.capsules for delete to authenticated
  using (author_id = (select auth.uid()) and status <> 'released');

create policy capsule_recipients_select on public.capsule_recipients for select to authenticated
  using (app.capsule_is_mine(capsule_id)
         or (user_id = (select auth.uid()) and app.capsule_released_to_me(capsule_id)));
create policy capsule_recipients_insert on public.capsule_recipients for insert to authenticated
  with check (app.capsule_is_mine_and_sealed(capsule_id));
create policy capsule_recipients_update on public.capsule_recipients for update to authenticated
  using (app.capsule_is_mine_and_sealed(capsule_id)) with check (app.capsule_is_mine_and_sealed(capsule_id));
create policy capsule_recipients_delete on public.capsule_recipients for delete to authenticated
  using (app.capsule_is_mine_and_sealed(capsule_id));

create policy release_triggers_select on public.release_triggers for select to authenticated
  using (app.capsule_is_mine(capsule_id));
create policy release_triggers_insert on public.release_triggers for insert to authenticated
  with check (app.capsule_is_mine_and_sealed(capsule_id));
create policy release_triggers_update on public.release_triggers for update to authenticated
  using (app.capsule_is_mine_and_sealed(capsule_id)) with check (app.capsule_is_mine_and_sealed(capsule_id));
create policy release_triggers_delete on public.release_triggers for delete to authenticated
  using (app.capsule_is_mine_and_sealed(capsule_id));

-- ---------- legacy ----------
create policy legacy_events_select on public.legacy_events for select to authenticated
  using (app.has_role(family_id, 'owner', 'legacy_contact'));
create policy legacy_events_insert on public.legacy_events for insert to authenticated
  with check (reported_by = (select auth.uid()) and type = 'death_reported'
              and confirm_count = 0 and waiting_until is null
              and app.has_role(family_id, 'legacy_contact'));

-- ---------- consent, billing, usage, export ----------
create policy consents_select on public.consents for select to authenticated
  using (user_id = (select auth.uid()));
create policy consents_insert on public.consents for insert to authenticated
  with check (user_id = (select auth.uid()) and withdrawn_at is null);
create policy consents_update on public.consents for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy subscriptions_select on public.subscriptions for select to authenticated
  using (app.has_role(family_id, 'owner'));
create policy gift_codes_select on public.gift_codes for select to authenticated
  using (redeemed_by = (select auth.uid()));
create policy usage_counters_select on public.usage_counters for select to authenticated
  using (app.has_role(family_id, 'owner'));

create policy exports_select on public.exports for select to authenticated
  using (app.has_role(family_id, 'owner'));
create policy exports_insert on public.exports for insert to authenticated
  with check (requested_by = (select auth.uid()) and status = 'requested' and zip_path is null
              and app.has_role(family_id, 'owner'));
