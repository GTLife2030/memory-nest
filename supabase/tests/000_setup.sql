-- Test helpers. Runs first (pg_prove orders by file name) and commits, so later files can use them.
create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

create or replace function tests.create_user(p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  select id into v from auth.users where email = p_email;
  if v is null then
    insert into auth.users (id, email) values (gen_random_uuid(), p_email) returning id into v;
  end if;
  return v;
end $$;

create or replace function tests.uid(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where email = p_email
$$;

create or replace function tests.authenticate_as(p_email text) returns void
language plpgsql set search_path = '' as $$
declare v uuid := tests.uid(p_email);
begin
  if v is null then raise exception 'unknown test user %', p_email; end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v, 'role', 'authenticated', 'email', p_email)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function tests.as_anon() returns void
language plpgsql set search_path = '' as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end $$;

create or replace function tests.as_service_role() returns void
language plpgsql set search_path = '' as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  perform set_config('role', 'service_role', true);
end $$;

create or replace function tests.as_admin() returns void
language plpgsql set search_path = '' as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'none', true);
end $$;

-- Fixed ids so tests read like prose.
create or replace function tests.fam_a() returns uuid language sql immutable as
  $$ select 'aaaaaaaa-0000-4000-8000-000000000001'::uuid $$;
create or replace function tests.fam_b() returns uuid language sql immutable as
  $$ select 'bbbbbbbb-0000-4000-8000-000000000001'::uuid $$;
create or replace function tests.story(p_key text) returns uuid language sql immutable as $$
  select ('00000000-0000-4000-8000-' || lpad(encode(convert_to(p_key, 'utf8'), 'hex'), 12, '0'))::uuid
$$;

-- One row in every family-scoped table for the given family, written as its owner.
create or replace function tests.populate(p_family uuid, p_owner uuid, p_tag text) returns void
language plpgsql set search_path = public, extensions as $$
declare
  v_profile uuid; v_teller uuid; v_question uuid; v_chapter uuid; v_story uuid := gen_random_uuid();
  v_media uuid := gen_random_uuid(); v_transcript uuid; v_book uuid; v_capsule uuid; v_person uuid; v_place uuid;
begin
  select id into v_profile from profiles where user_id = p_owner;
  insert into families (id, name) values (p_family, 'Familie ' || p_tag);
  insert into memberships (family_id, user_id, role, status) values (p_family, p_owner, 'owner', 'active');
  insert into storytellers (family_id, profile_id, name, persona) values (p_family, v_profile, 'Verteller ' || p_tag, 'reflective')
    returning id into v_teller;
  insert into questions (family_id, created_by, theme, text_nl) values (p_family, p_owner, 'jeugd', 'Eigen vraag ' || p_tag)
    returning id into v_question;
  insert into chapters (family_id, title) values (p_family, 'Hoofdstuk ' || p_tag) returning id into v_chapter;
  insert into stories (id, family_id, storyteller_id, created_by, title, status, visibility, chapter_id)
    values (v_story, p_family, v_teller, p_owner, 'Verhaal ' || p_tag, 'approved', 'family', v_chapter);
  insert into story_shares (family_id, story_id, user_id) values (p_family, v_story, p_owner);
  insert into media_assets (id, family_id, story_id, created_by, kind, storage_path)
    values (v_media, p_family, v_story, p_owner, 'audio', p_family || '/' || p_owner || '/opname-' || p_tag || '.webm');
  insert into transcripts (family_id, media_asset_id, text, provider) values (p_family, v_media, 'Transcript ' || p_tag, 'mock')
    returning id into v_transcript;
  insert into story_versions (story_id, body_md, author, created_by) values (v_story, 'Versie', 'human', p_owner);
  insert into story_sources (story_id, paragraph_index, transcript_id, start_ms, end_ms) values (v_story, 0, v_transcript, 0, 1000);
  insert into prompts_sent (family_id, storyteller_id, question_id, channel) values (p_family, v_teller, v_question, 'email');
  insert into interviews (family_id, storyteller_id, created_by, channel) values (p_family, v_teller, p_owner, 'browser');
  insert into people (family_id, name) values (p_family, 'Persoon ' || p_tag) returning id into v_person;
  insert into places (family_id, name) values (p_family, 'Plaats ' || p_tag) returning id into v_place;
  insert into story_people (story_id, person_id) values (v_story, v_person);
  insert into story_places (story_id, place_id) values (v_story, v_place);
  insert into timeline_events (family_id, story_id, date, label) values (p_family, v_story, '1970-01-01', 'Moment ' || p_tag);
  insert into timeline_events (family_id, date, label) values (p_family, '1971-01-01', 'Los moment ' || p_tag);
  insert into books (family_id, title) values (p_family, 'Boek ' || p_tag) returning id into v_book;
  insert into print_orders (family_id, book_id, provider, address, price_cents) values (p_family, v_book, 'mock', '{}', 4900);
  insert into capsules (family_id, author_id, title, letter_md) values (p_family, p_owner, 'Capsule ' || p_tag, 'Lieve…')
    returning id into v_capsule;
  insert into capsule_recipients (capsule_id, person_id, email) values (v_capsule, v_person, 'kind-' || p_tag || '@example.test');
  insert into release_triggers (capsule_id, type, date) values (v_capsule, 'date', '2044-03-14');
  insert into legacy_events (family_id, subject_profile_id, type, reported_by) values (p_family, v_profile, 'death_reported', p_owner);
  insert into subscriptions (family_id, product, status) values (p_family, 'familie_nest', 'active');
  insert into usage_counters (family_id, month) values (p_family, '2026-11-01');
  insert into exports (family_id, requested_by) values (p_family, p_owner);
end $$;

-- Familie A with every role, plus Familie B as the neighbour that must stay invisible.
create or replace function tests.fixture() returns void
language plpgsql set search_path = public, extensions as $$
declare
  a uuid := tests.fam_a();
  marieke uuid := tests.create_user('marieke@a.test'); joris uuid := tests.create_user('joris@a.test');
  truus uuid := tests.create_user('truus@a.test');     saar uuid := tests.create_user('saar@a.test');
  lotte uuid := tests.create_user('lotte@a.test');     peter uuid := tests.create_user('peter@a.test');
  eva uuid := tests.create_user('eva@b.test');         nobody uuid := tests.create_user('nobody@x.test');
begin
  perform tests.populate(a, marieke, 'A');
  perform tests.populate(tests.fam_b(), eva, 'B');
  insert into memberships (family_id, user_id, role, status) values
    (a, joris, 'co_author', 'active'), (a, truus, 'co_author', 'active'), (a, saar, 'recipient', 'active'),
    (a, lotte, 'viewer', 'active'), (a, peter, 'legacy_contact', 'active');
  insert into stories (id, family_id, created_by, title, status, visibility, vault) values
    (tests.story('famok'), a, truus, 'Bakkerij', 'approved', 'family', false),
    (tests.story('famdr'), a, truus, 'Kermis (concept)', 'draft', 'family', false),
    (tests.story('priv'), a, truus, 'Alleen voor mij', 'approved', 'private', false),
    (tests.story('vault'), a, joris, 'Kluisverhaal', 'approved', 'private', true),
    (tests.story('shared'), a, marieke, 'Voor Saar', 'approved', 'selected', false),
    (tests.story('shdr'), a, marieke, 'Voor Saar (concept)', 'draft', 'selected', false);
  insert into story_shares (family_id, story_id, user_id) values
    (a, tests.story('shared'), saar), (a, tests.story('shdr'), saar);
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

begin;
select plan(1);
select has_schema('tests', 'test helpers are installed');
select * from finish();
commit;
