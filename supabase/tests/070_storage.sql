-- Storage objects follow the media_assets row that points at them.
begin;
select plan(11);
select tests.fixture();
select tests.as_admin();

create function pg_temp.p(p_user text, p_file text) returns text language sql as
  $$ select tests.fam_a() || '/' || tests.uid(p_user) || '/' || p_file $$;

insert into media_assets (family_id, story_id, created_by, kind, storage_path) values
  (tests.fam_a(), tests.story('famok'), tests.uid('truus@a.test'), 'photo', pg_temp.p('truus@a.test', 'bakkerij.jpg')),
  (tests.fam_a(), tests.story('priv'), tests.uid('truus@a.test'), 'photo', pg_temp.p('truus@a.test', 'prive.jpg'));
insert into media_assets (id, family_id, created_by, kind, bucket, storage_path) values
  ('33333333-0000-4000-8000-000000000001', tests.fam_a(), tests.uid('joris@a.test'), 'video', 'capsules', pg_temp.p('joris@a.test', 'capsule.mp4'));
insert into capsules (id, family_id, author_id, title, message_media_id) values
  ('44444444-0000-4000-8000-000000000001', tests.fam_a(), tests.uid('joris@a.test'), 'Voor Saar', '33333333-0000-4000-8000-000000000001');
insert into capsule_recipients (capsule_id, user_id) values ('44444444-0000-4000-8000-000000000001', tests.uid('saar@a.test'));
insert into storage.objects (bucket_id, name) values
  ('media', pg_temp.p('truus@a.test', 'bakkerij.jpg')), ('media', pg_temp.p('truus@a.test', 'prive.jpg')),
  ('capsules', pg_temp.p('joris@a.test', 'capsule.mp4')),
  ('evidence', pg_temp.p('peter@a.test', 'akte.pdf'));

create function pg_temp.sees(p_bucket text, p_user text, p_file text) returns boolean language sql as
  $$ select exists (select 1 from storage.objects where bucket_id = p_bucket and name = pg_temp.p(p_user, p_file)) $$;

select tests.authenticate_as('lotte@a.test');
select ok(pg_temp.sees('media', 'truus@a.test', 'bakkerij.jpg'), 'viewer can fetch the photo of a family story');
select ok(not pg_temp.sees('media', 'truus@a.test', 'prive.jpg'), 'viewer cannot fetch the photo of a private story');
select throws_ok(
  format($$ insert into storage.objects (bucket_id, name) values ('media', %L) $$, pg_temp.p('lotte@a.test', 'x.jpg')),
  '42501', null, 'viewer cannot upload');

select tests.authenticate_as('marieke@a.test');
select ok(not pg_temp.sees('capsules', 'joris@a.test', 'capsule.mp4'), 'owner cannot fetch another author''s capsule video');

select tests.authenticate_as('saar@a.test');
select ok(not pg_temp.sees('capsules', 'joris@a.test', 'capsule.mp4'), 'recipient cannot fetch a sealed capsule video');

select tests.authenticate_as('eva@b.test');
select is((select count(*)::int from storage.objects), 0, 'another family sees no objects');
select throws_ok(
  format($$ insert into storage.objects (bucket_id, name) values ('media', %L) $$, pg_temp.p('eva@b.test', 'x.jpg')),
  '42501', null, 'cannot upload into another family''s folder');
select throws_ok(
  format($$ insert into media_assets (family_id, created_by, kind, storage_path) values (%L, %L, 'photo', %L) $$,
         tests.fam_b(), tests.uid('eva@b.test'), pg_temp.p('truus@a.test', 'claim.jpg')),
  '23514', null, 'a media row cannot claim an object path of another family');

select tests.authenticate_as('joris@a.test');
select lives_ok(
  format($$ insert into storage.objects (bucket_id, name) values ('media', %L) $$, pg_temp.p('joris@a.test', 'nieuw.jpg')),
  'co-author uploads into their own folder');

select tests.authenticate_as('peter@a.test');
select ok(not pg_temp.sees('evidence', 'peter@a.test', 'akte.pdf'), 'evidence cannot be read back, not even by the uploader');

select tests.as_service_role();
update capsules set status = 'released', released_at = now() where id = '44444444-0000-4000-8000-000000000001';
select tests.authenticate_as('saar@a.test');
select ok(pg_temp.sees('capsules', 'joris@a.test', 'capsule.mp4'), 'after release the recipient can fetch the capsule video');

select * from finish();
rollback;
