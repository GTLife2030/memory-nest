# ADR-003: Migrations as files, applied with the Supabase CLI

**Status:** accepted · 2026-11-20

The build prompt suggests the Supabase MCP server for migrations and type generation. It was not
available in the build session, and the hosted project was not reachable from it. Migrations are
SQL files in `supabase/migrations` (which CLAUDE.md requires anyway) and are applied with
`supabase db push`. `lib/supabase/types.ts` is hand-written for the three tables phase 0 reads
and must be replaced by generated types once the project is linked.
