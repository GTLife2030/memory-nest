# Phase 0 report — Foundation & design system

2026-11-20 · Plan: [phase-0.md](phase-0.md)

## Acceptance

| #   | Criterion                                           | Result                                                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Sign in with a magic link and land in your own nest | **Built, not verified end to end.** The build container could not reach the Supabase project (network policy) and had no keys. The journey is written as `tests/e2e/auth.spec.ts` and runs as soon as the three Supabase variables are available (CI secrets or `.env.local`). |
| A2  | RLS tests green, including cross-family isolation   | **Green on local PostgreSQL with the Supabase shim** (218 assertions). Not yet run against the hosted project.                                                                                                                                                                 |
| A3  | Lighthouse accessibility ≥ 95, axe clean            | **Met.** Lighthouse 100 on `/`, `/inloggen`, `/design`, `/nest/demo`; axe (WCAG 2.2 AA) clean on every screen in normal and elder mode, desktop and phone.                                                                                                                     |
| A4  | App runs with only Supabase configured              | **Met, and beyond:** all ten adapters mock, "demo-modus" badge names them; without Supabase a read-only demo nest is available.                                                                                                                                                |
| A5  | Lint, typecheck, tests on every commit and in CI    | **Hook met** (pre-commit runs on every commit here). **CI workflow written, never run**: nothing has been pushed to GitHub yet.                                                                                                                                                |

## What was built

- Next.js 16 app (TypeScript strict, Tailwind 4, next-intl), Dutch copy in `messages/nl.json`, lint rule against hard-coded strings.
- Design system: tokens, self-hosted Fraunces / Inter / EB Garamond, elder mode (21px, 56px targets), 14 components, living style guide at `/design`.
- Screens: landing, sign-in, check-your-mail, nest home (empty state), demo nest (Familie de Wit), offline, not-found, error.
- Auth: magic link (both link styles), session refresh in `proxy.ts`, first-nest bootstrap, sign-out, rate limit.
- Database: complete data model (31 tables), RLS enabled and forced everywhere, guard triggers for vault, capsules, memberships, audit log, storage policies for five private buckets, seed for Familie de Wit.
- Adapters: ten interfaces with Dutch mocks, registry with vault refusal and cost logging.
- PWA shell: manifest, icons, service worker with offline fallback (caches no private pages).
- Python worker skeleton: FastAPI, token auth, WeasyPrint smoke render, Dockerfile.
- Security: nonce CSP, security headers, safe redirects, log redaction, threat model.
- Working method: `CLAUDE.md`, 4 skills, 3 review agents, git hooks, CI workflow, 7 ADRs, architecture, privacy, runbook.

## Test results (final run)

| Suite                                            | Result                |
| ------------------------------------------------ | --------------------- |
| Lint, typecheck, format                          | clean                 |
| Unit and component (Vitest)                      | 70 passed             |
| Database: RLS, triggers, structure (pgTAP)       | 218 passed            |
| End-to-end + axe (Playwright, desktop and phone) | 59 passed, 13 skipped |
| Worker (pytest)                                  | 6 passed              |
| Lighthouse accessibility                         | 100 on 4 screens      |

The 13 skipped E2E tests: 12 are the real sign-in journey (6 tests × 2 devices, need Supabase),
1 is the hardware-keyboard test on the phone profile.

A mutation check confirmed the RLS tests bite: weakening the story policy and dropping a vault
trigger made 11 assertions fail.

## Security review

An independent review with live probes found 14 verified issues in the first version of the access
model; none was reachable anonymously or by plain cross-family reads. Twelve are fixed and
reproduced in `supabase/tests/090_hardening.sql` plus unit tests; details in
[THREATS.md](../THREATS.md). Two remain open by decision:

1. **Login CSRF** — a magic link signs in directly on GET. Fix planned for phase 1: a confirmation step.
2. **Client IP for rate limiting** — depends on the hosting choice.

## Decisions taken that go beyond the build prompt

1. The family owner cannot read other people's sealed capsules (only title and status).
2. Earlier versions and raw transcripts are for the author and owner only.
3. A revoked member loses access to everything, including their own content.
4. Only the author can take a story out of the vault.
5. A membership becomes active only when the invited person accepts.
6. Added: `story_shares`, `created_by`, `media_assets.bucket`, `questions.family_id`.

Each is a product decision as much as a technical one; say so if any should be different.

## Open risks

| Risk                                                                            | What is needed                                                                                                 |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Nothing is on GitHub; the work lives in a temporary container and a bundle file | Push access for the Claude GitHub integration on `GTLife2030/memory-nest`                                      |
| Sign-in and RLS never ran against real Supabase                                 | Allow `*.supabase.co` in the environment's network settings and add the three keys, or run CI with the secrets |
| Supabase project is in Ireland, the brief says Frankfurt                        | Decide now; a project cannot be moved later                                                                    |
| Free Supabase plan: no backups, pauses when idle                                | Pro plan before the first real family                                                                          |
| The seed has not run on hosted Supabase                                         | Verify on first use (may need `auth.identities` rows)                                                          |
| `lib/supabase/types.ts` is hand-written                                         | Generate once the project is linked                                                                            |
| Worker image never built                                                        | First CI run                                                                                                   |
| iOS install and web push untested                                               | Real devices in phase 1                                                                                        |

## Cost per active user

Phase 0 adds no variable cost: no AI, voice, messaging or print calls exist yet. Fixed cost today
is zero (free tiers). The cost model from the plan van aanpak (under €4 per active user per year
excluding print) is untested until phase 2; every adapter call already logs `cost_cents` so it can
be measured from the first real call.

## Demo script (5 minutes)

1. `pnpm build && pnpm start`, open `/` — the promise, the calm tone, the "demo-modus" badge (hover: which services are simulated).
2. Click "Grote letters aan" — everything grows to elder mode; it stays on while navigating.
3. `/inloggen` — without a database it explains itself and offers the demo nest.
4. `/nest/demo` — Familie de Wit: this week's question, Truus' stories with "bewerkt met AI" on the unapproved one, the timeline, Joris' capsule "Verzegeld tot 14 maart 2044".
5. `/design` — every component; try the record button, the dialog (Tab stays inside, Escape closes), the toast.
6. Terminal: `pnpm test:db` — 218 checks that nobody reads what is not theirs.

Screenshots: [docs/screenshots/phase-0](../screenshots/phase-0).

## Next steps

1. Founder: fix push access; allow Supabase in the network settings and add keys; decide the region; decide hosting.
2. Then: push, first CI run, `supabase db push`, run `auth.spec.ts` and the RLS suite against the project. Phase 0 is only fully accepted after that.
3. Phase 1 plan (onboarding, questions engine, capture, nest views, e-mail reminders), including the login confirmation step and a proposal for per-family media encryption.
