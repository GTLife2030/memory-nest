-- Demo family "Familie de Wit" (phase 0 subset: enough for RLS tests, screenshots and the demo).
-- Phases 1–2 extend this to 8 stories for Truus, 20 moments for Saar and the draft book contents.
-- Demo data only: never run against a database that holds real families.
-- Idempotent: fixed ids, `on conflict do nothing`.
-- Not yet run against a hosted Supabase project (see docs/RUNBOOK.md, "Seeding").

do $$
declare
  marieke constant uuid := 'd0000000-0000-4000-8000-000000000001';
  joris   constant uuid := 'd0000000-0000-4000-8000-000000000002';
  truus   constant uuid := 'd0000000-0000-4000-8000-000000000003';
  fam     constant uuid := 'f0000000-0000-4000-8000-000000000001';
  teller_truus constant uuid := 'a0000000-0000-4000-8000-000000000001';
  teller_saar  constant uuid := 'a0000000-0000-4000-8000-000000000002';
  ch_jeugd  constant uuid := 'c0000000-0000-4000-8000-000000000001';
  ch_liefde constant uuid := 'c0000000-0000-4000-8000-000000000002';
  st_bakkerij constant uuid := 'b0000000-0000-4000-8000-000000000001';
  st_wijsheid constant uuid := 'b0000000-0000-4000-8000-000000000002';
  p_saar constant uuid := 'e0000000-0000-4000-8000-000000000001';
  p_henk constant uuid := 'e0000000-0000-4000-8000-000000000002';
  capsule constant uuid := 'ca000000-0000-4000-8000-000000000001';
begin
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values
    (marieke, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marieke@dewit.example', now(),
     '{"provider":"email","providers":["email"]}', '{"display_name":"Marieke"}'),
    (joris, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'joris@dewit.example', now(),
     '{"provider":"email","providers":["email"]}', '{"display_name":"Joris"}'),
    (truus, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'truus@dewit.example', now(),
     '{"provider":"email","providers":["email"]}', '{"display_name":"Truus"}')
  on conflict (id) do nothing;

  -- Profiles are created by the sign-up trigger; fill in what the demo needs.
  update public.profiles set birth_year = 1978 where user_id = marieke;
  update public.profiles set birth_year = 1946, elder_mode = true, preferred_channel = 'phone' where user_id = truus;

  insert into public.families (id, name, plan, storage_quota_gb) values (fam, 'Familie de Wit', 'levensverhaal', 25)
  on conflict (id) do nothing;

  insert into public.memberships (family_id, user_id, role, status) values
    (fam, marieke, 'owner', 'active'),
    (fam, joris, 'co_author', 'active'),
    (fam, joris, 'legacy_contact', 'active'),
    (fam, truus, 'co_author', 'active')
  on conflict (family_id, user_id, role) do nothing;

  insert into public.storytellers (id, family_id, profile_id, name, relation, persona, themes) values
    (teller_truus, fam, (select id from public.profiles where user_id = truus), 'Oma Truus', 'oma', 'reflective',
     array['jeugd', 'familie', 'werk', 'liefde', 'wijsheid']),
    (teller_saar, fam, (select id from public.profiles where user_id = marieke), 'Marieke en Joris', 'ouders', 'new_parent',
     array['eerste keren', 'maandbrief'])
  on conflict (id) do nothing;

  insert into public.people (id, family_id, name, relation, is_living, is_minor) values
    (p_saar, fam, 'Saar', 'dochter van Marieke en Joris', true, true),
    (p_henk, fam, 'Henk', 'man van Truus', null, false)
  on conflict (id) do nothing;

  insert into public.chapters (id, family_id, title, "order") values
    (ch_jeugd, fam, 'Jeugd in Tilburg', 1),
    (ch_liefde, fam, 'Wat ik heb geleerd', 2)
  on conflict (id) do nothing;

  insert into public.stories
    (id, family_id, storyteller_id, created_by, title, status, visibility, occurred_on, occurred_precision, chapter_id, body_md)
  values
    (st_bakkerij, fam, teller_truus, truus, 'De bakkerij van mijn vader', 'approved', 'family', '1955-01-01', 'decade', ch_jeugd,
     E'Mijn vader had een bakkerij aan de Heuvel in Tilburg. Om vier uur ''s ochtends stond hij al op, en dan rook het hele huis naar vers brood.\n\nIk mocht op zaterdag de krentenbollen tellen, daar was ik heel precies in.'),
    (st_wijsheid, fam, teller_truus, truus, 'Maak je niet druk', 'approved', 'family', '2024-01-01', 'year', ch_liefde,
     'Maak je niet druk om dingen die je morgen vergeten bent. Dat zei mijn vader altijd, en hij had gelijk.')
  on conflict (id) do nothing;

  insert into public.story_people (story_id, person_id) values (st_wijsheid, p_henk)
  on conflict (story_id, person_id) do nothing;

  if not exists (select 1 from public.timeline_events where family_id = fam) then
    insert into public.timeline_events (family_id, story_id, date, precision, label) values
      (fam, null, '1946-01-01', 'year', 'Truus wordt geboren in Tilburg'),
      (fam, st_bakkerij, '1955-01-01', 'decade', 'De bakkerij van mijn vader'),
      (fam, null, '1978-01-01', 'year', 'Geboorte van Marieke'),
      (fam, null, '2026-03-14', 'day', 'Saar wordt geboren');
    insert into public.books (family_id, title, template, status) values (fam, 'Truus vertelt', 'linnen', 'draft');
  end if;

  -- Papa Joris' sealed capsule for Saar. Saar is a minor and has no account: she is a person, not a user.
  insert into public.capsules (id, family_id, author_id, title, letter_md, status) values
    (capsule, fam, joris, 'Voor Saar, op haar achttiende',
     'Lieve Saar, als je dit leest ben je achttien. Ik schrijf dit terwijl je naast me ligt te slapen.', 'sealed')
  on conflict (id) do nothing;
  if not exists (select 1 from public.capsule_recipients where capsule_id = capsule) then
    insert into public.capsule_recipients (capsule_id, person_id) values (capsule, p_saar);
    insert into public.release_triggers (capsule_id, type, date) values (capsule, 'date', '2044-03-14');
  end if;
end $$;
