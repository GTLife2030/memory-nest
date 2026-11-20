# ADR-004: Fast pre-commit, slower suites pre-push and in CI

**Status:** accepted · 2026-11-20

The build prompt asks for a pre-commit hook running lint, typecheck and tests. Running the
database, browser and worker suites on every commit takes minutes and invites `--no-verify`.

**Decision.** pre-commit: `pnpm check` (lint, typecheck, unit tests; about ten seconds).
pre-push: RLS suite when PostgreSQL is running. CI: everything, including E2E, axe, Lighthouse,
the seed and the worker image build.
