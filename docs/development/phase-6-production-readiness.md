# Phase 6 — Production Readiness

**Goal:** Echo is safe to put real people's private words into. This phase covers:

- security hardening;
- a complete authorization test suite;
- backups;
- privacy-respecting analytics and error monitoring;
- data export;
- permanent account deletion.

**Spec refs:** §41–43, §53–54, §61 (Data section), §62–65, §66 Phase 6, §67

**Depends on:** Phases 1–5

**UI work in this phase:** use the `echo-design-system` skill (`.claude/skills/echo-design-system/`) for every section that touches the interface: the Settings → Data UI in §6 (Export) and §7 (Delete account dialog), and the privacy and terms pages in §8.

---

## 1. Security review

**Authentication and sessions**

- [ ] Session cookies are `HttpOnly`, `Secure` and `SameSite=Lax`. Auth.js does this by default; verify it.
- [ ] `AUTH_SECRET` is rotated for prod and differs per environment.
- [ ] Sign out invalidates the session row.

**Authorization**

- [ ] Grep the codebase for `findUnique(`, `update(`, `delete(` and `$queryRaw`. Confirm that every query on user-owned data is scoped by `userId`.
- [ ] Add an ESLint rule or code-review checklist item for this.

**CSRF**

- [ ] Auth.js protects its own routes.
- [ ] For our mutation route handlers:
  - check the `Origin` header against the app's own host;
  - accept only JSON requests, and reject non-JSON content types.

**XSS**

- [ ] No `dangerouslySetInnerHTML` anywhere. Add the `react/no-danger` lint rule set to `error`.

**Security headers** (`next.config` / middleware)

