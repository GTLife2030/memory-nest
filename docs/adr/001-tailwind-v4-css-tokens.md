# ADR-001: Tailwind v4 with tokens in CSS

**Status:** accepted · 2026-11-20

The build prompt asks for "CSS variables + Tailwind theme". Tailwind 4 is the current stable and
defines the theme in CSS (`@theme` in `app/globals.css`) instead of `tailwind.config`. The tokens
are CSS variables either way, so one definition serves both. `lib/design/tokens.ts` mirrors the
colours for tests; a unit test keeps the two in sync.

shadcn/ui is used as a pattern, not as a generated dependency: components are hand-written on
Radix primitives (Dialog, Toast, Slot) with `class-variance-authority`, because the brand needs
its own shapes and the generated defaults would be restyled entirely.
