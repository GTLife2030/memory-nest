# ADR-010: Sign in with a password for now; accounts are created by hand

**Status:** accepted · 2026-11-20 (founder decision) · interim, replaces magic-link sign-in

**Context.** Magic links depend on mail that arrives. The built-in Supabase mail server allows
about two messages per hour, and a proper sender (domain, SPF/DKIM, provider) is not set up yet.
That blocked every sign-in during the first tests.

**Decision.** Until mail is in place, people sign in with e-mail address and password.

- There is **no public sign-up**. The founder creates each account in the Supabase dashboard
  (Authentication → Users → Add user, "Auto Confirm User" on) and passes the password on.
  "Allow new users to sign up" is switched off in Supabase.
- There is no "forgot password" by mail. The founder sets a new password in the dashboard.
- The magic-link landing route `/auth/confirm` stays in the code, unused, for the return.

**Why no open sign-up.** Without mail we cannot confirm that an address belongs to the person
typing it. Invitations are matched on the signed-in e-mail address (`accept_invitation`), so an
open sign-up without confirmation would let anyone claim an invitation meant for someone else.

**Consequences.**

- This contradicts the product promise for older users ("een wachtwoord heb je niet nodig").
  It is acceptable for the founder and a handful of testers, not for the beta.
- Password guessing is slowed by a limit per address (5 per 15 minutes) and per client, plus
  Supabase's own limits. Set a minimum password length of 12 in Supabase and switch on leaked
  password protection where the plan offers it.
- The login-CSRF risk of magic links (THREATS T8b) does not apply while links are not sent.
- ADR-009 (ImprovMX) is on hold. Before the beta: choose the mail provider, bring back magic
  links (with the confirmation step), and decide whether passwords remain as an alternative.
