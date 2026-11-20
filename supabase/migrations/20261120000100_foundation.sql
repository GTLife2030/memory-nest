-- Foundation: extensions, private helper schema, enums, generic triggers.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

-- `app` holds helpers used by RLS policies and triggers. It is not exposed through the API.
create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

-- New tables are closed by default: every grant below is explicit.
alter default privileges in schema public revoke all on tables from anon, authenticated;
-- Functions are executable by PUBLIC by default and that cannot be changed per schema,
-- so every function is revoked explicitly where it is created.

create type public.preferred_channel as enum ('app', 'email', 'whatsapp', 'phone');
create type public.reminder_freq as enum ('weekly', 'biweekly', 'monthly');
create type public.membership_role as enum ('owner', 'co_author', 'recipient', 'legacy_contact', 'viewer');
create type public.membership_status as enum ('invited', 'active', 'revoked');
create type public.storyteller_persona as enum ('new_parent', 'reflective', 'limited_time');
create type public.question_sensitivity as enum ('normal', 'tender', 'heavy');
create type public.story_status as enum ('draft', 'needs_review', 'approved');
create type public.date_precision as enum ('day', 'month', 'year', 'decade');
create type public.story_visibility as enum ('private', 'family', 'selected');
create type public.version_author as enum ('human', 'ai');
create type public.media_kind as enum ('photo', 'audio', 'video', 'scan', 'document');
create type public.interview_channel as enum ('browser', 'phone');
create type public.capsule_status as enum ('sealed', 'released', 'cancelled');
create type public.release_trigger_type as enum ('date', 'age', 'milestone', 'after_death');
create type public.legacy_event_type as enum ('death_reported', 'confirmed', 'disputed', 'cancelled');
create type public.consent_type as enum
  ('terms', 'privacy', 'special_category_health', 'ai_processing', 'phone_calls', 'whatsapp');

create function app.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create function app.prevent_family_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.family_id is distinct from old.family_id then
    raise exception 'family_id is immutable' using errcode = '42501';
  end if;
  return new;
end $$;

-- True for requests made by end users through the API; false for the service role and migrations.
-- Must stay SECURITY INVOKER: it inspects the role the statement runs as.
create function app.is_end_user() returns boolean
language sql stable set search_path = '' as $$
  select current_user in ('authenticated', 'anon')
$$;

-- Adds the updated_at trigger to every public table and the family_id guard to every
-- family-scoped table. Idempotent; call it at the end of any migration that adds tables.
create function app.apply_standard_triggers() returns void
language plpgsql set search_path = '' as $$
declare t record;
begin
  for t in
    select c.table_name,
           bool_or(c.column_name = 'updated_at') as has_updated,
           bool_or(c.column_name = 'family_id') as has_family
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
    where c.table_schema = 'public'
    group by c.table_name
  loop
    if t.has_updated then
      execute format('drop trigger if exists set_updated_at on public.%I', t.table_name);
      execute format('create trigger set_updated_at before update on public.%I
                      for each row execute function app.set_updated_at()', t.table_name);
    end if;
    if t.has_family then
      execute format('drop trigger if exists prevent_family_change on public.%I', t.table_name);
      execute format('create trigger prevent_family_change before update on public.%I
                      for each row execute function app.prevent_family_change()', t.table_name);
    end if;
  end loop;
end $$;
