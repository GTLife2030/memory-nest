# Memory Nest

_Een blijvende herinnering tussen generaties._ A Dutch-first, voice-first family memory platform:
parents and grandparents tell their stories, in their own words and voice, for the people who
come after them.

> Je hoeft niets te schrijven. Vertel het gewoon.

**Status:** phase 0 (foundation and design system). See [docs/plans](docs/plans).

## Quick start

```bash
pnpm install
cp .env.example .env.local   # optional: without Supabase keys the app runs in demo mode
pnpm dev                     # http://localhost:3000
```

- `/` landing page · `/inloggen` sign-in · `/nest/demo` demo nest (no database) · `/design` living style guide
- `pnpm check` lint, types, unit tests · `pnpm test:db` RLS suite · `pnpm test:e2e` browser + accessibility

## Documentation

[Architecture](docs/ARCHITECTURE.md) · [Privacy](docs/PRIVACY.md) · [Threat model](docs/THREATS.md) ·
[Runbook](docs/RUNBOOK.md) · [Decisions](docs/adr) · [Working agreements](CLAUDE.md)

## What this product will never do

Voice cloning, AI avatars, "talk to the deceased" chat, face recognition.
