# Phase 0 — Foundation & design system

Status: **built; see [phase-0-report.md](phase-0-report.md)** · 2026-11-20

## 1. Goal and acceptance

Phase 0 delivers a repo that every later phase can build on without rework: the stack, the
design system, auth, the complete schema with row level security, the adapter layer in mock mode,
and the test and CI rails. No product features yet.

Acceptance (from the plan van aanpak, B2):

| #   | Criterion                                               | How it is proven                                                             |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A1  | Sign in with a magic link and land in your own nest     | Playwright E2E against a real Supabase project (see decision D2)             |
| A2  | RLS tests green, including cross-family isolation       | SQL test suite, one test file per rule in "RLS principles"                   |
| A3  | Lighthouse accessibility ≥ 95, axe clean                | Lighthouse CI + `@axe-core/playwright` on every route, normal and elder mode |
| A4  | App runs with only Supabase configured                  | All 10 adapters resolve to mocks, "demo-modus" badge visible                 |
| A5  | Lint, typecheck and tests run on every commit and in CI | Pre-commit hook + GitHub Actions workflow                                    |

## 2. What I found in this environment

These facts shape the plan and three of them need a decision from you (section 7).

- The working directory is empty and **not a git repository**; no GitHub repo is attached. The
  container is ephemeral, so nothing survives unless it is pushed.
- **No Supabase project is connected** and the Supabase MCP server is not available in this session.
- **The Docker daemon is not running**, so `supabase start` (the local Supabase stack) cannot run
  here, and the worker's Dockerfile can be written but not built here.
- Available: Node 22, pnpm 10, Python 3.13, PostgreSQL 16 binaries, ffmpeg, Chromium + Playwright,
  and registry access to npm and PyPI.
- Current versions: Next.js 16.4, React 19.3, Tailwind 4.3, next-intl 4.15.

## 3. Scope

### In

1. **Repo scaffolding** — Next.js 16 App Router, TypeScript strict (`noUncheckedIndexedAccess`
   on), pnpm, ESLint + Prettier, the project structure from the build prompt, `.env.example`.
2. **Working method files** — `CLAUDE.md` (< 200 lines), `.claude/skills/` (add-migration,
   add-adapter, write-e2e, release-check), `.claude/agents/` (rls-reviewer, a11y-reviewer,
   copy-reviewer), pre-commit hook.
3. **Design system** — tokens as CSS variables + Tailwind theme, self-hosted fonts (Fraunces,
   Inter, EB Garamond), elder mode, and all 14 listed components: Button, IconButton, Card,
   StoryCard, RecordButton, Waveform, PhotoFrame, TimelineItem, QuestionCard, ProgressGentle,
   Dialog, Toast, EmptyState. A `/design` gallery route shows every component in every state,
   and is what the a11y tests and screenshots run against.
4. **i18n** — next-intl, `nl` default, `en` prepared (file exists, falls back to nl). An ESLint
   rule blocks hard-coded strings in JSX.
5. **Auth** — Supabase Auth with magic link; Google and Apple buttons wired but hidden until
   their keys exist. Server-side session via `@supabase/ssr`, protected `(app)` layout, sign-out.
   On first sign-in a profile and an empty family + owner membership are created in one transaction.
6. **Database** — the **complete data model** from the build prompt as migrations (all ~30
   tables, enums, indexes, `updated_at` triggers, pgvector extension), with RLS on every table.
   I am doing the whole schema now rather than per phase because retrofitting RLS onto tables
   that already have application code is where leaks come from.
7. **RLS test suite** — proves each rule: default deny, five roles, vault (author + owner only),
   sealed capsules unreadable by recipients, legacy contact cannot read private stories,
   cross-family isolation on every family-scoped table, storage bucket policies.
8. **Adapters** — interface + mock + registry for all ten (`llm, voice, stt, storage, video,
print, payments, email, whatsapp, telephony`). Mocks return realistic Dutch data. Real
   implementations arrive in the phase that needs them. The registry is the single place that
   decides mock vs real from env, and feeds the "demo-modus" badge.
9. **Vault guard** — enforced twice: in the database (section 5) and in the adapter registry
   (the LLM/STT/voice adapters refuse any payload flagged vault, with a unit test).
10. **PWA shell** — manifest, icons, service worker with an offline fallback page. The offline
    recording queue itself is phase 1.
11. **Python worker skeleton** — FastAPI with `/health` and one `/render/smoke` endpoint that
    renders a one-page WeasyPrint PDF in EB Garamond, plus a Dockerfile and pytest.
12. **Observability hooks** — structured logger with a `cost_cents` field, Sentry and PostHog
    initialisation that is a no-op without keys. No accounts are created; nothing paid is added.
13. **Security baseline** — CSP and security headers, rate limit on the auth routes, env
    validation that fails the build if a server secret is referenced from client code,
    `docs/THREATS.md` (first version), `docs/PRIVACY.md` (skeleton with the DPA/ZDR table to fill).
14. **Docs** — README, ARCHITECTURE.md, RUNBOOK.md, ADRs for each deviation in section 6.
15. **Minimal seed** — Familie de Wit with its members and roles, two stories and the sealed
    capsule. Just enough for RLS tests and screenshots; the full seed (8 stories, 20 moments,
    book) lands in phases 1–2 when the screens that show it exist.

### Out (deliberately)

Onboarding, questions engine, capture, any AI call, book rendering, billing, reminders, capsule
scheduler, admin. Phase 0 has exactly these screens: landing page, sign-in, "check your mail",
empty nest home, `/design` gallery, offline fallback.

## 4. Build order

