-- Reproductions of the phase 0 security review findings. Each must stay closed.
begin;
select plan(43);
select tests.fixture();
select tests.as_admin();

create function pg_temp.p(p_user text, p_file text) returns text language sql as
  $$ select tests.fam_a() || '/' || tests.uid(p_user) || '/' || p_file $$;
create temp table b on commit drop as
  select (select id from people where family_id = tests.fam_b()) as person,
         (select id from places where family_id = tests.fam_b()) as place,
         (select id from transcripts where family_id = tests.fam_b()) as transcript,
         (select id from chapters where family_id = tests.fam_b()) as chapter,
         (select id from storytellers where family_id = tests.fam_b()) as teller,
         (select id from media_assets where family_id = tests.fam_b()) as media,
         (select id from profiles where user_id = tests.uid('eva@b.test')) as eva_profile,
         (select id from profiles where user_id = tests.uid('marieke@a.test')) as marieke_profile;
grant select on b to authenticated;

-- Fixtures: Truus' shared story has an earlier version and a recording with a raw transcript.
update stories set visibility = 'selected' where id = tests.story('famok');
insert into story_shares (family_id, story_id, user_id) values (tests.fam_a(), tests.story('famok'), tests.uid('saar@a.test'));
insert into story_versions (story_id, body_md, author) values (tests.story('famok'), 'EERDERE VERSIE met weggehaald geheim', 'human');
insert into media_assets (id, family_id, story_id, created_by, kind, storage_path) values
  ('55555555-0000-4000-8000-000000000001', tests.fam_a(), tests.story('famok'), tests.uid('truus@a.test'), 'audio', pg_temp.p('truus@a.test', 'opname.webm'));
insert into transcripts (family_id, media_asset_id, text, provider) values
  (tests.fam_a(), '55555555-0000-4000-8000-000000000001', 'RUW transcript', 'mock');
-- Truus' sealed capsule with a video.
insert into media_assets (id, family_id, created_by, kind, bucket, storage_path) values
  ('33333333-0000-4000-8000-000000000009', tests.fam_a(), tests.uid('truus@a.test'), 'video', 'capsules', pg_temp.p('truus@a.test', 'brief.mp4'));
insert into capsules (id, family_id, author_id, title, message_media_id) values
  ('44444444-0000-4000-8000-000000000009', tests.fam_a(), tests.uid('truus@a.test'), 'Voor later', '33333333-0000-4000-8000-000000000009');
insert into capsule_recipients (capsule_id, user_id) values ('44444444-0000-4000-8000-000000000009', tests.uid('saar@a.test'));
insert into storage.objects (bucket_id, name) values
  ('capsules', pg_temp.p('truus@a.test', 'brief.mp4')), ('media', pg_temp.p('truus@a.test', 'opname.webm'));

-- 1. Readers of a story do not get what was edited out
select tests.authenticate_as('saar@a.test');
select is((select count(*)::int from stories where id = tests.story('famok')), 1, 'recipient reads the shared story');
select is((select count(*)::int from story_versions), 0, 'recipient cannot read earlier versions');
select is((select count(*)::int from transcripts), 0, 'recipient cannot read the raw transcript');
select tests.authenticate_as('truus@a.test');
select ok((select count(*) from story_versions where story_id = tests.story('famok')) >= 1
          and (select count(*) from transcripts) = 1, 'the author still reads versions and transcript');

-- 2. A capsule cannot adopt someone else's media
select tests.authenticate_as('eva@b.test');
select throws_ok(
  format($$ insert into capsules (family_id, author_id, title, message_media_id) values (%L, %L, 'dief', '33333333-0000-4000-8000-000000000009') $$,
         tests.fam_b(), tests.uid('eva@b.test')),
  '42501', null, 'another family cannot attach a sealed capsule video to their own capsule');
select tests.authenticate_as('joris@a.test');
select throws_ok(
  format($$ insert into capsules (family_id, author_id, title, message_media_id) values (%L, %L, 'dief', '33333333-0000-4000-8000-000000000009') $$,
         tests.fam_a(), tests.uid('joris@a.test')),
  '42501', null, 'nor can a member of the same family');
select throws_ok(
  format($$ insert into capsules (family_id, author_id, title, message_media_id) values (%L, %L, 'x', '55555555-0000-4000-8000-000000000001') $$,
         tests.fam_a(), tests.uid('joris@a.test')),
  '42501', null, 'capsule media must live in the capsules bucket');

