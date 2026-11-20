-- Cross-family isolation: nobody in family B, and nobody without a family, sees anything of family A.
begin;
select plan(1 + 3 * (select count(*)::int from information_schema.columns c
                     join information_schema.tables t using (table_schema, table_name)
                     where c.table_schema = 'public' and c.column_name = 'family_id' and t.table_type = 'BASE TABLE')
            + 6 + 4);
select tests.fixture();

create temp table fam_tables on commit drop as
  select c.table_name::text as t from information_schema.columns c
  join information_schema.tables tb using (table_schema, table_name)
  where c.table_schema = 'public' and c.column_name = 'family_id' and tb.table_type = 'BASE TABLE';
grant select on fam_tables to authenticated, anon, service_role;

select ok((select count(*) from fam_tables) >= 20, 'the family-scoped tables are discovered from the catalog');

-- The fixture really put a row of family A in every table (otherwise "sees nothing" proves nothing).
select tests.as_service_role();
select isnt(
  (select (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I where family_id = %L', t, tests.fam_a()), false, true, '')))[1]::text::int),
  0, format('fixture has rows of family A in %s', t)) from fam_tables order by t;

select tests.authenticate_as('eva@b.test');
select is(
  (select (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I where family_id = %L', t, tests.fam_a()), false, true, '')))[1]::text::int),
  0, format('owner of family B sees no rows of family A in %s', t)) from fam_tables order by t;

select tests.authenticate_as('nobody@x.test');
select is(
  (select (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', t), false, true, '')))[1]::text::int),
  0, format('a user without a family sees no rows at all in %s', t)) from fam_tables order by t;

-- Tables that hang off a family through a parent.
select tests.authenticate_as('eva@b.test');
select is((select count(*)::int from story_versions v join stories s on s.id = v.story_id), 1, 'story_versions: only own family');
select is((select count(*)::int from story_sources), 1, 'story_sources: only own family');
select is((select count(*)::int from story_people), 1, 'story_people: only own family');
select is((select count(*)::int from story_places), 1, 'story_places: only own family');
select is((select count(*)::int from capsule_recipients), 1, 'capsule_recipients: only own capsules');
select is((select count(*)::int from release_triggers), 1, 'release_triggers: only own capsules');

-- Writing into another family is refused.
select throws_ok(
  format($$ insert into stories (family_id, created_by, title) values (%L, %L, 'indringer') $$, tests.fam_a(), tests.uid('eva@b.test')),
  '42501', null, 'cannot insert a story into another family');
select throws_ok(
  format($$ insert into memberships (family_id, user_id, role, status) values (%L, %L, 'owner', 'active') $$, tests.fam_a(), tests.uid('eva@b.test')),
  '42501', null, 'cannot add yourself to another family');
select is_empty(
  format($$ update stories set title = 'gekaapt' where family_id = %L returning id $$, tests.fam_a()),
  'cannot update stories of another family');
select throws_ok(
  format($$ update stories set family_id = %L where family_id = %L $$, tests.fam_a(), tests.fam_b()),
  '42501', 'family_id is immutable', 'cannot move a story into another family');

select * from finish();
rollback;
