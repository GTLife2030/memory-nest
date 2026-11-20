# Memory Nest

Dutch-first, voice-first family memory platform ("Een blijvende herinnering tussen generaties").
Core promise: "Je hoeft niets te schrijven. Vertel het gewoon."
Read `AGENTS.md` first: this Next.js version differs from older ones; its docs are in
`node_modules/next/dist/docs/`.

## Commands

| Command                                | What it does                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`                             | Dev server on :3000                                                          |
| `pnpm check`                           | lint + typecheck + unit tests (also the pre-commit hook)                     |
| `pnpm test:db`                         | Rebuild a throwaway database from the migrations and run the pgTAP RLS suite |
| `pnpm db:seed`                         | Same rebuild, then load demo family "Familie de Wit"                         |
| `pnpm test:e2e`                        | Production build + Playwright (desktop and phone, axe included)              |
| `pnpm test:worker`                     | pytest for the Python worker                                                 |
| `pnpm check:all`                       | Everything above; run before a phase report                                  |
| `./scripts/db-local-start.sh`          | Start local PostgreSQL when Docker/`supabase start` is unavailable           |
| `node scripts/screenshots.mjs phase-N` | Checkpoint screenshots (app must run on :3100)                               |

## Structure

- `app/` routes: `(marketing)`, `(auth)/inloggen`, `(app)/nest/[familyId]`, `auth/` handlers, `api/`, `design/` (living style guide)
- `components/ui/` design-system components, `components/layout/` header, logo, toggles
- `lib/adapters/<service>/{types,mock}.ts` + `lib/adapters/registry.ts` (the only entry point to external services)
- `lib/server/` server-only code (env, logger, rate limit, data access); `lib/supabase/` clients
- `messages/nl.json` all UI copy (`en.json` prepared); `prompts/` versioned Dutch system prompts
- `supabase/migrations/` schema + RLS, `supabase/tests/` pgTAP, `supabase/seed/`
- `worker/` Python FastAPI (WeasyPrint, ffmpeg); `tests/unit`, `tests/e2e`; `docs/` (plans, adr, ARCHITECTURE, PRIVACY, THREATS, RUNBOOK)

## Conventions

- Code, comments, commits and docs in English. UI copy, prompts and seed data in Dutch.
- Dutch tone: calm, warm, B1 level, informal "je". No exclamation marks, no urgency, no
  gamification words. Say "voor later", never "na je dood". `tests/unit/copy.test.ts` enforces part of this.
- Server Components by default; `"use client"` only for interaction. Pages render per request
  (CSP nonce), so do not add caching directives without an ADR.
- Every external service goes through `getAdapter(name)`. AI-bound calls take an `AiContext`
  as first argument and return `costCents`.
- Size everything in rem and use the tokens in `app/globals.css`; elder mode is a root font-size change.
  Text colours: only the pairs in `lib/design/tokens.ts` (`taupe` and `terracotta` are not text colours).
- Interactive elements use `min-target`; icon-only buttons use `IconButton` with a `label`.
- Authorisation lives in RLS. Application checks are for UX only; never rely on them for access.
- A new table needs: RLS enabled + forced, explicit grants, policies, `select app.apply_standard_triggers()`,
  and pgTAP tests (including cross-family isolation). `supabase/tests/010_structure.sql` fails otherwise.
- Tests first for RLS rules, entitlements, triggers and question selection.
- Deviations from the build prompt get an ADR in `docs/adr/`.

## Never

- Never put a secret in client code or a `NEXT_PUBLIC_` variable. Secrets are read in `lib/server/env.ts` only.
- Never import `lib/supabase/admin.ts` (service role) from `app/**` components or `components/**`.
- Never send vault content to an AI service, and never bypass `getAdapter` to reach one.
- Never hard-code user-facing strings; every string goes in `messages/nl.json`.
- Never change the database outside `supabase/migrations/*.sql`; never edit an applied migration.
- Never log story text, transcripts, e-mail addresses or phone numbers.
- Never add voice cloning, AI avatars, "talk to the deceased" chat or face recognition.
- Never add streaks, countdowns, sales pop-ups or time-outs during recording.
- Never add a paid service without asking the founder first.
- Never skip tests or commit with `--no-verify`.

## Working method

Per phase: plan in `docs/plans/phase-N.md` → wait for "go" → build → test → report (what was
built, test results, open risks, next steps). Before a phase report: `pnpm check:all`, the
`release-check` skill, `/security-review`, and the `rls-reviewer`, `a11y-reviewer` and
`copy-reviewer` agents on the changes.
