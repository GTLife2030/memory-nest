# ADR-006: Render every page per request; Cache Components off

**Status:** accepted · 2026-11-20

Next.js 16 scaffolds with `cacheComponents` and `partialPrefetching` on. Both are switched off.

- The Content-Security-Policy uses a per-request nonce, which requires dynamic rendering.
- Elder mode is read from a cookie in the root layout so the first paint has the right size.
- Everything behind sign-in is private to one person; there is nothing to share from a cache.

**Consequence.** No static shell; first byte depends on the server. Acceptable at this size.
Revisit for the public marketing and SEO pages in phase 5 (they could move to a static segment
with a hash-based CSP).
