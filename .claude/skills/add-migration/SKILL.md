---
name: add-migration
description: Add a database migration for Memory Nest (new table, column, policy or trigger) with RLS and pgTAP tests. Use for any schema change.
---

# Add a migration

1. Create `supabase/migrations/<UTC timestamp>_<snake_case_name>.sql`. Never edit an existing
   migration; a fix is a new file.
2. For a new table:
   - columns `id uuid primary key default gen_random_uuid()`, `created_at`, `updated_at`;
     family-scoped tables get `family_id uuid not null references public.families (id) on delete cascade`
   - `alter table … enable row level security; alter table … force row level security;`
   - explicit grants (`grant select, insert, … to authenticated`); nothing for `anon`
   - policies built on `app.has_role(family_id, …)`, `app.can_read_story(…)`, `app.can_write_story(…)`.
     Do not query other RLS-protected tables directly inside a policy; add a `security definer`
     helper in schema `app` with `set search_path = ''` and revoke it from `public`.
   - end the file with `select app.apply_standard_triggers();`
3. If the table can hold AI output, add a `guard_vault` trigger (see `…000400_guards.sql`).
4. Write the tests first in `supabase/tests/NNN_<topic>.sql` (pgTAP, wrapped in `begin; … rollback;`).
   Use `tests.fixture()`, `tests.authenticate_as('joris@a.test')`, `tests.as_service_role()`.
   Cover every role that should and should not get access, and add a row to `tests.populate()`
   in `000_setup.sql` so the isolation test covers the new table.
5. Run `pnpm test:db`. Then weaken the new policy by hand once and confirm a test fails.
6. Update `lib/supabase/types.ts` (or regenerate it) and `docs/ARCHITECTURE.md` if roles changed.
7. Ask the `rls-reviewer` agent to review the migration.