-- 3. A revoked member loses everything, including their own content
select tests.authenticate_as('marieke@a.test');
update memberships set status = 'revoked' where family_id = tests.fam_a() and user_id = tests.uid('truus@a.test');
select tests.authenticate_as('truus@a.test');
select is((select count(*)::int from stories) + (select count(*)::int from media_assets) + (select count(*)::int from capsules)
          + (select count(*)::int from storage.objects), 0, 'a revoked member reads nothing any more');
select is_empty($$ update capsules set letter_md = 'x' returning id $$, 'a revoked member cannot edit their capsule');
select is_empty($$ update media_assets set story_id = null returning id $$, 'a revoked member cannot detach media');
select is_empty($$ delete from media_assets returning id $$, 'a revoked member cannot delete media');
select is_empty($$ delete from storage.objects returning id $$, 'a revoked member cannot delete objects');
select throws_ok(
  $$ insert into capsule_recipients (capsule_id, email) values ('44444444-0000-4000-8000-000000000009', 'x@example.test') $$,
  '42501', null, 'a revoked member cannot add capsule recipients');
select tests.as_admin();
update memberships set status = 'active' where family_id = tests.fam_a() and user_id = tests.uid('truus@a.test');

-- 4. A released capsule is frozen, media included
select tests.as_service_role();
update capsules set status = 'released', released_at = now() where id = '44444444-0000-4000-8000-000000000009';
select tests.authenticate_as('truus@a.test');
select throws_ok($$ update media_assets set storage_path = storage_path || '.x' where id = '33333333-0000-4000-8000-000000000009' $$,
  '42501', null, 'media of a released capsule cannot be swapped');
select throws_ok($$ delete from media_assets where id = '33333333-0000-4000-8000-000000000009' $$,
  '42501', null, 'media of a released capsule cannot be deleted');
select is_empty($$ delete from storage.objects where bucket_id = 'capsules' returning id $$,
  'the stored video of a released capsule cannot be deleted');

-- 5. Shares only go to family members in a reading role
select tests.authenticate_as('joris@a.test');
update stories set status = 'approved', visibility = 'selected', vault = false where id = tests.story('vault');
select throws_ok(
  format($$ insert into story_shares (family_id, story_id, user_id) values (%L, %L, %L) $$, tests.fam_a(), tests.story('vault'), tests.uid('eva@b.test')),
  '42501', null, 'a story cannot be shared with someone outside the family');
select throws_ok(
  format($$ insert into story_shares (family_id, story_id, user_id) values (%L, %L, %L) $$, tests.fam_a(), tests.story('vault'), tests.uid('peter@a.test')),
  '42501', null, 'a story cannot be shared with a legacy contact');
select tests.as_admin();
insert into story_shares (family_id, story_id, user_id) values (tests.fam_a(), tests.story('vault'), tests.uid('peter@a.test'));
select tests.authenticate_as('peter@a.test');
select is((select count(*)::int from stories), 0, 'even with a share row a legacy contact reads no stories');

-- 6. References stay inside the family (same error for "other family" and "does not exist")
select tests.authenticate_as('joris@a.test');
select throws_ok(format($$ insert into timeline_events (family_id, story_id, date, label) values (%L, %L, '2000-01-01', 'x') $$, tests.fam_b(), tests.story('vault')),
  '42501', null, 'no timeline event in another family');
select throws_ok(format($$ insert into story_people (story_id, person_id) select %L, person from b $$, tests.story('vault')),
  '42501', null, 'no link to another family''s person');
select throws_ok(format($$ insert into story_places (story_id, place_id) select %L, place from b $$, tests.story('vault')),
  '42501', null, 'no link to another family''s place');
select throws_ok(format($$ insert into story_sources (story_id, paragraph_index, transcript_id, start_ms, end_ms) select %L, 0, transcript, 0, 1 from b $$, tests.story('vault')),
  '42501', null, 'no source mapping to another family''s transcript');
select throws_ok(format($$ update stories set chapter_id = (select chapter from b) where id = %L $$, tests.story('vault')),
  '42501', null, 'no chapter of another family');
select throws_ok(format($$ update stories set source_transcript_id = (select transcript from b) where id = %L $$, tests.story('vault')),
  '42501', null, 'no transcript of another family as story source');
