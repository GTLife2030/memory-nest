# Privacy

Working document for the DPIA and the processor agreements. It describes what the code does
today; it is not legal advice and needs review by the privacy lawyer before launch.

## What we process

| Data              | Examples                                               | Special category?                                                             |
| ----------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Account           | e-mail address, display name, birth year, phone number | no                                                                            |
| Stories and media | text, voice, photo, video, transcripts                 | often yes: health, religion, and data about living third parties and children |
| Capsules          | letters and recordings for later                       | often yes                                                                     |
| Legacy            | report of a death, evidence document                   | yes (and third parties)                                                       |
| Usage and billing | minutes, storage, subscription status                  | no                                                                            |

Legal bases to confirm: contract (the service), explicit consent under art. 9(2)(a) GDPR for
special categories (`consents` table, versioned, withdrawable), consent for AI processing, phone
calls and WhatsApp.

## Principles in the code

- Private by default: a new story has `visibility = private`.
- Vault: a story the teller marks as vault is never processed by AI (database triggers + adapter guard).
- Minors have no account; they are `people`. Capsules for them wait.
- Logs never contain story text, transcripts, e-mail addresses or phone numbers (`lib/server/logger.ts`).
- No analytics or session recording is active. PostHog, when enabled, must exclude story pages.
- Fonts are self-hosted; the app makes no third-party requests in the browser.
- Export and deletion: tables exist (`exports`), flows arrive in phase 4.
- Not built, by design: voice cloning, avatars, "talk to the deceased", face recognition.

## Processors

| Processor                    | Purpose                     | Region                              | DPA     | Zero retention / no training | Status          |
| ---------------------------- | --------------------------- | ----------------------------------- | ------- | ---------------------------- | --------------- |
| Supabase                     | database, auth, storage     | **eu-west-1 (Ireland)**, see note   | to sign | n/a                          | project created |
| Web host (Vercel or EU host) | web app                     | to decide (ADR needed)              | to sign | n/a                          | open            |
| Worker host                  | PDF, audio                  | EU, to decide                       | to sign | n/a                          | phase 3         |
| LLM provider                 | story editing               | EU endpoint, to verify per contract | to sign | to confirm in writing        | phase 2         |
| ElevenLabs                   | interviewer, speech to text | to verify                           | to sign | to confirm in writing        | phase 2         |
| Twilio                       | phone calls                 | to verify                           | to sign | n/a                          | phase 2         |
| Mollie                       | payments                    | EU                                  | to sign | n/a                          | phase 3         |
| Peecho                       | printing                    | NL                                  | to sign | n/a                          | phase 3         |
| Postmark                     | e-mail                      | to verify (US company)              | to sign | n/a                          | phase 1         |
| Meta (WhatsApp)              | reminders                   | to verify                           | to sign | n/a                          | phase 4         |

**Region.** The build prompt asked for Frankfurt (eu-central-1); the project is in Ireland
(eu-west-1). The founder decided on 2026-11-20 that Ireland is fine: both are in the EU, so data
residency holds. A Supabase project cannot be moved between regions, so this is final for this
project. The web host and worker should run in or near the same region (Dublin) to keep latency low.

## Open before launch

1. DPIA, with the terminally ill persona explicitly in scope.
2. Processor agreements and written confirmation of zero retention for the AI providers.
3. Terms with the exit arrangement (twelve months and a full export if the service stops).
4. Retention periods per data type; deletion with 30 days of grace.
5. Procedure for "this person is mentioned" reports from third parties.
6. Encryption per family (envelope encryption) for media: design in phase 1, see THREATS.md.
