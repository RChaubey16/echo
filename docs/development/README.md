# Echo — Development Plan

Phase-wise build plan for the Echo MVP, derived from [`../echo-techincal-prod-spec.md`](../echo-techincal-prod-spec.md).

Each phase ends with something that can be deployed and is complete in itself. Finish a phase's exit criteria before starting the next one.

| Phase | File | Outcome |
|---|---|---|
| 1 | [phase-1-foundation.md](phase-1-foundation.md) | Repo, DB, Google login, deploy pipeline, design tokens (light + dark). A signed-in user sees the sidebar shell and the first-run screen. |
| 2 | [phase-2-core-echo.md](phase-2-core-echo.md) | Create (quick capture) / view / edit / delete / favorite Echoes. QuoteCard, serif quotes. |
| 3 | [phase-3-organization.md](phase-3-organization.md) | Tags, Collections, Favorites page, Search. |
| 4 | [phase-4-discovery.md](phase-4-discovery.md) | Home dashboard, Today's Echo, Echo Me Something, Revisits, onboarding. |
| 5 | [phase-5-polish.md](phase-5-polish.md) | Responsive, empty/loading/error states, a11y, performance, settings and appearance. |
| 6 | [phase-6-production-readiness.md](phase-6-production-readiness.md) | Security review, authz test suite, analytics, monitoring, export, account deletion. (Backups dropped: see Phase 6 §3.) |

---

## Stack (decided)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router)**, React, TypeScript (strict) | Next.js covers both the UI and the API. |
| API | **Next.js Route Handlers** under `app/api/*` | API-first (spec §4.4): the UI calls the same service layer the API uses, so a mobile app or extension can use the API later. |
| Database | **PostgreSQL on Supabase** | Supabase is only the managed Postgres host. We do **not** use Supabase Auth, Storage, or the client SDK. |
| ORM | **Prisma** | Migrations live in `prisma/migrations`. Raw SQL migrations are used for full-text search. |
| Auth | **Auth.js (NextAuth v5) + Google provider + Prisma adapter** | **Google OAuth only.** No email/password, so there are no `/signup` or `/forgot-password` pages and no password-reset flow. |
| Validation | **Zod** | One schema is shared by the client form and the server handler. |
| Styling | **Tailwind CSS v4** + an in-house component set | Visual tokens live in [`DESIGN.md`](../../DESIGN.md). All UI work goes through the `echo-design-system` skill (see below). No large component library (spec §47). Use headless primitives (e.g. Radix) only for dialogs and dropdowns if needed for accessibility. |
| Testing | **Vitest** (unit + integration), **Playwright** (E2E) | |
| Hosting | **Vercel** | Preview deploy per PR. |
| Object storage | **Deferred** | S3 will be considered after the MVP. Nothing in the MVP uploads files. |

---

## Changes from the spec

These are deliberate. Update the spec if they stick.

1. **Auth is Google-only.**
   - These routes are removed: `/signup` and `/forgot-password`.
   - `/login` becomes a single "Continue with Google" page. First login creates the account.
   - These rate limits are no longer needed: login, signup and password reset. Mutation and search limits stay.
2. **User table shape follows Auth.js.**
   - The Prisma adapter requires `User.image` and `User.emailVerified`.
   - We keep `image` in Prisma but map it to the `avatar_url` column.
   - We also add the adapter's own tables: `Account`, `Session`, `VerificationToken`.
3. **Ownership failures return `404` for every by-id request.**
   - Spec §65 asks for `403` on edit and delete. Returning `404` instead avoids revealing that another user's ID exists.
   - Exception: `403 FORBIDDEN` is still used when a request body references IDs the user doesn't own, such as `tagIds` or `collectionIds`.
4. **Revisits are in scope (Phase 4).** The spec's phase list leaves them out, but the Add Echo form, the E2E flows and the data model all include them. Notifications stay out of scope.
5. **`EchoInteraction` is deferred.** We add only a nullable `lastSurfacedAt` on Echo. Echo Me Something uses it to avoid repeating recent picks.

6. **Navigation is a left sidebar**, not the top nav in DESIGN.md's original analysis: a sidebar on desktop, a labelled rail on tablet and a bottom tab bar on mobile (DESIGN.md › App Navigation).
7. **Add Echo opens a quick-capture dialog** (quote only, details optional); `/app/echoes/new` remains as the full form.
8. **Design decisions settled in DESIGN.md:** serif quotes (Newsreader), a dark theme from Phase 1, tinted panels, darker input borders and readable disabled buttons. The approved visual reference is `docs/mockups/dashboard.html`.

---

## Supabase-specific notes (read before Phase 1)