select throws_ok(format($$ insert into story_people (story_id, person_id) values (%L, gen_random_uuid()) $$, tests.story('vault')),
  '42501', 'reference outside the family', 'a non-existent id gives the same answer (no existence oracle)');

-- 7. Nobody is placed in a family without accepting
select tests.authenticate_as('eva@b.test');
select throws_ok(
  format($$ insert into memberships (family_id, user_id, role, status) values (%L, %L, 'co_author', 'active') $$, tests.fam_b(), tests.uid('nobody@x.test')),
  '42501', null, 'an owner cannot make someone an active member directly');
select lives_ok(
  format($$ insert into memberships (id, family_id, role, status, invited_email) values ('66666666-0000-4000-8000-000000000001', %L, 'viewer', 'invited', 'Nobody@x.test') $$, tests.fam_b()),
  'an owner can invite by e-mail address');
select throws_ok($$ update memberships set status = 'active' where id = '66666666-0000-4000-8000-000000000001' $$,
  '42501', null, 'the owner cannot activate the invitation themselves');
select tests.authenticate_as('lotte@a.test');
select throws_ok($$ select accept_invitation('66666666-0000-4000-8000-000000000001') $$,
  '42501', null, 'someone else cannot accept the invitation');
select tests.authenticate_as('nobody@x.test');
select is((select count(*)::int from families), 0, 'the invited person is not in the family yet');
select is(accept_invitation('66666666-0000-4000-8000-000000000001'), tests.fam_b(), 'the invited person accepts');
select is((select count(*)::int from families), 1, 'and is now a member');

-- 8. Legacy reports
select tests.authenticate_as('peter@a.test');
select throws_ok(
  format($$ insert into legacy_events (family_id, subject_profile_id, type, reported_by) select %L, eva_profile, 'death_reported', %L from b $$, tests.fam_a(), tests.uid('peter@a.test')),
  '42501', null, 'a death can only be reported about someone in this family');
select throws_ok(
  format($$ insert into legacy_events (family_id, subject_profile_id, type, reported_by, evidence_path) select %L, marieke_profile, 'death_reported', %L, 'elders/akte.pdf' from b $$, tests.fam_a(), tests.uid('peter@a.test')),
  '42501', null, 'evidence must be in the reporter''s own folder');

-- 9. Vault
select tests.as_admin();
update stories set vault = true, visibility = 'private' where id = tests.story('vault');
insert into media_assets (id, family_id, story_id, created_by, kind, storage_path) values
  ('77777777-0000-4000-8000-000000000001', tests.fam_a(), tests.story('vault'), tests.uid('joris@a.test'), 'photo', pg_temp.p('joris@a.test', 'kluis.jpg'));
select tests.authenticate_as('joris@a.test');
select throws_ok($$ update media_assets set story_id = null where id = '77777777-0000-4000-8000-000000000001' $$,
  '23514', null, 'media cannot be detached from a vault story');
select throws_ok(
  format($$ insert into media_assets (family_id, created_by, kind, storage_path, ai_edited, original_asset_id) values (%L, %L, 'photo', %L, true, '77777777-0000-4000-8000-000000000001') $$,
         tests.fam_a(), tests.uid('joris@a.test'), pg_temp.p('joris@a.test', 'kopie.jpg')),
  '23514', null, 'no AI-edited copy of a vault photo');
select tests.authenticate_as('marieke@a.test');
select throws_ok(format($$ update stories set vault = false where id = %L $$, tests.story('vault')),
  '42501', null, 'the owner cannot take someone else''s story out of the vault');

-- 10. Helpers and smaller surfaces
select tests.authenticate_as('joris@a.test');
select throws_ok(format($$ select app.audit('family.deleted', 'families', %L) $$, tests.fam_b()),
  '42501', null, 'end users cannot write audit entries');
select throws_ok(format($$ update books set pdf_path = 'elders.pdf' where family_id = %L $$, tests.fam_a()),
  '42501', null, 'a co-author cannot repoint a book');
select throws_ok($$ update interviews set cost_cents = 0 $$, '42501', null, 'interview cost is written by the server only');
insert into consents (type, version) values ('ai_processing', '2026-11');
update consents set withdrawn_at = '2001-01-01';
select ok((select withdrawn_at > now() - interval '1 minute' from consents), 'a withdrawal is stamped now, not backdated');
select throws_ok($$ update consents set withdrawn_at = null $$, '42501', null, 'a withdrawal cannot be undone');

select * from finish();
rollback;
