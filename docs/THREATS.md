# Threat model

Version 1, end of phase 0. Reviewed at every phase report.

## What we protect

1. Family stories and media, including health details and data about living third parties.
2. Sealed capsules: content and even their existence, until release.
3. The integrity of a story (that it is really what the teller said) and of capsule release.
4. Availability over decades: the promise is that stories outlive the people who told them.

## Who might attack

Curious family members (the most likely case), an ex-partner with an old session, someone
falsely reporting a death, credential-stuffing and phishing, a malicious or compromised
processor, a compromised staff account, and ordinary bugs.

## Threats and controls

| #   | Threat                                                        | Control today                                                                                                      | Open                                                                         |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| T1  | Family member reads what was not shared with them             | RLS per role, private by default, tested per role                                                                  | —                                                                            |
| T2  | Cross-family access (IDOR by changing an id in the URL)       | RLS on every table and storage object; isolation test over all family tables; 404 without detail                   | —                                                                            |
| T3  | Privilege escalation (make yourself owner, change plan/quota) | owner-only membership writes, column grants, immutable `family_id`/`created_by`, last-owner guard                  | —                                                                            |
| T4  | Capsule read or released early                                | author-only policies, release only by service role (trigger), media policy follows capsule                         | release job and its tests: phase 4                                           |
| T5  | Vault content reaches an AI provider                          | DB triggers (also for service role) + adapter guard + tests                                                        | real adapters: phase 2                                                       |
| T6  | Stolen session / XSS                                          | nonce CSP without inline scripts, HttpOnly session cookies via Supabase SSR, no user HTML rendered, strict headers | `style-src 'unsafe-inline'` remains (needed by dialog/toast primitives)      |
| T7  | CSRF                                                          | Server Actions (origin check), sign-out is POST, SameSite cookies                                                  | —                                                                            |
| T8  | Open redirect after sign-in                                   | `safeNextPath` allows same-site paths only, tested                                                                 | —                                                                            |
| T9  | Sign-in abuse, e-mail bombing, enumeration                    | per-IP and per-address limit, same response for known and unknown addresses, Supabase limits                       | limiter is per instance; add Turnstile before public launch                  |
| T10 | Magic link opened by a mail scanner or forwarded              | single-use, one hour                                                                                               | consider a 6-digit code as alternative for elders                            |
| T11 | Secret leaks to the browser                                   | secrets only in `lib/server/env.ts` (`server-only`), ESLint blocks the service-role client in UI code              | —                                                                            |
| T12 | Service-role key leak                                         | key only on the server; bypasses RLS by design                                                                     | rotate procedure in RUNBOOK; break-glass admin: phase 5                      |
| T13 | False death report                                            | only legacy contacts can report; confirmation not possible for end users                                           | second confirmation, evidence, 14-day wait: phase 4                          |
| T14 | Media object guessed or claimed                               | private buckets, path bound to family and uploader (constraint), access derived from media row                     | signed URLs with short lifetime: phase 1                                     |
| T15 | SSRF / file read through PDF rendering                        | worker escapes input, denies all resource fetching, requires a token, fails closed                                 | —                                                                            |
| T16 | Sensitive data in logs                                        | redaction by key in the logger, tested                                                                             | —                                                                            |
| T17 | Private pages cached on a shared device                       | service worker caches only static assets and the offline page                                                      | offline recording queue: encrypt at rest (phase 1)                           |
| T18 | Staff reads content                                           | no admin UI exists                                                                                                 | break-glass with reason and audit: phase 5                                   |
| T19 | Data loss                                                     | Supabase managed backups                                                                                           | **free plan has no backups**; move to Pro before real families, restore test |
| T20 | Processor keeps or trains on content                          | —                                                                                                                  | DPAs and zero-retention in writing: before phase 2 goes live                 |
| T21 | Company stops (the sector's real risk)                        | open formats in the data model                                                                                     | export, yearly automatic export, exit arrangement: phase 4                   |

## Not yet decided

Per-family envelope encryption for media. It protects against a storage-level leak and a curious
processor, at the cost of key management and server-side decryption for AI and print. Proposal
due with the phase 1 plan.
