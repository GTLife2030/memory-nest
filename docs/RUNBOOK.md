# Runbook

## First setup

```bash
pnpm install
cp .env.example .env.local   # fill in the Supabase block; leave the rest empty for demo mode
pnpm dev
```

Without the Supabase block the app still starts: sign-in is off and `/nest/demo` shows the
read-only demo nest.

## Supabase project

1. Region: EU. The project is in eu-west-1 (Ireland); decided, see PRIVACY.md.
2. Apply the schema: `supabase link --project-ref <ref>` then `supabase db push`.
   Migrations are plain SQL in `supabase/migrations`; never change the database by hand.
3. Auth → URL configuration: Site URL = production URL; add `<site>/auth/confirm` to the redirect list.
4. Auth → Email templates → Magic Link: use a link that works on any device:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink`
   (the default link only works in the browser that asked for it, which fails for people who
   read mail on another device).
5. Auth → Providers: enable Google and Apple when their keys exist (buttons arrive with them).
6. Generate types: `supabase gen types typescript --linked > lib/supabase/types.ts`.
7. Run the RLS suite against the project: `supabase test db --linked`.
8. Before real families: Pro plan (daily backups, no pausing), custom SMTP, restore test.

### Seeding

`supabase/seed/seed.sql` creates demo family "Familie de Wit". Demo data only. It has been run
against local PostgreSQL, not yet against a hosted project: hosted Auth may need additional
`auth.identities` rows before the seeded users can sign in. Verify on first use.

## Local database without Docker

```bash
./scripts/db-local-start.sh   # system PostgreSQL 16 with pgvector and pgTAP
pnpm test:db                  # rebuild from migrations + run supabase/tests
pnpm db:seed                  # rebuild + demo family
```

`scripts/sql/supabase_shim.sql` stands in for the Supabase roles and the `auth`/`storage`
schemas (ADR-002). With Docker, prefer `supabase start` and `supabase test db`.

## Tests

`pnpm check` (fast) · `pnpm test:db` · `pnpm test:e2e` · `pnpm test:worker` · `pnpm check:all`.

- E2E builds and serves on :3100. A server already on that port is reused, so stop it after
  code changes: `fuser -k 3100/tcp`.
- `tests/e2e/auth.spec.ts` (the real sign-in journey) runs only with the three Supabase variables set.
  In CI: repository secrets `E2E_SUPABASE_URL`, `E2E_SUPABASE_ANON_KEY`, `E2E_SUPABASE_SERVICE_ROLE_KEY`.
  Use a separate test project, never production.
- Lighthouse: app on :3100, then `node scripts/lighthouse.mjs` (fails under 95).

## Deploy

Not decided yet (ADR pending): Vercel with functions in an EU region, or an EU-only host.
Requirements either way: Node 22, the variables from `.env.example`, HTTPS, EU region.
The worker deploys from `worker/Dockerfile` to an EU container host with `WORKER_TOKEN` set.

## Incidents

- **Suspected data leak**: disable sign-ins (Supabase Auth settings), rotate the service-role and
  anon keys, preserve logs, inform the privacy lead. A reportable breach must reach the Autoriteit
  Persoonsgegevens within 72 hours.
- **Key rotation**: Supabase → Settings → API → roll keys; update the host's variables; redeploy.
- **Restore**: Supabase → Database → Backups (Pro). Run a restore test every quarter and record it here.

| Date | Restore test                           | Result |
| ---- | -------------------------------------- | ------ |
| —    | not yet run (free plan has no backups) | —      |
