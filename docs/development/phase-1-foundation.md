# Phase 1 — Foundation

**Goal:** A deployable Next.js app on Vercel, connected to Supabase Postgres through Prisma, with Google sign-in. A signed-in user lands on an empty `/app` shell. A signed-out user is redirected to `/login`.

**Spec refs:** §4, §5, §6, §8.1, §18, §19, §41 (auth), §59, §66 Phase 1

**UI work in this phase:** use the `echo-design-system` skill (`.claude/skills/echo-design-system/`) for every section that touches the interface: §4 (the `/login` page) and §6 (the app shell and design tokens). The visual reference is the Inkwell export in `docs/design/claude-design/export/`.

**Already done (before Phase 1):**
- [x] Supabase project `echo-prod` created (PostgreSQL 17). The Data API is turned off, and both connection strings are verified working over SSL.
- [x] Google OAuth web client created, with redirect URI `http://localhost:3000/api/auth/callback/google`.
- [x] `.env` holds the Supabase connection strings, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` and a generated `AUTH_SECRET`.
- [x] `.gitignore` excludes every `.env*` file except `.env.example`.

**Status: complete (2026-10-02).** Production: `https://echo.ruturaj.xyz`.

**Deviations from this plan** (all in place in the code):
- **Package manager is pnpm** (`packageManager` in `package.json`). `pnpm-workspace.yaml` allows install scripts only for Prisma, esbuild and `unrs-resolver`. pnpm's 24-hour minimum release age is kept; `@types/node` is pinned to satisfy it.
- **`"type": "module"`** in `package.json`: Prisma 7's generated client is ESM, and Playwright needs it to load.
- **Prisma 7 client** is generated to `src/generated/prisma` (git-ignored). `prisma.config.ts` reads `DIRECT_URL` as optional, so `prisma generate` works without a database URL.
- **Supabase TLS:** `pg` treats `sslmode=require` as full verification, and Supabase's root CA isn't in Node's trust store. `src/server/db-config.ts` moves `sslmode` out of the URL and verifies against the pinned root in `src/server/supabase-ca.ts` (expires 2031-04-26). `connection_limit` becomes the pool size.
- **Data API lockdown migration:** RLS on every table and no privileges for `anon`/`authenticated`. `CLAUDE.md` requires RLS in every new table's migration, enforced by `tests/integration/data-api-lockdown.test.ts`.
- **Sidebar collapse** is stored in the `echo-sidebar` cookie (not localStorage), so the server renders the right layout without a flash. The theme cookie is `echo-theme`.
- **`GET /api/me`** was added as the protected handler for the 401/200 integration tests.
- **Phase 1 placeholders** (Add Echo, Library, Favorites, Collections, Revisits, Search, Settings) link to their future routes and show the not-found page until later phases build them. The privacy note is the `#privacy` section on `/`.
- **Local test database:** `docker compose` creates `echo_test` alongside `echo`, so test runs never touch dev data.
- **Preview deployments** build with Production-equivalent env vars but can't use Google sign-in (per-deployment URLs aren't registered with Google, and Vercel Authentication protects them).

---

## 1. Repository & tooling

- [x] `git init`, `.editorconfig`, `.nvmrc` (Node 22). Keep the existing `.gitignore`, and add the scaffold's entries to it.
- [x] `create-next-app` with: TypeScript, App Router, Tailwind, ESLint, `src/` dir, import alias `@/*`.
  - The project folder isn't empty (`docs/`, `.claude/`, `.agents/`, `DESIGN.md`, `.env`), and `create-next-app` refuses to run in a non-empty folder. Scaffold into a temporary folder, then copy the files in **without overwriting** any existing file.
  - The scaffold brings its own `CLAUDE.md` and `AGENTS.md`. Keep our `CLAUDE.md` and add the `@AGENTS.md` reference to it.
  - The current release is **Next.js 16**. Its `AGENTS.md` says to read the bundled docs in `node_modules/next/dist/docs/` before writing code, because APIs have changed. For example, check what the request-interception file is called now (it was `middleware.ts`) before writing it.