- [ ] Content Security Policy: `default-src 'self'`, with nonces for scripts, and allow-listed analytics and Sentry hosts.
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` (deny camera, mic, geolocation)
- [ ] `frame-ancestors 'none'`
- [ ] `Strict-Transport-Security`

**Rate limiting** (spec §41)

Vercel functions are stateless, so use **Upstash Redis + `@upstash/ratelimit`**:

- [ ] Mutations: 60 per minute per user.
- [ ] Search: 30 per minute per user.
- [ ] `/api/auth/*`: 20 per minute per IP.
- [ ] Return `429 RATE_LIMITED` when a limit is hit.

**Supabase**

- [ ] Confirm the Data API is disabled, or RLS is enabled on every table. Test with the anon key: it must not be able to read `echoes`.
- [ ] Rotate the DB password. Restrict the network to Vercel egress if your plan supports it.
- [ ] The service-role key is never present in the app's env.

**Dependencies**

- [ ] Enable `npm audit` / Dependabot / Renovate in CI.

**Secrets**

- [ ] None in the repo. Add a `gitleaks` pre-commit hook or CI step.

## 2. Authorization test suite (spec §65)

A dedicated `tests/integration/authz.test.ts`. It creates users A and B, gives each a full dataset, and checks every route as A against B's resources.

| Resource | GET | PATCH | DELETE | Attach/reference |
|---|---|---|---|---|
| Echo | 404 | 404 | 404 | — |
| Collection | 404 | 404 | 404 | `collectionIds` → 403 |
| Collection membership | — | — | 404 | add B's Echo → 404 |
| Tag | — | 404 | 404 | `tagIds` → 403 |
| Revisit | 404 | 404 | 404 | create on B's Echo → 404 |
| Search / list / today / random | never contains B's data | | | |
| Export | contains only A's data | | | |

- [ ] After each attempted write, check in the DB that B's rows are byte-for-byte unchanged.
- [ ] Generate the table rows from a route manifest, so a new route fails CI until it is covered by this suite.

## 3. Database backups (spec §53)

- [ ] Upgrade `echo-prod` to the Supabase Pro plan, which includes daily backups with 7-day retention.
- [ ] Enable the **PITR** add-on, if the budget allows.
- [ ] A second, independent backup: a nightly GitHub Action runs `pg_dump` against `DIRECT_URL`, encrypts the dump (`age` or GPG), and uploads it to private storage with 30-day retention. This is the first real use of S3-compatible storage; Cloudflare R2 or Backblaze B2 are also fine.
- [ ] **Restore drill:** restore the latest dump into a local Docker Postgres (never into `echo-prod`) and run the smoke tests against it. Document the steps in `docs/development/runbook-restore.md`, and repeat the drill quarterly.
- [ ] Write the backup retention policy into the privacy policy: deleted data is gone from backups after N days.

## 4. Error monitoring & logging (spec §63)

- [ ] Sentry (`@sentry/nextjs`) on the client and server, with these settings:
  - `sendDefaultPii: false`;
  - a `beforeSend` hook that strips request bodies, cookies and the `quote`, `reflection` and `name` fields;
  - no Session Replay, or Replay with all text masked.
- [ ] Logs include the request ID, error ID, route, status and duration. The `error.tsx` UI shows the same error ID.
- [ ] Log drain: Vercel log drain → Axiom / Better Stack, or Vercel's built-in logs to start with.
- [ ] Alerts:
  - error rate above the threshold;
  - `/api/health` failing (uptime check every minute).

## 5. Analytics (spec §43)

- [ ] Pick a privacy-respecting tool: **PostHog** (EU cloud, with autocapture **off** and session recording **off**) or **Plausible** plus custom events.
- [ ] Add a typed `track(event, props)` wrapper. Props are an allow-list of non-content fields only:

| Event | Allowed props |
|---|---|
| `signup_completed` | — |
| `echo_created` | `hasAuthor`, `hasReflection`, `tagCount`, `collectionCount` |
| `echo_updated` / `echo_deleted` | — |
| `echo_favorited` / `echo_unfavorited` | — |
| `echo_revisited` | `daysSinceSaved` |
| `search_performed` | `resultCount` (never the query text) |
| `collection_created` / `collection_opened` | — |
| `echo_opened` | `daysSinceSaved` (feeds the North Star metric, spec §72) |

- [ ] Fire events server-side after a successful mutation where possible, which makes them immune to ad-blockers and more accurate.
- [ ] A unit test asserts that the `track` props type cannot accept the fields `quote`, `reflection` or `q`.
- [ ] Mention analytics in the Privacy section of Settings.
- [ ] Note: `share_created` is skipped, because sharing is not built in the MVP.

## 6. Export — `GET /api/export?format=json|csv` (spec §54)

- [ ] JSON in the spec §54 shape, including tags, collections, reflection, mood, favorite state, `savedAt` and Revisits.
- [ ] CSV: one row per Echo. Tags and collections are joined with `; `. Values are escaped properly, and cells starting with `=`, `+`, `-` or `@` are guarded against formula injection.
- [ ] Stream the response for large libraries, with `Content-Disposition: attachment; filename="echo-export-YYYY-MM-DD.json"`.
- [ ] Rate limit: 5 per hour per user.
- [ ] Settings → Data → "Export my data" (JSON / CSV buttons).

## 7. Account deletion (spec §62)

- [ ] Settings → Data → "Delete account":
  - a dialog explains what will be deleted;
  - the user must type `DELETE` (or their email) to confirm;
  - then the final button.
- [ ] `DELETE /api/account`:
  - deletes the `User` in one transaction; `onDelete: Cascade` removes their sessions, accounts, Echoes (including soft-deleted ones), join rows, tags, collections, Revisits and DailyEcho rows;
  - revokes the Google token if one is stored (optional);
  - clears the session cookie and redirects to `/` with a goodbye message.
- [ ] Remove the user's data from analytics too (PostHog person delete API) and from Sentry, if the user is identified there.
- [ ] Integration test: after deletion, a raw-SQL count of every table for that `user_id` is 0, and another user's data is untouched.

## 8. Launch checklist

- [ ] Privacy policy and terms pages. Both must cover: Google sign-in, what is stored, analytics, backup retention, and deletion.
- [ ] Google OAuth consent screen published, moved from "Testing" to "In production", with the app name, logo, privacy URL and domain verified.
- [ ] Custom domain with HTTPS on Vercel.
- [ ] `robots.txt`: allow `/` and `/login`; disallow `/app` and `/api`.
- [ ] Prod env vars reviewed. Local development and CI point only at Docker Postgres. Previews share `echo-prod`, so no seed, reset or test script can run there.
- [ ] Full spec §67 Definition of Done run by hand on prod with a fresh Google account.
- [ ] Spec §64 E2E critical flows green against a production-like environment. The Signup flow is replaced by Google sign-in via a seeded session.

## Tests in this phase

- [ ] The authorization suite (section 2) runs in CI and is required for merge.
- [ ] Rate-limit integration test, using a mocked Upstash client.
- [ ] Export: snapshot of the JSON shape, plus CSV escaping and formula-injection cases.
- [ ] Account deletion: completeness test (section 7).
- [ ] A security headers test: fetch `/` and `/app`, then assert the CSP, HSTS and frame-ancestors headers.

## Exit criteria (= MVP done)

- [ ] The Phase 6 UI (export, account deletion, legal pages) passes the `echo-design-system` validation checklist.
- [ ] All 15 items of spec §67 pass on production.
- [ ] Authorization suite green. No open high or critical findings from the security review.
- [ ] A backup restore has been tested at least once, and the runbook is written.
- [ ] Analytics and Sentry are confirmed, by inspecting real payloads, to carry no quote or reflection text.
- [ ] A user can export their data and delete their account on their own.
