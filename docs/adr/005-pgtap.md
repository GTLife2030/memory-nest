# ADR-005: pgTAP for database tests

**Status:** accepted · 2026-11-20

pgTAP is available locally (apt), on Supabase (extension) and in CI. Tests are one transaction per
file with `rollback`, share fixtures through `supabase/tests/000_setup.sql` (schema `tests`),
and impersonate users by setting the role and JWT claims exactly as PostgREST does.
`010_structure.sql` checks the catalog, so a future table without forced RLS, without the standard
columns, or with a privilege for `anon` fails the suite without anyone writing a test for it.
