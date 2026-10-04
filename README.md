<div align="center">

<img src="src/app/icon.svg" alt="" width="72" height="72">

# Echo

**Words worth coming back to.**

A private library for the quotes that stay with you, and what they meant to you at the time.

[**echo.ruturaj.xyz**](https://echo.ruturaj.xyz)

[![CI](https://github.com/RChaubey16/echo/actions/workflows/ci.yml/badge.svg)](https://github.com/RChaubey16/echo/actions/workflows/ci.yml)
[![Security](https://github.com/RChaubey16/echo/actions/workflows/security.yml/badge.svg)](https://github.com/RChaubey16/echo/actions/workflows/security.yml)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_6-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_17-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-Google_OAuth-7C3AED)
![Zod](https://img.shields.io/badge/Zod_4-3E67B1?logo=zod&logoColor=white)
<br>
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?logo=sentry&logoColor=white)
![PostHog](https://img.shields.io/badge/PostHog-1D4AFF?logo=posthog&logoColor=white)
![Upstash](https://img.shields.io/badge/Upstash_Redis-00E9A3?logo=upstash&logoColor=black)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)

</div>

---

## What it does

Echo is not a quote feed. It's a personal library: you save the words that mattered to you, add
why they mattered, and Echo brings them back to you over time.

- **Save in seconds:** a quick-capture dialog needs only the quote; author, source, mood,
  reflection, tags and collections are optional.
- **Organize:** tags, collections and favorites.
- **Find anything:** full-text search across quotes, authors, sources, reflections, tags and
  collections.
- **Rediscover:** a daily _Today's Echo_, an _Echo me something_ button, and _Revisits_ you
  schedule for later.
- **Yours to keep:** export everything as JSON or CSV, or delete your account and all its data
  at any time.
- **Comfortable anywhere:** light and dark themes, built for phones as well as desktops, and
  checked for accessibility (WCAG 2.2 AA).

## Private by design

- Only you can see your Echoes. Nothing is public or shared.
- Sign-in is Google only: Echo reads your name, email and photo, and nothing else.
- Analytics and error reports never contain your quotes, reflections or searches.
- Every request is checked for ownership, and a test suite proves one user can never read or
  change another's data.

Read the full [privacy policy](https://echo.ruturaj.xyz/privacy).

## Tech stack

| Layer         | Choice                                                                      |
| ------------- | --------------------------------------------------------------------------- |
| App and API   | Next.js (App Router) with Route Handlers, React, TypeScript (strict)        |
| Styling       | Tailwind CSS v4, design tokens from [`DESIGN.md`](DESIGN.md)                |
| Database      | PostgreSQL on Supabase (database only), accessed through Prisma             |
| Auth          | Auth.js (NextAuth v5) with Google OAuth and database sessions               |
| Validation    | Zod, shared by forms and API handlers                                       |
| Rate limiting | Upstash Redis with `@upstash/ratelimit`                                     |
| Monitoring    | Sentry (errors, uptime) and PostHog (privacy-safe, server-side analytics)   |
| Testing       | Vitest (unit, integration), Playwright with axe (end-to-end, accessibility) |
| Hosting       | Vercel                                                                      |

## Getting started

**You need:** Node 22, pnpm and Docker.

```bash
pnpm install
cp .env.example .env    # fill in AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
pnpm db:up              # Postgres 17 in Docker (dev db `echo`, test db `echo_test`)
pnpm db:migrate         # apply migrations to the local database
pnpm dev                # http://localhost:3000
```

Local development never touches production: `.env` points at the Docker database. Sentry,
PostHog and Upstash are optional locally and stay off when their keys are unset. See
[`.env.example`](.env.example) for every variable.

## Scripts

| Command          | What it does                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `pnpm dev`       | Start the dev server                                                   |
| `pnpm build`     | Production build                                                       |
| `pnpm typecheck` | Type-check the project                                                 |
| `pnpm lint`      | ESLint                                                                 |
| `pnpm format`    | Format with Prettier (`format:check` to verify only)                   |
| `pnpm test`      | Unit and integration tests (integration uses the `echo_test` database) |
| `pnpm test:e2e`  | Playwright end-to-end tests on their own dev server (port 3100)        |
| `pnpm audit:ui`  | Design-system audit for raw colors, missing focus styles and more      |
| `pnpm db:studio` | Browse the local database in Prisma Studio                             |

## Project structure

```text
src/
  app/              # pages, layouts and API route handlers (app/api/*)
  components/
    ui/             # generic building blocks: Button, Dialog, Input…
    echo/           # Echo-specific components: QuoteCard, EchoForm…
    shell/          # sidebar, mobile navigation, theme and time-zone sync
  server/
    services/       # business logic; every query is scoped to the signed-in user
    validation/     # Zod schemas shared with the client
  lib/              # pure helpers (dates, CSV, security headers…)
prisma/             # schema and migrations
tests/              # unit/, integration/ and e2e/
docs/               # product spec and the phase-by-phase build plan
```

## Quality and security

Every pull request runs typecheck, lint, formatting, the design audit, unit, integration and
end-to-end tests, a Lighthouse performance budget, a secret scan and a dependency audit. `main` is
protected and only changes through pull requests that pass them.

Highlights:

- **Authorization suite:** user A attacks every API route with user B's IDs. Routes are found
  from the file system, so a new route fails CI until it's covered.
- **Hardening:** a nonce-based Content Security Policy, CSRF checks, HSTS and other security
  headers, and per-user rate limits.
- **Accessibility:** axe runs on every main route in both themes and at mobile width.

## Documentation

- [Product plan](docs/echo-product-plan.md): the why.
- [Technical spec](docs/echo-techincal-prod-spec.md): the what.
- [Build plan](docs/development/README.md): the six phases, from foundation to production
  readiness.
- [Design system](DESIGN.md): colors, type, spacing and components.
- [`CLAUDE.md`](CLAUDE.md): repository rules for contributors and AI agents.
