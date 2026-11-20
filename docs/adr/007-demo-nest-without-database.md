# ADR-007: Read-only demo nest when no database is configured

**Status:** accepted · 2026-11-20

The build prompt says the app runs "with only Supabase configured". In practice there are moments
with no database at all: a first look, a build container, a design review. Then sign-in is switched
off with an explanation and `/nest/demo` shows Familie de Wit from static data
(`lib/demo/de-wit.ts`). The route exists only while Supabase is not configured; with a database,
`demo` is not a valid family id and returns 404.
