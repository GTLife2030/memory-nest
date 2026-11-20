# ADR-002: RLS tests run on plain PostgreSQL with a Supabase shim

**Status:** accepted · 2026-11-20

The development container has no Docker, so `supabase start` cannot run. The RLS suite must
still run on every change.

**Decision.** `scripts/db-test.sh` rebuilds a throwaway database on PostgreSQL 16 (pgvector,
pgTAP), applies `scripts/sql/supabase_shim.sql` (roles `anon`/`authenticated`/`service_role`,
`auth.users`, `auth.uid()`, `storage.objects`, Supabase-like default grants), then the real
migrations, then `supabase/tests`. The test files follow the `supabase test db` convention, so
they run unchanged against a real project.

**Consequence.** The shim can differ from Supabase. Until the suite has run once against the
hosted project (`supabase test db --linked`), "RLS tests green" means green on the shim.
Storage policies in particular are tested against a simplified `storage.objects`.
