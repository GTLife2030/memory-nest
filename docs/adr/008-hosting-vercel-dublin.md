# ADR-008: Web app on Vercel, functions in Dublin

**Status:** accepted · 2026-11-20 (founder decision)

**Decision.** The web app is hosted on Vercel (Pro plan, which the founder already has) with
functions pinned to `dub1` (Dublin) in `vercel.json`, next to the Supabase project in eu-west-1.
Every push gets a preview URL; `main` is production.

**Why.** A shareable preview per push from day one, no infrastructure to maintain during the
beta, and server rendering and database in the same region.

**Consequences.**

- Vercel is a US company. Function execution is pinned to the EU, but static assets are served
  from a global edge network and logs are processed by Vercel: it must be listed as a processor
  with a DPA (see PRIVACY.md) and reviewed in the DPIA.
- Rate limiting must use the client IP that Vercel provides, not a client-supplied header
  (THREATS.md T9); to be done in phase 1.
- If a partner contract requires a fully European chain, the app can move to an EU host: it has
  no Vercel-specific code, only this region setting.
- The Python worker does not run on Vercel; its host is decided in phase 3.
