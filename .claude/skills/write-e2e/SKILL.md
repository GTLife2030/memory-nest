---
name: write-e2e
description: Write a Playwright end-to-end test for a Memory Nest persona journey, including accessibility checks. Use for every new screen or flow.
---

# Write an E2E test

- Tests live in `tests/e2e/*.spec.ts` and run on a production build in two projects: `desktop` and `phone`.
- Find elements the way a person does: `getByRole`, `getByLabel`, visible Dutch text. No CSS selectors, no test ids unless there is no accessible handle.
- Every new screen is added to `routes` in `a11y.spec.ts`, so it is checked with axe (WCAG 2.2 AA) and for horizontal scroll, in normal and elder mode.
- Persona journeys: name the test after the person and the outcome ("oma Truus adds a story in elder mode").
  - Reflective parent: run with `setElderMode(context, baseURL, true)`.
  - New parent: `phone` project; cover offline and back online.
  - Limited time: assert the absence of pressure (no countdown, no upsell).
- Tests that need a database use `test.skip(!hasSupabase, …)` and clean up what they create.
- Run with `pnpm test:e2e`; one test with `pnpm test:e2e -g "name"`; debugging with `--trace on`.
- A stale server on :3100 is reused: stop it (`fuser -k 3100/tcp`) after changing code.
