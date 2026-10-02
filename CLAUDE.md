# Echo

@AGENTS.md

Private personal quote & reflection web app. Spec: `docs/echo-techincal-prod-spec.md`. Build plan: `docs/development/` (start with `README.md`).

Package manager: **pnpm** (never npm or yarn).

Stack: Next.js (App Router) + Route Handlers, TypeScript strict, Prisma, Postgres on Supabase (DB only), Auth.js with Google OAuth only, Tailwind, Zod, Vitest, Playwright.

## Rules

- **Any UI work** (pages, components, styling, layout, forms, states, responsive, accessibility, motion) must use the `echo-design-system` skill first and pass its validation checklist. `DESIGN.md` is the source of truth for visual tokens.
- Git commit messages are **one line**, no body.
- Every utility function and back-end function (`src/server/**`, `src/lib/**`) has a TSDoc block: one-sentence summary, `@param name - description.` per parameter, `@returns`.
- Every query on user-owned data is scoped by `userId`; not-owned by-id lookups return 404.
- Echo reads always filter `deletedAt: null`.
- Never log quote/reflection text, request bodies, or tokens.
- Never render user content as HTML.
- One Supabase project only (`echo-prod`). Local dev and tests use Docker Postgres; never run seed, reset, or tests against `echo-prod`. Migrations must be backward-compatible.
- Every new table's migration runs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (no policies). Supabase's Data API roles (`anon`, `authenticated`) must never read app tables; `tests/integration/data-api-lockdown.test.ts` enforces this.
- **Do not use superpowers skills** (`superpowers:*`) in this project. Execute plans directly.
