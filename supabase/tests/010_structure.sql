-- Structural guarantees that must hold for every table, including ones added later.
begin;
select plan(5);

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity) $$,
  'every public table has RLS enabled and forced');

select is_empty(
  $$ select table_name, privilege_type from information_schema.role_table_grants
     where table_schema = 'public' and grantee = 'anon' $$,
  'anon has no privileges on any public table');

select is_empty(
  $$ select c.table_name from information_schema.columns c
     join information_schema.tables t using (table_schema, table_name)
     where c.table_schema = 'public' and c.column_name = 'family_id' and t.table_type = 'BASE TABLE'
       and not exists (select 1 from pg_trigger g where g.tgrelid = ('public.' || c.table_name)::regclass
                       and g.tgname = 'prevent_family_change') $$,
  'every family-scoped table guards family_id');

select is_empty(
  $$ select t.table_name from information_schema.tables t
     where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
       and (select count(*) from information_schema.columns c
            where c.table_schema = 'public' and c.table_name = t.table_name
              and c.column_name in ('id', 'created_at', 'updated_at')) <> 3 $$,
  'every table has id, created_at and updated_at');

select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('app', 'public') and p.prosecdef
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%') $$,
  'every SECURITY DEFINER function pins its search_path');

select * from finish();
rollback;