- [x] Set `"strict": true` in tsconfig. Also enable `noUncheckedIndexedAccess`.
- [x] Prettier (+ `prettier-plugin-tailwindcss`), with lint and format scripts
- [x] Vitest config (`tests/unit`, `tests/integration`) and Playwright config (`tests/e2e`)
- [x] `package.json` scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:studio`, `db:seed`
  - Also added: `format`, `format:check`, `test:unit`, `test:integration`, `db:up`, `db:deploy`, `audit:ui`.
- [x] Create the folder layout described in the [README](README.md#cross-cutting-conventions-apply-in-every-phase)

## 2. Environment configuration

- [x] **First, before running any Prisma command:** point the default database variables at the local database. Prisma and Next.js both read `.env`, and `prisma migrate dev` can reset the database it points at. Right now `DATABASE_URL` and `DIRECT_URL` in `.env` point at **production**.
  - Rename the current Supabase values to `SUPABASE_DATABASE_URL` and `SUPABASE_DIRECT_URL`. They're kept for reference only and are never read by the app or Prisma locally.
  - Set `DATABASE_URL` and `DIRECT_URL` to the local Docker Postgres (§3).
  - Production values live only in Vercel and in GitHub Actions secrets, under the names `DATABASE_URL` and `DIRECT_URL`.
- [x] `.env.example` (committed) documents every variable without values:

```bash
# Local development: Docker Postgres (see docker-compose.yml)
DATABASE_URL=        # postgresql://echo:echo@localhost:5432/echo
DIRECT_URL=          # same as DATABASE_URL locally

# Production (set in Vercel and GitHub Actions; never point local DATABASE_URL here)
# DATABASE_URL = Supabase transaction pooler (6543) + ?pgbouncer=true&connection_limit=1&sslmode=require
# DIRECT_URL   = Supabase session pooler (5432) + ?sslmode=require   (migrations only)

AUTH_SECRET=         # openssl rand -base64 32 (a different value in production)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_URL=            # only if needed outside Vercel
```

- [x] `src/env.ts`: validate `process.env` with Zod at boot, and fail fast if anything is missing

## 3. Database (Supabase + Prisma)

- [x] Supabase project `echo-prod` (PostgreSQL 17), Data API off. Set Vercel's function region to the same region as the project.
- [x] `docker-compose.yml` with `postgres:17` (matching Supabase) for local development and tests, with a named volume and a health check. `.env` points `DATABASE_URL` and `DIRECT_URL` at it.
- [x] Install `prisma` and `@prisma/client`. The current release is **Prisma 7**, which moves the datasource URLs into `prisma.config.ts` and connects through a driver adapter. Follow the Prisma 7 docs for Supabase's pooler: the app uses `DATABASE_URL` (transaction pooler) and migrations use `DIRECT_URL` (session pooler). Check how `pgbouncer=true` is handled with the adapter, rather than assuming the Prisma 5/6 settings still apply.
- [x] Create a `src/server/db.ts` Prisma singleton, using the `globalThis` cache in dev.
- [x] Phase 1 schema: only the auth tables plus User. Domain tables are added in later phases.

```prisma
model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  emailVerified DateTime? @map("email_verified")
  name          String?
  image         String?   @map("avatar_url")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  accounts Account[]
  sessions Session[]

  @@map("users")
}

model Account {
  // standard Auth.js Prisma adapter shape
  userId            String  @map("user_id") @db.Uuid
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id") @db.Uuid
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
  @@map("verification_tokens")
}
```

- [x] Run the first migration against the local Docker Postgres (`prisma migrate dev`) and commit `prisma/migrations`. The pipeline applies it to `echo-prod` (section 7).

## 4. Authentication (Google only)

- [x] Google Cloud OAuth web client, with the local redirect URI `http://localhost:3000/api/auth/callback/google`. It requests only the `openid email profile` scopes.
- [x] If the consent screen is in **Testing** mode, add your Google account under **Test users**. Otherwise local sign-in fails with "access denied".
- [x] Add `https://<prod-domain>/api/auth/callback/google` once the production domain exists (§7).
- [x] Install `next-auth@5` and `@auth/prisma-adapter`, then create `src/server/auth.ts`:
  - set the Google provider and the Prisma adapter;
  - use `session: { strategy: "database" }`, so sessions can be revoked and are removed when an account is deleted;
  - set `pages: { signIn: "/login" }`;
  - add a `session` callback that exposes `user.id`.
