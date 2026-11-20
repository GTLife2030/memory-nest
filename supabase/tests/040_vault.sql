-- Vault stories: author + owner only, and no AI artefact can ever be attached.
begin;
select plan(13);
select tests.fixture();
select tests.as_admin();

-- A plain story of Joris with a recording and transcript, to test turning it into a vault story.
insert into stories (id, family_id, created_by, title) values (tests.story('plain'), tests.fam_a(), tests.uid('joris@a.test'), 'Gewoon');
insert into media_assets (id, family_id, story_id, created_by, kind, storage_path) values
  ('11111111-0000-4000-8000-000000000001', tests.fam_a(), tests.story('plain'), tests.uid('joris@a.test'), 'audio',
   tests.fam_a() || '/' || tests.uid('joris@a.test') || '/plain.webm'),
  ('11111111-0000-4000-8000-000000000002', tests.fam_a(), tests.story('vault'), tests.uid('joris@a.test'), 'audio',
   tests.fam_a() || '/' || tests.uid('joris@a.test') || '/vault.webm');
insert into transcripts (id, family_id, media_asset_id, text, provider) values
  ('22222222-0000-4000-8000-000000000001', tests.fam_a(), '11111111-0000-4000-8000-000000000001', 'tekst', 'mock');

-- Even the service role (the AI pipeline) cannot attach AI output to a vault story.
select tests.as_service_role();
select throws_ok(
  $$ insert into transcripts (family_id, media_asset_id, text, provider)
     values (tests.fam_a(), '11111111-0000-4000-8000-000000000002', 'mag niet', 'mock') $$,
  '23514', 'vault stories are never processed by AI', 'no transcript for media of a vault story');
select throws_ok(
  $$ insert into story_sources (story_id, paragraph_index, transcript_id, start_ms, end_ms)
     values (tests.story('vault'), 0, '22222222-0000-4000-8000-000000000001', 0, 10) $$,
  '23514', null, 'no source mapping on a vault story');
select throws_ok(
  $$ insert into story_versions (story_id, body_md, author) values (tests.story('vault'), 'AI-tekst', 'ai') $$,
  '23514', null, 'no AI-authored version of a vault story');
select lives_ok(
  $$ insert into story_versions (story_id, body_md, author) values (tests.story('vault'), 'Eigen tekst', 'human') $$,
  'human versions of a vault story are fine');
select throws_ok(
  $$ update media_assets set ai_description = 'Een foto' where id = '11111111-0000-4000-8000-000000000002' $$,
  '23514', null, 'no AI description on media of a vault story');
select throws_ok(
  $$ update stories set source_transcript_id = '22222222-0000-4000-8000-000000000001' where id = tests.story('vault') $$,
  '23514', null, 'a vault story cannot point at a transcript');
select throws_ok(
  $$ update media_assets set story_id = tests.story('vault') where id = '11111111-0000-4000-8000-000000000001' $$,
  '23514', null, 'transcribed media cannot be moved into a vault story');

-- Turning a story into a vault story
select tests.authenticate_as('joris@a.test');
select throws_ok(
  $$ update stories set vault = true where id = tests.story('plain') $$,
  '23514', null, 'a story with a transcript cannot become a vault story');
select throws_ok(
  $$ update stories set visibility = 'family' where id = tests.story('vault') $$,
  '23514', null, 'a vault story cannot be made visible to the family');
select tests.as_admin();
delete from transcripts where id = '22222222-0000-4000-8000-000000000001';
select tests.authenticate_as('joris@a.test');
select lives_ok(
  $$ update stories set vault = true where id = tests.story('plain') $$,
  'after removing the transcript the story can become a vault story');

-- Visibility
select tests.authenticate_as('truus@a.test');
select is((select count(*)::int from stories where vault), 0, 'co-authors do not see other people''s vault stories');
select is((select count(*)::int from media_assets where story_id in (tests.story('vault'), tests.story('plain'))), 0,
  'media of a vault story is hidden from other co-authors');
select tests.authenticate_as('saar@a.test');
select is((select count(*)::int from stories where vault), 0, 'recipients do not see vault stories');

select * from finish();
rollback;
