-- Who can read and write which story.
begin;
select plan(24);
select tests.fixture();

create function pg_temp.sees(p_key text) returns boolean language sql as
  $$ select exists (select 1 from public.stories where id = tests.story(p_key)) $$;

-- owner: everything in the family, including the vault and private stories
select tests.authenticate_as('marieke@a.test');
select ok(pg_temp.sees('priv'), 'owner reads a private story of a co-author');
select ok(pg_temp.sees('vault'), 'owner reads a vault story');
select ok(pg_temp.sees('famdr'), 'owner reads drafts');

-- co-author: own stories + visibility = family
select tests.authenticate_as('joris@a.test');
select ok(pg_temp.sees('famok'), 'co-author reads an approved family story');
select ok(pg_temp.sees('famdr'), 'co-author reads a family draft');
select ok(not pg_temp.sees('priv'), 'co-author does not read another co-author''s private story');
select ok(pg_temp.sees('vault'), 'co-author reads their own vault story');
select ok(not pg_temp.sees('shared'), 'co-author does not read a story shared with someone else');
select lives_ok(
  format($$ insert into stories (family_id, created_by, title) values (%L, %L, 'Nieuw verhaal') $$, tests.fam_a(), tests.uid('joris@a.test')),
  'co-author creates a story');
select throws_ok(
  format($$ insert into stories (family_id, created_by, title) values (%L, %L, 'Namens Truus') $$, tests.fam_a(), tests.uid('truus@a.test')),
  '42501', null, 'co-author cannot create a story as someone else');
select is_empty(
  format($$ update stories set title = 'aangepast' where id = %L returning id $$, tests.story('famok')),
  'co-author cannot edit another co-author''s story');
select isnt_empty(
  format($$ update stories set title = 'Kluisverhaal 2' where id = %L returning id $$, tests.story('vault')),
  'co-author edits their own story');
select throws_ok(
  format($$ update stories set created_by = %L where id = %L $$, tests.uid('truus@a.test'), tests.story('vault')),
  '42501', null, 'authorship cannot be reassigned');

select tests.authenticate_as('truus@a.test');
select ok(not pg_temp.sees('vault'), 'another co-author does not read a vault story');

-- viewer: approved family stories only
select tests.authenticate_as('lotte@a.test');
select ok(pg_temp.sees('famok'), 'viewer reads an approved family story');
select ok(not pg_temp.sees('famdr'), 'viewer does not read drafts');
select ok(not pg_temp.sees('priv') and not pg_temp.sees('vault'), 'viewer reads no private or vault stories');
select throws_ok(
  format($$ insert into stories (family_id, created_by, title) values (%L, %L, 'x') $$, tests.fam_a(), tests.uid('lotte@a.test')),
  '42501', null, 'viewer cannot create stories');

-- recipient: only what was explicitly shared, and only once approved
select tests.authenticate_as('saar@a.test');
select ok(pg_temp.sees('shared'), 'recipient reads a story shared with them');
select ok(not pg_temp.sees('shdr'), 'recipient does not read a shared story that is still a draft');
select ok(not pg_temp.sees('famok'), 'recipient does not read family stories that were not shared');
select is((select count(*)::int from people), 0, 'recipient cannot list the people in the family');

-- legacy contact: no story access at all
select tests.authenticate_as('peter@a.test');
select is((select count(*)::int from stories), 0, 'legacy contact reads no stories');
select is((select count(*)::int from media_assets) + (select count(*)::int from transcripts), 0,
  'legacy contact reads no media or transcripts');

select * from finish();
rollback;