- [x] `app/api/auth/[...nextauth]/route.ts` re-exports the handlers.
- [x] Helpers:
  - `getSessionUser()` returns the user or `null`;
  - `requireUser()` is used in route handlers and throws `UNAUTHORIZED`;
  - `requireUserPage()` is used in server components and redirects to `/login`.
- [x] Protect `app/(app)/app/layout.tsx` with `requireUserPage()`.
  - Optional: add a request-interception file (`middleware.ts` before Next.js 16; check the bundled docs for its current name) that only checks whether the session cookie exists, for a fast redirect. With database sessions, the real check must still happen in the layout and in every handler.
  - Done as `src/proxy.ts` (Next.js 16 renamed `middleware` to `proxy`), matching `/app` and `/app/:path*`.
- [x] `/login` page: centered on `surface-soft` (the first-run layout), with the Echo logo, the tagline, one "Continue with Google" button and a link to the privacy note. If the user is already signed in, redirect to `/app`.
- [x] Sign-out action in the sidebar's account menu (and in the mobile header's account menu).

## 5. API plumbing

- [x] `src/server/http.ts`:
  - `apiHandler(fn)` wrapper:
    - generates a request ID;
    - catches `AppError(code, status, message)` and Zod errors and turns them into the spec §39 JSON shape;
    - turns anything else into `INTERNAL_ERROR` and logs only the error ID.
  - `AppError` codes: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `ECHO_NOT_FOUND`, `COLLECTION_NOT_FOUND`, `TAG_NOT_FOUND`, `RATE_LIMITED`, `INTERNAL_ERROR`.
- [x] A structured logger (`pino` or a thin `console` JSON wrapper). It redacts by default: request bodies are never logged.
- [x] `GET /api/health` returns `{ ok: true }` and runs a cheap DB ping.

## 6. App shell

> Build with the `echo-design-system` skill. This section lays the foundation every later phase depends on. Match the Inkwell export in `docs/design/claude-design/export/`.

**Design tokens and fonts**
- [x] Create `src/app/globals.css` from the skill's `references/tokens.md`. It resets Tailwind's default colors, shadows, radii and breakpoints, then defines:
  - Echo's colors, including `border-input`, `on-primary-disabled` and the three tints (`tint-lagoon`, `tint-bronze`, `tint-plum`);
  - the type scale, including `text-quote-hero`, `text-quote-card` and `text-quote-compact`;
  - radii, `shadow-float`, the `tablet`/`desktop`/`wide` breakpoints, and the motion tokens and keyframes;
  - the **dark palette** (`colors-dark` in DESIGN.md), as the `prefers-color-scheme` and `[data-theme="dark"]` blocks.
- [x] Load **Inter** (the interface) and **Newsreader** (quotes only) through `next/font`, as `--font-inter` and `--font-newsreader`.
- [x] Theme: in Phase 1, follow the system setting (light or dark). Render `data-theme` on `<html>` from a cookie when one is set, so a saved choice never flashes the wrong theme on load. The Light/Dark/System control in Settings comes in Phase 5.

**Layout**
- [x] The app frame is `flex min-h-dvh flex-col` on `bg-surface-soft`, with `<main>` as `flex flex-1 flex-col`, so page-level states can fill the screen.
- [x] Sidebar navigation, following the skill's Navigation spec:
  - **Desktop (≥1128px):** a 256px sidebar with the logo, a collapse button, **Add Echo** (a placeholder until Phase 2), a search field (placeholder), the nav (Home, Library, Favorites, Collections, Revisits; only Home works in Phase 1), Settings and the account menu with sign out.
  - **Tablet:** a 96px rail with labelled icons. The collapse state is remembered per browser.
  - **Mobile (<744px):** a 64px header with the logo and account menu, plus the bottom tab bar.
  - The sidebar's scroll area is `overflow-x-hidden`, and its lists use `grid grid-cols-1`.
  - Leave out the collections list until Phase 3 has collections.
