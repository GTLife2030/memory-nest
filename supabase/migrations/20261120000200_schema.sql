-- Complete data model. RLS is enabled here and policies follow in the next migration,
-- so there is no moment at which a table exists without default deny.

-- ---------- families & people who use the app ----------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  plan text not null default 'free',
  storage_quota_gb integer not null default 5 check (storage_quota_gb >= 0),
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  locale text not null default 'nl',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text not null default '',
  birth_year integer check (birth_year between 1900 and 2100),
  elder_mode boolean not null default false,
  phone_e164 text check (phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  preferred_channel public.preferred_channel not null default 'app',
  reminder_freq public.reminder_freq not null default 'weekly',
  reminder_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'invited',
  invited_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, user_id, role),
  check (user_id is not null or invited_email is not null),
  check (status <> 'active' or user_id is not null)
);
create index memberships_user_idx on public.memberships (user_id) where status = 'active';

create table public.storytellers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  relation text,
  persona public.storyteller_persona not null,
  themes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index storytellers_family_idx on public.storytellers (family_id);

-- ---------- questions ----------
-- family_id null = the shared question bank; not null = a question a family member wrote.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  theme text not null,
  persona_tags text[] not null default '{}',
  text_nl text not null,
  follow_up_hints text,
  sensitivity public.question_sensitivity not null default 'normal',
  locale text not null default 'nl',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_family_idx on public.questions (family_id);

-- ---------- stories ----------
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chapters_family_idx on public.chapters (family_id);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  storyteller_id uuid references public.storytellers (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id),
  title text not null default '',
  status public.story_status not null default 'draft',
  vault boolean not null default false,
  occurred_on date,
  occurred_precision public.date_precision,
  body_md text not null default '',
  source_transcript_id uuid,
  chapter_id uuid references public.chapters (id) on delete set null,
  visibility public.story_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Vault stories never have AI input and are never shared.
  constraint vault_has_no_transcript check (not vault or source_transcript_id is null),
  constraint vault_is_private check (not vault or visibility = 'private')
);
create index stories_family_idx on public.stories (family_id, status);
create index stories_created_by_idx on public.stories (created_by);

-- Explicit shares: how recipients (and visibility = 'selected') get access to a story.
create table public.story_shares (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, user_id)
);
create index story_shares_user_idx on public.story_shares (user_id);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  story_id uuid references public.stories (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id),
  kind public.media_kind not null,
  bucket text not null default 'media' check (bucket in ('media', 'capsules')),
  storage_path text not null unique,
  bytes bigint not null default 0 check (bytes >= 0),
  duration_ms integer,
  width integer,
  height integer,
  ai_description text,
  ai_decade_guess text,
  ai_edited boolean not null default false,
  original_asset_id uuid references public.media_assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An AI-edited image is always a labelled copy next to its original.
  check (not ai_edited or original_asset_id is not null)
);
create index media_assets_family_idx on public.media_assets (family_id);
create index media_assets_story_idx on public.media_assets (story_id);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  media_asset_id uuid not null references public.media_assets (id) on delete cascade,
  text text not null,
  segments jsonb not null default '[]',
  language text not null default 'nl',
  provider text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index transcripts_media_idx on public.transcripts (media_asset_id);
alter table public.stories
  add constraint stories_source_transcript_fk
  foreign key (source_transcript_id) references public.transcripts (id) on delete set null;

create table public.story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  body_md text not null,
  author public.version_author not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index story_versions_story_idx on public.story_versions (story_id);

create table public.story_sources (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  paragraph_index integer not null check (paragraph_index >= 0),
  transcript_id uuid not null references public.transcripts (id) on delete cascade,
  start_ms integer not null check (start_ms >= 0),
  end_ms integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_ms >= start_ms)
);
create index story_sources_story_idx on public.story_sources (story_id, paragraph_index);

create table public.prompts_sent (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  storyteller_id uuid not null references public.storytellers (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  channel public.preferred_channel not null,
  sent_at timestamptz not null default now(),
  answered_story_id uuid references public.stories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storyteller_id, question_id)
);
create index prompts_sent_family_idx on public.prompts_sent (family_id);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  storyteller_id uuid not null references public.storytellers (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id),
  channel public.interview_channel not null,
  scheduled_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled', 'failed')),
  duration_s integer not null default 0 check (duration_s >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  transcript_id uuid references public.transcripts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index interviews_family_idx on public.interviews (family_id);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  relation text,
  is_living boolean,
  is_minor boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index people_family_idx on public.people (family_id);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index places_family_idx on public.places (family_id);

create table public.story_people (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, person_id)
);

create table public.story_places (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, place_id)
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  story_id uuid references public.stories (id) on delete cascade,
  date date not null,
  precision public.date_precision not null default 'day',
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index timeline_events_family_idx on public.timeline_events (family_id, date);

-- ---------- books ----------
create table public.books (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null,
  template text not null default 'linnen' check (template in ('linnen', 'zand', 'eerste_jaar')),
  status text not null default 'draft' check (status in ('draft', 'rendering', 'ready', 'failed')),
  pdf_path text,
  page_count integer check (page_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index books_family_idx on public.books (family_id);

create table public.print_orders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  provider text not null,
  provider_ref text,
  status text not null default 'created',
  address jsonb not null,
  price_cents integer not null check (price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index print_orders_family_idx on public.print_orders (family_id);

-- ---------- time capsules ----------
create table public.capsules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id),
  title text not null,
  message_media_id uuid references public.media_assets (id) on delete set null,
  letter_md text,
  status public.capsule_status not null default 'sealed',
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'released') = (released_at is not null))
);
create index capsules_family_idx on public.capsules (family_id);
create index capsules_author_idx on public.capsules (author_id);

create table public.capsule_recipients (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  person_id uuid references public.people (id) on delete set null,
  email text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index capsule_recipients_capsule_idx on public.capsule_recipients (capsule_id);
create index capsule_recipients_user_idx on public.capsule_recipients (user_id);

create table public.release_triggers (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules (id) on delete cascade,
  type public.release_trigger_type not null,
  date date,
  age_years integer check (age_years between 0 and 120),
  recipient_birthdate date,
  milestone_label text,
  requires_confirmation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type <> 'date' or date is not null),
  check (type <> 'age' or (age_years is not null and recipient_birthdate is not null)),
  check (type <> 'milestone' or (milestone_label is not null and requires_confirmation))
);
create index release_triggers_capsule_idx on public.release_triggers (capsule_id);

-- ---------- legacy ----------
create table public.legacy_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  subject_profile_id uuid not null references public.profiles (id) on delete cascade,
  type public.legacy_event_type not null,
  reported_by uuid not null default auth.uid() references auth.users (id),
  evidence_path text,
  confirm_count integer not null default 0 check (confirm_count >= 0),
  waiting_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index legacy_events_family_idx on public.legacy_events (family_id);

-- ---------- consent, billing, usage, audit, export ----------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.consent_type not null,
  version text not null,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index consents_user_idx on public.consents (user_id, type);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  product text not null,
  status text not null,
  period_end timestamptz,
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_family_idx on public.subscriptions (family_id);

create table public.gift_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  product text not null,
  purchaser_email text not null,
  redeemed_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  voice_minutes numeric(10, 2) not null default 0,
  llm_tokens bigint not null default 0,
  storage_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, month)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  requested_by uuid default auth.uid() references auth.users (id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'building', 'ready', 'failed', 'expired')),
  zip_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exports_family_idx on public.exports (family_id);

select app.apply_standard_triggers();

-- Default deny on everything.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;