| Step | Work                                                              | Done when                                                        |
| ---- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1    | Scaffold, tooling, CLAUDE.md, skills, agents, pre-commit hook     | `pnpm lint && pnpm typecheck && pnpm test` green on an empty app |
| 2    | Tokens, fonts, elder mode, components, `/design` gallery          | Vitest component tests + axe clean on `/design` in both modes    |
| 3    | i18n and the marketing/auth/app route shells                      | No hard-coded strings; lint rule proves it                       |
| 4    | Migrations for the full schema                                    | Applies cleanly from zero, twice (idempotent reset)              |
| 5    | RLS policies + SQL tests, written test-first per rule             | Every rule has a failing-then-passing test                       |
| 6    | Auth flow, first-sign-in bootstrap, protected layout              | E2E: sign in → own empty nest; cannot open another family's URL  |
| 7    | Adapter interfaces, mocks, registry, demo badge, vault guard      | Unit tests per adapter; badge shows which services are mocked    |
| 8    | PWA shell, worker skeleton, observability hooks, security headers | Lighthouse PWA installable; worker pytest green                  |
| 9    | CI workflow, docs, ADRs, `/security-review`, rls-reviewer pass    | Phase report                                                     |

## 5. Design decisions worth your attention

**RLS shape.** One `security definer` helper, `app.role_in(family_id)`, returns the caller's
active role from `memberships`; every policy is built on it, so there is one place to audit.
Recipients get no table-level read on `stories` or `capsules`; they read through two narrow
policies keyed on explicit share rows and `status = 'released'`.

**Sealed capsules.** Capsule content (`letter_md`, `message_media_id`) is readable only by the
author while sealed. The release transition is not grantable to any user role: only the
service role (the future scheduler) can set `released`, enforced by a trigger, not just a policy.
The storage policy for capsule media follows the same rule, so a recipient cannot fetch the
video by guessing its path.

**Vault in the database.** A trigger on `transcripts`, `story_sources`, `story_versions`
(author = ai) and the future job queue rejects any row that points at a vault story, and
flipping a story to vault while AI artefacts exist is rejected with a clear error. This makes
"no AI on vault" a database fact, independent of application code.

**Elder mode** is a `data-elder` attribute on `<html>` driven by the profile, changing the base
size to 21px and the minimum target size to 56px through tokens, so components never branch on it.

**Fonts are self-hosted** through `next/font`, so no visitor IP goes to Google.

## 6. Deviations from the build prompt (each gets an ADR)

| #       | Deviation                                                                                                                                          | Why                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| ADR-001 | Tailwind v4, tokens in CSS `@theme` rather than `tailwind.config`                                                                                  | Current stable; the tokens are CSS variables either way                                                   |
| ADR-002 | RLS tests run against plain PostgreSQL 16 with a small shim (`auth.uid()`, the `anon` / `authenticated` / `service_role` roles, `storage.objects`) | No Docker here, so no local Supabase stack. The same test files run unchanged against real Supabase in CI |
| ADR-003 | Migrations as files via the Supabase CLI instead of the Supabase MCP server                                                                        | MCP is not available in this session; files remain the source of truth, as CLAUDE.md requires anyway      |
| ADR-004 | Pre-commit runs lint, typecheck and unit tests; RLS and Playwright run pre-push and in CI                                                          | Keeps a commit under ~20 s so the hook does not get bypassed                                              |
| ADR-005 | pgTAP if the extension can be installed, otherwise plain SQL assertions with a small runner                                                        | Depends on what the Postgres here and on Supabase allow; decided in step 5                                |

## 7. Decisions I need from you

**D1 — Where does the code live?** Without a GitHub repo this work disappears when the
container is reclaimed. Recommended: create an empty private repo (for example `memory-nest`)
and attach it to this session; I then push after every step. Alternative: I build locally and
hand you a zip at the end of the phase, which is fragile.

**D2 — Supabase project.** Recommended: create a project in region Frankfurt (free tier is
enough for phase 0) and add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` to this environment's secrets. Then A1 is proven for real.
Without it I can still build everything and prove A2–A5 locally, but the magic-link login
(A1) stays **unverified end to end** and I will report it as such, not as done.

**D3 — Hosting target for the web app.** Vercel (simplest, set the function region to
Frankfurt) or an EU-only host such as Scaleway. This does not block phase 0; I default to
host-neutral output and write the trade-off into an ADR unless you already have a preference.

Smaller defaults I will take unless you object: pnpm; English for code, commits and docs,
Dutch for all UI copy, prompts and seed data; the informal "je" in the UI, with "u" selectable
per storyteller for Nestje from phase 2.

## 8. Risks in this phase

| Risk                                                                                       | Mitigation                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The auth shim differs from real Supabase, so an RLS test passes locally and fails for real | Same SQL files run against the real project in CI; phase 0 is not reported done on shim results alone if D2 is available                                   |
| The full schema is designed before the features exist and needs changes                    | Expected; migrations are additive and every later phase starts with a schema review. The RLS helpers, not the columns, are the part that must be right now |
| Worker Docker image cannot be built here                                                   | Worker tests run natively here; the image build runs in CI                                                                                                 |
| iOS web push and install behaviour cannot be tested here                                   | Only the shell is in scope; real-device testing is listed for phase 1                                                                                      |
| Fraunces at 21px breaks layouts                                                            | Every component is tested in the gallery in both modes at 360px width                                                                                      |

## 9. Checkpoint deliverables

- Demo script (5 minutes: sign in, empty nest, elder mode, design gallery, demo-modus badge,
  a rejected cross-family request)
- Screenshots of every screen, phone and desktop, normal and elder mode
- Test summary: unit, component, RLS, E2E, axe, Lighthouse
- Cost estimate per active user (phase 0: hosting only; the model for later phases is set up)
- Risks and the proposed phase 1 plan

## 10. Cost of this phase

No paid services. Supabase free tier, GitHub Actions free minutes, no AI or voice calls.
