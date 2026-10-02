# Echo

Private personal quote & reflection library. Words worth coming back to.

See `CLAUDE.md` for project rules and `docs/development/` for the build plan.

## Local development

Requires Node 22, pnpm and Docker.

```bash
pnpm install
cp .env.example .env      # then fill in the AUTH_* values
pnpm db:up                # Postgres 17 in Docker (dev db `echo`, test db `echo_test`)
pnpm db:migrate           # apply migrations to the local dev database
pnpm dev                  # http://localhost:3000
```

Local development never touches production: `DATABASE_URL` and `DIRECT_URL` in `.env` point at Docker.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test          # unit + integration (integration uses the local echo_test database)
pnpm test:e2e      # Playwright; starts its own dev server on :3100 against echo_test
pnpm audit:ui      # echo-design-system drift audit
```
