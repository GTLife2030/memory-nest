# Architecture

State: end of phase 0 (foundation). Features arrive in phases 1–5; see `plans/`.

## Overview

```
Browser (PWA)  ──►  Next.js 16 (App Router, server-rendered per request)
                       │  proxy.ts: CSP nonce, session refresh, early redirect
                       │  Server Components / Actions / Route Handlers
                       ├──►  Supabase (EU): Postgres + RLS, Auth, Storage
                       ├──►  Adapters (lib/adapters): llm, voice, stt, storage, video,
                       │       print, payments, email, whatsapp, telephony  → mock or real
                       └──►  Python worker (FastAPI): WeasyPrint, ffmpeg
```

- **Authorisation is in the database.** Every table has row level security, enabled and forced.
  Application code checks access only to give a good experience (redirects, 404s).
- **Server first.** Pages are Server Components rendered per request; the browser gets a nonce-based CSP.
- **Everything external is an adapter.** Missing key → mock → "demo-modus" badge.

## Roles and access

A person is linked to a family through `memberships` (one row per role; a person can hold more
than one, for example co-author and legacy contact).

| Role (UI name)                      | Stories                                             | Capsules                                              | Family admin       |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------------------------- | ------------------ |
| owner (Beheerder)                   | all, including private and vault                    | own; metadata of others via `family_capsule_overview` | yes                |
| co_author (Verteller)               | own + `visibility = family`                         | own                                                   | no                 |
| viewer (Meelezer)                   | approved + `visibility = family`                    | none                                                  | no                 |
| recipient (Ontvanger)               | approved stories explicitly shared (`story_shares`) | released to them                                      | no                 |
| legacy_contact (Vertrouwenspersoon) | none                                                | metadata via overview                                 | can report a death |

Rules that hold whatever the application does (triggers and constraints, `…000400_guards.sql`):

- **Vault** stories are readable by author and owner only, are always private, and can never have
  a transcript, source mapping, AI-authored version or AI photo description. This is checked for
  the service role too. The adapter registry refuses vault content a second time.
- **Sealed capsules** (content, recipients, trigger, media) are visible to the author only. Only
  the service role can set `released`; a released capsule is immutable for end users.
- `family_id` and `created_by` are immutable; a family always keeps one active owner.
- A media row can only point at an object under `{family_id}/{uploader_id}/`; object access
  is derived from the media row.
- `audit_log` is append-only for everyone.
- Earlier versions and raw transcripts are for the author and the owner; readers get the approved story.
- A revoked member loses all access, including to content they made. Their content stays in the family.
- References (chapter, person, transcript, media, …) cannot point into another family.
- A membership becomes active only when the invited person accepts (`accept_invitation`).
- Only the author can take a story out of the vault; the owner can read it but not open it up.

All policy logic sits in `security definer` helpers in schema `app` (`has_role`, `story_readable`,
`media_readable`, …), so there is one definition of each rule. Schema `app` is not exposed by the API.

### Decisions beyond the build prompt

- `story_shares` table added: the data model had no way to express "explicitly shared with".
- The owner does **not** read other people's sealed capsules (the prompt says "owner: full").
  A father's letter for his daughter's eighteenth birthday is not the mother's to read.
- `created_by` on stories, media and interviews: needed for "edit own".
- `media_assets.bucket` separates capsule media from story media.
- `questions.family_id` (nullable) for "eigen vraag stellen".

## Sign-in

Interim (ADR-010): e-mail address and password; accounts are created by the founder, no public
sign-up. Magic links return when a mail sender is in place.

1. `/inloggen` → server action → `signInWithPassword` (rate limited per address and per client;
   one message for unknown address and wrong password).
2. `/nest` finds the first membership or calls `create_family()` (security definer RPC; the only
   way an end user gets a family) and redirects to `/nest/{familyId}`.
3. `getNest()` loads the family under RLS; no row means 404, identical for "does not exist" and "not yours".

Without Supabase configured, sign-in is off and only the read-only demo nest `/nest/demo` and
the mock-up `/voorbeeld` exist. With Supabase, `/voorbeeld` is for signed-in visitors.

## Design system

Tokens in `app/globals.css` (`@theme`), mirrored in `lib/design/tokens.ts` for tests. All sizes
in rem; elder mode sets the root to 21px and targets to 56px via `data-elder` on `<html>`
(profile setting, mirrored in a cookie for the first paint). Components in `components/ui`
take their text as props. `/design` shows every component and is what the a11y tests run against.

## Adapters

`getAdapter(name)` returns the real implementation only when it exists and all its keys are set.
Every call is logged as one JSON line with `cost_cents`. AI adapters (`llm`, `stt`, `voice`,
`telephony`) require an `AiContext` and refuse `vault: true`. Phase 0 ships mocks only.

## Testing

| Layer                                 | Tool             | Where                             |
| ------------------------------------- | ---------------- | --------------------------------- |
| RLS, triggers, structure              | pgTAP            | `supabase/tests` (218 assertions) |
| Units, components, copy rules         | Vitest           | `tests/unit`                      |
| Journeys, accessibility, headers, PWA | Playwright + axe | `tests/e2e`                       |
| Accessibility score                   | Lighthouse       | `scripts/lighthouse.mjs`          |
| Worker                                | pytest           | `worker/tests`                    |
