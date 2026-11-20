# ADR-009: Sign-in mail through ImprovMX SMTP, for now

**Status:** on hold · 2026-11-20 · superseded for now by ADR-010 (password sign-in); not set up

**Context.** Supabase's built-in mail server sends about two messages per hour for the whole
project. That blocked sign-in during the first tests and cannot serve test families.

**Decision.** Supabase Auth sends its mail (magic link, confirm sign-up) through ImprovMX SMTP
on the project's own domain. Nothing changes in the application code: this is configuration in
Supabase (Authentication → Emails → SMTP Settings). The steps are in RUNBOOK.md.

**Consequences.**

- ImprovMX SMTP is part of its paid plans; the free plan only forwards.
- ImprovMX is built for personal sending from an alias, not for bulk or product mail. It is fine
  for sign-in mail to the founder and a handful of test families. Before the closed beta, choose a
  transactional provider (Postmark was in the original plan) for deliverability, bounce handling
  and volume; that is also when the `email` adapter gets its real implementation for reminders.
- ImprovMX becomes a processor of e-mail addresses and sign-in links: list it in PRIVACY.md and
  sign its DPA.
- SPF, DKIM and DMARC must be set on the domain, otherwise sign-in mail lands in spam.
