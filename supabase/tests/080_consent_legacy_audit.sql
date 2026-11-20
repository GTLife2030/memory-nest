-- Consent, legacy reports, billing tables and the audit log.
begin;
select plan(15);
select tests.fixture();
create temp table tests_profile on commit drop as
  select id from public.profiles where user_id = tests.uid('marieke@a.test');
grant select on tests_profile to authenticated;

-- consents
select tests.authenticate_as('joris@a.test');
select lives_ok(
  $$ insert into consents (type, version) values ('special_category_health', '2026-11') $$, 'a user records their own consent');
select throws_ok(
  format($$ insert into consents (user_id, type, version) values (%L, 'ai_processing', '2026-11') $$, tests.uid('truus@a.test')),
  '42501', null, 'nobody can consent on behalf of someone else');
select throws_ok(
  $$ update consents set version = '1999-01' $$, '42501', null, 'a consent record cannot be rewritten');
select lives_ok($$ update consents set withdrawn_at = now() $$, 'consent can be withdrawn');
select throws_ok($$ delete from consents $$, '42501', null, 'consent history cannot be deleted');
select tests.authenticate_as('marieke@a.test');
select is((select count(*)::int from consents), 0, 'the family owner cannot read other people''s consents');
select is((select count(*)::int from profiles), 1, 'profiles (phone numbers) are visible to their owner only');

-- legacy
select tests.authenticate_as('peter@a.test');
select lives_ok(
  format($$ insert into legacy_events (family_id, subject_profile_id, type, reported_by)
            select %L, p.id, 'death_reported', %L from tests_profile p $$, tests.fam_a(), tests.uid('peter@a.test')),
  'a legacy contact can report a death');
select throws_ok(
  format($$ insert into legacy_events (family_id, subject_profile_id, type, reported_by)
            select %L, p.id, 'confirmed', %L from tests_profile p $$, tests.fam_a(), tests.uid('peter@a.test')),
  '42501', null, 'a legacy contact cannot mark a death as confirmed');
select throws_ok(
  $$ update legacy_events set type = 'confirmed' $$, '42501', null, 'legacy events cannot be changed by end users');
select tests.authenticate_as('lotte@a.test');
select throws_ok(
  format($$ insert into legacy_events (family_id, subject_profile_id, type, reported_by)
            select %L, p.id, 'death_reported', %L from tests_profile p $$, tests.fam_a(), tests.uid('lotte@a.test')),
  '42501', null, 'a viewer cannot report a death');

-- billing and usage
select tests.authenticate_as('joris@a.test');
select is((select count(*)::int from subscriptions) + (select count(*)::int from usage_counters), 0,
  'a co-author sees no billing or usage data');
select throws_ok(
  format($$ insert into subscriptions (family_id, product, status) values (%L, 'familie_nest', 'active') $$, tests.fam_a()),
  '42501', null, 'subscriptions are written by the server only');

-- audit log
select throws_ok($$ select count(*) from audit_log $$, '42501', null, 'end users cannot read the audit log');
select tests.as_service_role();
select app.audit('test.event', 'families', tests.fam_a());
select throws_ok($$ delete from audit_log $$, '42501', 'audit_log is append-only', 'the audit log is append-only, also for the server');

select * from finish();
rollback;