- **Connection strings.** Use the **pooled** connection (Supavisor, port `6543`, `?pgbouncer=true`) as `DATABASE_URL` for the app at runtime. Use the **direct/session** connection (port `5432`) as `DIRECT_URL` for `prisma migrate`.
- **Lock down the Data API.** Supabase exposes the `public` schema over PostgREST by default. Because we only access the DB via Prisma on the server, **disable the Data API** in project settings, **or** enable RLS on every table with no policies. Otherwise the anon key could read user content. This is a Phase 1 task and a Phase 6 checklist item.
- **One project only: `echo-prod`.** There is no second Supabase project.
  - Local development, integration tests and CI use a **local Postgres in Docker** (`postgres:17` via `docker compose`). It is never a Supabase project.
  - Vercel Preview deployments connect to `echo-prod`, because it is the only hosted database. As a result:
    - migrations run **only** from `main`, never from a Preview build;
    - every migration must be **backward-compatible**, adding things before removing them (expand → contract), so that older and newer deployments both work against the same schema;
    - no seed, reset or test scripts are ever run against `echo-prod`.
- **Backups.** None. `echo-prod` stays on the free plan, which has no backups; the owner accepted that a database loss is unrecoverable (Phase 6 §3). Users are told so in `/privacy` and can export their data.

---

## UI work: always use the `echo-design-system` skill

Whenever a task builds, changes, styles or reviews anything the user sees, **invoke the `echo-design-system` skill first** and follow its workflow. That covers pages, layouts, components, forms, dialogs, navigation, empty/loading/error states, responsive behavior, accessibility and motion. The skill lives at `.claude/skills/echo-design-system/`.

- It reads its tokens from [`DESIGN.md`](../../DESIGN.md), which is the source of truth for colors, type, spacing, radii and elevation.
- It decides when to bring in `ui-ux-pro-max` for UX patterns, interaction design and polish. Don't use `ui-ux-pro-max` on its own to pick Echo's colors, fonts or style.
- It defines Echo's components (QuoteCard, FavoriteButton, EchoForm, TodaysEcho, …), the states each must ship with, and the motion tokens.
- It ends with a validation pass (`audit_ui.py`, screenshots at 320–1440px, a keyboard pass, a reduced-motion check). That pass is part of the definition of done for UI tasks.

Each phase file starts with a **UI work in this phase** line that lists its UI sections. Sections that are purely backend (schema, services, API, infrastructure) don't need the skill.

## Cross-cutting conventions (apply in every phase)

**Layout**

```text
src/
  app/
    (marketing)/page.tsx          # /
    login/page.tsx
    (app)/app/...                 # authenticated UI
    api/...                       # route handlers (thin)
  server/
    auth.ts                       # Auth.js config, requireUser()
    db.ts                         # Prisma client singleton
    services/                     # business logic, ownership enforced here
    validation/                   # zod schemas
    http.ts                       # apiHandler(), error helpers
  components/
    ui/                           # Button, Input, Dialog, ...
    echo/                         # QuoteCard, EchoForm, ...
  lib/                            # pure helpers (hashing, dates)
prisma/
  schema.prisma
  migrations/
tests/
  unit/  integration/  e2e/
```

**Rules**

- **Route handlers stay thin.** A handler does: authenticate, parse with Zod, call a service, serialize the result. Server Components call services directly. They don't make `fetch` calls to the app's own API.
- **Every service function takes `userId` as its first argument.** Every Prisma query on user-owned data filters by `userId`, or through a relation to it. Use `findFirst({ where: { id, userId } })` and never `findUnique({ where: { id } })` on its own.
- **Soft delete.** All Echo reads go through a helper that adds `deletedAt: null`.
- **Error shape** (spec §39): `{ "error": { "code": "...", "message": "..." } }`. All errors go through a single `apiHandler` wrapper.
- **Logging.** Log request IDs, routes, status codes and timings. **Never** log quote or reflection text, tokens, or request bodies.
- **Rendering.** Never use `dangerouslySetInnerHTML` for user content. Render quotes as text with `whitespace-pre-wrap`.
- **Doc comments.** Every utility function and every back-end function (services, `src/server/*`, `src/lib/*`) gets a TSDoc block with a one-sentence summary, one `@param name - description.` per parameter, and `@returns`:

  ```ts
  /**
   * Formats a number as a currency string.
   *
   * @param amount - The amount to format.
   * @param currency - The ISO 4217 currency code.
   * @param locale - The locale used for formatting.
   * @returns The formatted currency string.
   */
  ```
- **Commits.** Git commit messages are a single line, with no body, prefixed with a type: `feat:`, `bug:`, `doc:`, `refactor:`, `chore:` (also `test:`, `perf:`, `ci:`, `style:`). See `CLAUDE.md`.
- **Definition of done for any task:**
  - the types check;
  - the linter passes;
  - the tests for that task are written and passing;
  - the change works on a Vercel preview;
  - **for UI tasks:** the change was built with the `echo-design-system` skill, and its validation checklist (`references/validation.md`) passes, with `audit_ui.py` reporting 0 errors.