- [x] `/app` home in Phase 1: the **first-run state** (centered "Welcome to Echo." card with "Add your first Echo"). There's no data yet, so the loaded dashboard comes in Phase 4.
- [x] Public `/` landing page: a placeholder with the tagline "Words worth coming back to." and a sign-in CTA. Marketing pages use the top nav, not the sidebar.

**Guard rails**
- [x] Run `.agents/skills/echo-design-system/scripts/audit_ui.py src` in CI, so design drift fails the build. Run `contrast.py` for both themes whenever `globals.css` changes.
  - `pnpm audit:ui` runs in CI. `contrast.py` is still a manual step; both themes pass except the known, unused `legal-link`.
- [x] Global `robots`: `noindex` for `/app/*` and `/api/*` (privacy, spec §42).

## 7. Deployment pipeline

- [x] Create a GitHub repo and connect it to Vercel.
- [x] Vercel env vars:
  - Production and Preview → `echo-prod`, the only hosted database;
  - Development → not set in Vercel; local development uses Docker Postgres.
- [x] Build command: `prisma generate && next build`.
- [x] Migrations: run `prisma migrate deploy` in a GitHub Action on merge to `main`, before or alongside the Vercel production deploy. **Never** run migrations from a Preview build. Migrations must be backward-compatible, because Previews share `echo-prod` (see README).
- [x] GitHub Actions CI on every PR: install → typecheck → lint → unit tests → integration tests (against a Postgres service container) → build.
- [x] Vercel: set the function region to match the Supabase project's region. Set `AUTH_SECRET` (a new value, not the local one), `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
- [x] GitHub Actions secrets: the production `DATABASE_URL` and `DIRECT_URL`, used only by the `prisma migrate deploy` job on `main`.
- [x] Add the production domain to Google OAuth's authorized origins and redirect URIs.

## 8. Test infrastructure

- [x] Integration tests run against a disposable Postgres: either a Docker `postgres:17` service, or `supabase start` locally. Reset with `prisma migrate reset --force` before each test run.
  - Changed: the global setup runs `prisma migrate deploy` on the local `echo_test` database, then truncates every app table. Prisma refuses `migrate reset` from an AI agent without per-run consent. The setup refuses any non-local host.
- [x] Test helper `createTestUser()` inserts a User and a Session row and returns the session cookie. Both integration and E2E tests use it, so tests never need to go through Google.
- [x] E2E helper: a Playwright `storageState` fixture that sets that session cookie.

## Tests in this phase

- [x] Unit: the `apiHandler` error mapping produces the spec §39 shape.
- [x] Integration:
  - an unauthenticated request to a protected handler → `401 UNAUTHORIZED`;
  - a request with a valid seeded session → `200`.
- [x] E2E:
  - signed out: `/app` redirects to `/login`;
  - signed in with a seeded session: `/app` renders the sidebar shell and the first-run state;
  - the sidebar collapses to the rail and expands again, and the choice survives a reload;
  - at 375px, the bottom tab bar shows and the sidebar doesn't;
  - with the system set to dark, the shell renders the dark palette.

## Exit criteria

- [x] The `/login` page and the app shell pass the `echo-design-system` validation checklist in **both themes** (`audit_ui.py` 0 errors, `contrast.py` and `contrast.py --theme dark` passing, screenshots at 320–1440px, keyboard pass).
- [x] Local development never touches production: `DATABASE_URL` in `.env` points at Docker, and the Supabase values exist only in Vercel, GitHub secrets and the reference-only `SUPABASE_*` variables.
- [x] A real Google sign-in works locally and on the production URL.
- [x] A user row is created on first sign-in, and the session persists across reloads.
- [x] CI is green, and every PR gets a Vercel preview.
- [x] Migrations are applied to prod by the pipeline, not by hand.
- [x] Data API disabled on `echo-prod` (done in the dashboard). Double-check it with the anon key before launch.
  - The anon-key request returned `PGRST002` and no data. Migration `20261002152550_lock_down_data_api` also revokes every privilege from `anon`/`authenticated` and enables RLS, verified on `echo-prod` (0 grants left, RLS on all tables). Still worth confirming the dashboard toggle is off.
