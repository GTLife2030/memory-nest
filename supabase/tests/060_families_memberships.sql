-- Families, memberships, sign-up bootstrap.
begin;
select plan(16);
select tests.fixture();

-- sign-up creates a profile; create_family makes the caller owner
select tests.as_admin();
select is((select count(*)::int from profiles where user_id = tests.uid('nobody@x.test')), 1, 'a profile is created on sign-up');

select tests.authenticate_as('nobody@x.test');
select is((select count(*)::int from families), 0, 'a new user sees no families');
select lives_ok($$ select create_family('Familie Nieuw') $$, 'a signed-in user can create a family');
select is((select count(*)::int from families where name = 'Familie Nieuw'), 1, 'and then sees it');
select is((select role::text from memberships where user_id = tests.uid('nobody@x.test')), 'owner', 'as its owner');
select throws_ok(
  $$ insert into families (name) values ('Achterdeur') $$, '42501', null, 'families cannot be inserted directly');

select tests.as_anon();
select throws_ok($$ select create_family('Anoniem') $$, '42501', null, 'anonymous visitors cannot create a family');
select throws_ok($$ select count(*) from stories $$, '42501', null, 'anonymous visitors cannot query stories');

-- role escalation
select tests.authenticate_as('joris@a.test');
select is_empty(
  format($$ update memberships set role = 'owner' where user_id = %L and family_id = %L returning id $$,
         tests.uid('joris@a.test'), tests.fam_a()),
  'a co-author cannot promote themselves');
select throws_ok(
  format($$ insert into memberships (family_id, user_id, role, status) values (%L, %L, 'owner', 'active') $$,
         tests.fam_a(), tests.uid('joris@a.test')),
  '42501', null, 'a co-author cannot add an owner membership');
select is_empty(
  format($$ update families set name = 'Familie Joris' where id = %L returning id $$, tests.fam_a()),
  'a co-author cannot rename the family');

select tests.authenticate_as('saar@a.test');
select is((select count(*)::int from memberships), 1, 'a recipient sees only their own membership');

-- owner
select tests.authenticate_as('marieke@a.test');
select throws_ok(
  format($$ update families set plan = 'familie', storage_quota_gb = 1000 where id = %L $$, tests.fam_a()),
  '42501', null, 'an owner cannot change plan or quota');
select isnt_empty(
  format($$ update families set name = 'Familie de Wit' where id = %L returning id $$, tests.fam_a()),
  'an owner can rename the family');
select throws_ok(
  format($$ delete from memberships where family_id = %L and user_id = %L $$, tests.fam_a(), tests.uid('marieke@a.test')),
  '23514', null, 'the last owner cannot be removed');
select isnt_empty(
  format($$ update memberships set status = 'revoked' where family_id = %L and user_id = %L returning id $$,
         tests.fam_a(), tests.uid('lotte@a.test')),
  'an owner can revoke a member');

select * from finish();
rollback;
