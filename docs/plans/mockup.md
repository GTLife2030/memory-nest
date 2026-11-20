# Clickable mock-up of all flows

Status: **approved 2026-11-20; batch 1 delivered, batches 2 and 3 to do**

Founder decisions: inside the app at `/voorbeeld`; behind sign-in; three batches in the proposed order.

## Goal

One place where the founder, test families and partners can click through every flow of Memory
Nest before it is built for real: what each persona sees, in which order, with which words.
It doubles as the UX specification for phases 1–5: each phase then replaces mock screens with
working ones instead of inventing them.

## What it is, and is not

- A section of the existing app at `/voorbeeld`, built with the real design system and Dutch copy,
  deployed with every push to the Vercel preview.
- Everything is simulated in the browser: sample data of Familie de Wit, no database, no AI,
  no microphone, no payment, nothing stored. Reloading starts over.
- Every screen carries a visible "voorbeeld" marker, and the section is excluded from search engines.
- Not a second code base and not throw-away: the screens are built from the same components the
  real features will use.

## Entry point

`/voorbeeld` is a map of all flows, grouped per persona, each with a one-line description and a
"begin" link. A persona switch (Marieke / oma Truus / Joris) and the elder-mode toggle are always
available, so the same flow can be seen as a young parent on a phone and as a grandmother with
large type.

## Flows

| #   | Flow                                                                                                                                            | Screens (roughly) | Module |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------ |
| 1   | Onboarding: who is it for, name, themes, frequency, channel, cover, large type                                                                  | 7                 | 1      |
| 2   | Receive a gift: "Je hebt een cadeau gekregen van Lotte" → first question                                                                        | 3                 | 1, 13  |
| 3   | Weekly question → tell it (simulated recording, pause, resume) → saved                                                                          | 4                 | 2, 3   |
| 4   | "Vertel eens over deze foto": pick photo → description suggestion → tell                                                                        | 3                 | 3      |
| 5   | From recording to chapter: processing → story with "bewerkt met AI" → tap a paragraph to hear the source → edit → approve → follow-up questions | 5                 | 4      |
| 6   | Nestje in the browser: AI disclosure → conversation with transcript → "overslaan" and "stoppen" → wrap-up                                       | 4                 | 5      |
| 7   | Nestje by phone: choose a time slot → confirmation → what the call sounds like → story ready                                                    | 4                 | 5, 12  |
| 8   | Nest views: this week, stories, timeline (decade / year / month), people, chapters, search with original passages                               | 6                 | 6      |
| 9   | Vault: put a story in the vault, what that means, take it out again                                                                             | 2                 | 4      |
| 10  | Book: choose template, order chapters, preview with QR, preflight, order, status                                                                | 6                 | 7      |
| 11  | Audiobook: choose fragments, chapter intros, export                                                                                             | 3                 | 8      |
| 12  | Time capsule: write or record → recipient → trigger → seal → (time-travel switch) → reveal ceremony                                             | 6                 | 9      |
| 13  | Legacy: appoint two trusted contacts → report → second confirmation → waiting period with check-in → read-only nest                             | 6                 | 10     |
| 14  | Family: invite co-author and recipient, accept an invitation, roles                                                                             | 4                 | 11     |
| 15  | Reminders: channel and rhythm, pause, the WhatsApp message with a voice reply                                                                   | 3                 | 12     |
| 16  | Plans and paying: packages, iDEAL checkout (simulated), gift code with printable card, cancel                                                   | 5                 | 13     |
| 17  | Export and delete: request the ZIP, delete the account with 30 days to change your mind                                                         | 3                 | 14     |
| 18  | Limited-time persona: energy-aware session ("genoeg voor vandaag"), gentle wording throughout                                                   | 3                 | all    |

About 77 screens. Admin (module 15) is left out: it is internal and has no user-facing flow yet.

## Delivery in three batches

Each batch is pushed and viewable on the preview before the next one starts.

1. **Core** — flows 1, 2, 3, 4, 5, 8 and the `/voorbeeld` map: the main promise from first visit
   to an approved chapter.
2. **Voice, book, money** — flows 6, 7, 10, 11, 16.
3. **Later and together** — flows 9, 12, 13, 14, 15, 17, 18.

## Quality bar

- Every screen in the axe accessibility run, normal and elder mode, desktop and phone.
- One click-through E2E test per flow (it can be completed start to finish).
- All copy in `messages/nl.json` under `voorbeeld.*`, reviewed against the tone rules; wording for
  illness, death and legacy written with extra care and marked for review by the grief adviser.
- No real names, recordings or photos: illustrated placeholders only.

## Choices that need your answer

1. **Where:** inside the app at `/voorbeeld` on the preview site (recommended), or as a separate site.
2. **Who may see it:** public link (easy to share with Rosanne and test families) or behind sign-in.
   The content is fictional either way.
3. **Order:** the three batches as above, or a different flow first (for example capsule and
   legacy, if the next conversation is with a hospice or funeral insurer).

## What this does to the planning

This comes before phase 1 and takes its place for now. It is not lost time: the phase 1 screens
(flows 1–5, 8) will already exist as mock-ups and get wired to the database and recorder next.
Decisions made in the mock-up that change the data model will be listed in the report.

## Cost

No paid services. Only build time.
