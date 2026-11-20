---
name: release-check
description: Run the Memory Nest pre-release checklist before a phase report or deploy.
---

# Release check

Run in order and report every result, including failures and skipped steps.

1. `pnpm check:all` (lint, typecheck, unit, RLS, E2E + axe, worker).
2. Note how many E2E tests were skipped and why (tests needing Supabase skip without keys).
3. Lighthouse accessibility ≥ 95 on `/`, `/inloggen`, `/nest/<id>` (see `docs/RUNBOOK.md`).
4. `/security-review` on the changes; fix or document every finding.
5. Agents: `rls-reviewer` on `supabase/`, `a11y-reviewer` on changed screens, `copy-reviewer` on `messages/nl.json`.
6. `grep -rn "NEXT_PUBLIC_" app components lib` and confirm no secret is exposed.
7. Docs: `ARCHITECTURE.md`, `PRIVACY.md`, `THREATS.md`, `RUNBOOK.md` and ADRs match the code.
8. `node scripts/screenshots.mjs phase-N` and update the demo script in the phase report.
9. Write the phase report in `docs/plans/phase-N-report.md`: built, test results, cost per active user, risks, next steps.
