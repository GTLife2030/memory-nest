-- Sealed capsules: readable by the author only; released only by the server.
begin;
select plan(19);
select tests.fixture();
select tests.as_admin();

insert into media_assets (id, family_id, created_by, kind, bucket, storage_path) values
  ('33333333-0000-4000-8000-000000000001', tests.fam_a(), tests.uid('joris@a.test'), 'video', 'capsules',
   tests.fam_a() || '/' || tests.uid('joris@a.test') || '/voor-saar.mp4');
insert into capsules (id, family_id, author_id, title, letter_md, message_media_id) values
  ('44444444-0000-4000-8000-000000000001', tests.fam_a(), tests.uid('joris@a.test'),
   'Voor Saar, op haar achttiende', 'Lieve Saar…', '33333333-0000-4000-8000-000000000001');
insert into capsule_recipients (capsule_id, user_id) values
  ('44444444-0000-4000-8000-000000000001', tests.uid('saar@a.test'));
insert into release_triggers (capsule_id, type, date) values
  ('44444444-0000-4000-8000-000000000001', 'date', '2044-03-14');

create function pg_temp.capsule_rows() returns int language sql as
  $$ select count(*)::int from public.capsules where id = '44444444-0000-4000-8000-000000000001' $$;

-- While sealed
select tests.authenticate_as('saar@a.test');
select is(pg_temp.capsule_rows(), 0, 'recipient cannot see a sealed capsule');
select is((select count(*)::int from capsule_recipients), 0, 'recipient cannot even see that they are a recipient');
select is((select count(*)::int from media_assets where bucket = 'capsules'), 0, 'recipient cannot see the capsule media');
select is((select count(*)::int from release_triggers), 0, 'recipient cannot see the release date');

select tests.authenticate_as('marieke@a.test');
select is(pg_temp.capsule_rows(), 0, 'the family owner cannot read another author''s sealed capsule');
select is((select count(*)::int from media_assets where bucket = 'capsules'), 0, 'the family owner cannot see its media');
select is((select count(*)::int from family_capsule_overview(tests.fam_a()) where title = 'Voor Saar, op haar achttiende'), 1,
  'the owner does see title and status through the overview');

select tests.authenticate_as('lotte@a.test');
select is((select count(*)::int from family_capsule_overview(tests.fam_a())), 0, 'a viewer gets no capsule overview');

select tests.authenticate_as('joris@a.test');
select is(pg_temp.capsule_rows(), 1, 'the author reads their own sealed capsule');
select throws_ok(
  $$ update capsules set status = 'released', released_at = now() where id = '44444444-0000-4000-8000-000000000001' $$,
  '42501', null, 'the author cannot release a capsule themselves');
select throws_ok(
  format($$ insert into capsules (family_id, author_id, title, status, released_at) values (%L, %L, 'x', 'released', now()) $$,
         tests.fam_a(), tests.uid('joris@a.test')),
  '42501', null, 'a capsule cannot be created already released');
select lives_ok(
  $$ update capsules set letter_md = 'Lieve Saar, …' where id = '44444444-0000-4000-8000-000000000001' $$,
  'the author can still edit a sealed capsule');

-- Release by the server
select tests.as_service_role();
select lives_ok(
  $$ update capsules set status = 'released', released_at = now() where id = '44444444-0000-4000-8000-000000000001' $$,
  'the release job releases the capsule');

select tests.authenticate_as('saar@a.test');
select is(pg_temp.capsule_rows(), 1, 'after release the recipient reads the capsule');
select is((select count(*)::int from media_assets where bucket = 'capsules'), 1, 'after release the recipient reads the media');
select is_empty(
  $$ update capsules set letter_md = 'aangepast' where id = '44444444-0000-4000-8000-000000000001' returning id $$,
  'a recipient cannot change a capsule');

select tests.authenticate_as('lotte@a.test');
select is(pg_temp.capsule_rows(), 0, 'other family members still cannot read a released capsule');

select tests.authenticate_as('joris@a.test');
select is_empty(
  $$ update capsules set letter_md = 'spijt' where id = '44444444-0000-4000-8000-000000000001' returning id $$,
  'a released capsule can no longer be edited by its author');
select is_empty(
  $$ delete from capsules where id = '44444444-0000-4000-8000-000000000001' returning id $$,
  'a released capsule cannot be deleted by its author');

select * from finish();
rollback;
