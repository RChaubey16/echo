# Phase 6 — Production Readiness

**Goal:** Echo is safe to put real people's private words into. This phase covers:

- security hardening;
- a complete authorization test suite;
- ~~backups~~ (dropped, see §3);
- privacy-respecting analytics and error monitoring;
- data export;
- permanent account deletion.

**Spec refs:** §41–43, §53–54, §61 (Data section), §62–65, §66 Phase 6, §67

**Depends on:** Phases 1–5

**UI work in this phase:** use the `echo-design-system` skill (`.claude/skills/echo-design-system/`) for every section that touches the interface: the Settings → Data UI in §6 (Export) and §7 (Delete account dialog), and the privacy and terms pages in §8.

---

## Status (2026-10-04)

The code shipped in PR #8 (`13f7bd5`) and is live at https://echo.ruturaj.xyz. All dashboard
setup is done. What's left is checking a real Sentry event and the spec §67 run by hand on
production; those items stay unchecked below.

**Implementation notes**

- **CSRF:** `apiHandler` rejects non-GET requests whose `Sec-Fetch-Site` is not `same-origin`/`none`, or whose `Origin` host differs from the request host (403). `readJson` accepts only `application/json` (415 `UNSUPPORTED_MEDIA_TYPE`). Clients that send neither header (curl, a future mobile app) carry no ambient cookies and pass.
- **CSP:** `src/proxy.ts` now runs on every page (not only `/app`) and sets a per-request nonce CSP (`src/lib/security-headers.ts`). `style-src` keeps `'unsafe-inline'` because React style props and `next/font` emit inline styles. API routes get `default-src 'none'`. The static headers live in `next.config.ts`.
- **Rate limits:** `apiHandler` puts the route's policy in an AsyncLocalStorage scope; `requireUser()` counts it against the user ID, so every authenticated mutation is limited without each handler remembering to. Without `UPSTASH_REDIS_REST_URL`/`TOKEN` (local, CI, tests) limits are off; production logs a warning if they are missing.
- **Authorization lint:** `no-restricted-syntax` forbids `findUnique` in `src/server` and `src/app`. The two existing calls (own user row, `daily_echoes` keyed by `userId`) carry justified disables. The grep found every `update`/`delete`/`$queryRaw` already scoped by `userId` or by an owned row looked up first.
- **Sentry v11** replaced `sendDefaultPii` with `dataCollection`; everything there is off, including stack-frame variables (a local can hold a quote). `beforeSend` (`src/lib/sentry-scrub.ts`) also strips bodies, cookies, user, query strings (`?q=`) and content keys. Tracing is off and there is no Replay. Server-rendered errors are reported by `onRequestError`; unhandled API errors are captured with their `errorId`; error boundaries report browser-only errors. The browser SDK is loaded only when `NEXT_PUBLIC_SENTRY_DSN` is set, and asynchronously after start-up, so it never slows first load or hydration (loading it eagerly made CI hydration slow enough to expose the `ThemeSync` race below).
- **Analytics:** PostHog EU, server-side only through its capture HTTP API (no SDK, no client script, no CSP host). `$process_person_profile: false`, so there is no person profile. `echo_opened`, `collection_opened` and the search page fire from Server Components.
- **Export** includes the account, every collection and tag (even empty ones) and each Echo's Revisits, beyond the spec's example. Soft-deleted Echoes are not exported. CSV starts with a UTF-8 BOM so Excel reads it correctly.
- **Account deletion** is one `DELETE FROM users` that cascades. Google tokens are revoked after the response (best effort). The goodbye message is `/?goodbye=1`.
- **ThemeSync fix:** it now reapplies the saved theme when the page's `data-theme` disagrees with the cookie, not only when the cookie does. A slow-hydrating tab could rewrite the cookie after another page was rendered without it, leaving that page on the wrong theme.
- **Free tiers only:** every service runs on its free plan (Vercel Hobby, Supabase Free, PostHog, Upstash, Sentry Developer).
- **Backups: dropped (owner decision, 2026-10-04).** `echo-prod` stays on the Supabase free plan, which has no backups, and no independent dump runs. A database loss would be unrecoverable. `/privacy` and `/terms` say so and point users to Settings › Your data to export.

**Owner actions**

Done (2026-10-04):

- [x] Supabase: DB password rotated; anon key confirmed unable to read `echoes`.
- [x] Vercel Production env: fresh `AUTH_SECRET`, Upstash, Sentry and PostHog keys and `NEXT_PUBLIC_CONTACT_EMAIL`, set for Production only (not Preview).
- [x] PostHog (EU cloud): project created; autocapture and session recording off.
- [x] GitHub: a `main` ruleset (PR required with 0 approvals, no force pushes or deletion) requiring `check`, `Secret scan` and `Dependency audit`.
- [x] Local `.env` holds the PostHog keys for reference; test runs set `ANALYTICS_DISABLED=1` so they never send events.

After the production deploy:

- [x] Custom domain with HTTPS on Vercel: `echo.ruturaj.xyz`. Checked from outside: HTTP redirects to HTTPS, every security header is present, `/api/health` answers, signed-out `/app` redirects to `/login`, and the Auth.js callback uses the domain.
- [x] Sentry: an uptime monitor on `https://echo.ruturaj.xyz/api/health` every minute, and an email alert on errors. The health check also keeps the free Supabase project from pausing.
- [x] Google OAuth consent screen: app name, privacy (`/privacy`) and terms (`/terms`) URLs, the verified domain and the `https://echo.ruturaj.xyz/api/auth/callback/google` redirect URI; published to production.
- [x] Inspect a real PostHog event: `echo_created` carries only `hasAuthor`, `hasReflection`, `tagCount` and `collectionCount`.
- [ ] Inspect a real Sentry event from production: no quote or reflection text, cookies or request bodies. (A manual test event, tagged `source: manual-test`, was sent on 2026-10-04 to add `production` to Sentry's environment list; it isn't an app event.)
- [ ] Run spec §67 by hand on prod with a fresh Google account, then export that account's data and delete it.

## 1. Security review

**Authentication and sessions**

- [x] Session cookies are `HttpOnly`, `Secure` and `SameSite=Lax`. Auth.js does this by default; verify it.
- [x] `AUTH_SECRET` is rotated for prod and differs per environment.
- [x] Sign out invalidates the session row.

**Authorization**

- [x] Grep the codebase for `findUnique(`, `update(`, `delete(` and `$queryRaw`. Confirm that every query on user-owned data is scoped by `userId`.
- [x] Add an ESLint rule or code-review checklist item for this.

**CSRF**

- [x] Auth.js protects its own routes.
- [x] For our mutation route handlers:
  - check the `Origin` header against the app's own host;
  - accept only JSON requests, and reject non-JSON content types.

**XSS**

- [x] No `dangerouslySetInnerHTML` anywhere. Add the `react/no-danger` lint rule set to `error`.

**Security headers** (`next.config` / middleware)

- [x] Content Security Policy: `default-src 'self'`, with nonces for scripts, and allow-listed analytics and Sentry hosts.
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy` (deny camera, mic, geolocation)
- [x] `frame-ancestors 'none'`
- [x] `Strict-Transport-Security`

**Rate limiting** (spec §41)

Vercel functions are stateless, so use **Upstash Redis + `@upstash/ratelimit`**:

- [x] Mutations: 60 per minute per user.
- [x] Search: 30 per minute per user.
- [x] `/api/auth/*`: 20 per minute per IP.
- [x] Return `429 RATE_LIMITED` when a limit is hit.

**Supabase**

- [x] Confirm the Data API is disabled, or RLS is enabled on every table. Test with the anon key: it must not be able to read `echoes`.
- [x] Rotate the DB password. Restrict the network to Vercel egress if your plan supports it. (Network restrictions aren't available on the free plan; skipped.)
- [x] The service-role key is never present in the app's env.

**Dependencies**

- [x] Enable `npm audit` / Dependabot / Renovate in CI.

**Secrets**

- [x] None in the repo. Add a `gitleaks` pre-commit hook or CI step.

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

- [x] After each attempted write, check in the DB that B's rows are byte-for-byte unchanged.
- [x] Generate the table rows from a route manifest, so a new route fails CI until it is covered by this suite.

## 3. Database backups (spec §53): dropped

**Decision (2026-10-04):** no backups. `echo-prod` stays on the Supabase free plan (no daily backups, no PITR) and no independent `pg_dump` job runs. If the database is lost, users' libraries can't be recovered.

- [x] The privacy policy and terms state that Echo keeps no backups, that deleted data leaves no copy, and that users should export their data to keep it safe.
- Revisit this decision before Echo has users other than the owner. The cheapest option is a nightly encrypted `pg_dump` from GitHub Actions to Cloudflare R2's free tier, which doesn't need Supabase Pro.

## 4. Error monitoring & logging (spec §63)

- [x] Sentry (`@sentry/nextjs`) on the client and server, with these settings:
  - `sendDefaultPii: false` (in Sentry v11 this is `dataCollection`, with every switch off);
  - a `beforeSend` hook that strips request bodies, cookies and the `quote`, `reflection` and `name` fields;
  - no Session Replay, or Replay with all text masked.
- [x] Logs include the request ID, error ID, route, status and duration. The `error.tsx` UI shows the same error ID.
- [x] Log drain: Vercel log drain → Axiom / Better Stack, or Vercel's built-in logs to start with. (Vercel's built-in logs for now.)
- [x] Alerts:
  - error rate above the threshold;
  - `/api/health` failing (uptime check every minute).

## 5. Analytics (spec §43)

- [x] Pick a privacy-respecting tool: **PostHog** (EU cloud, with autocapture **off** and session recording **off**) or **Plausible** plus custom events.
- [x] Add a typed `track(event, props)` wrapper. Props are an allow-list of non-content fields only:

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

- [x] Fire events server-side after a successful mutation where possible, which makes them immune to ad-blockers and more accurate.
- [x] A unit test asserts that the `track` props type cannot accept the fields `quote`, `reflection` or `q`.
- [x] Mention analytics in the Privacy section of Settings.
- [x] Note: `share_created` is skipped, because sharing is not built in the MVP.

## 6. Export — `GET /api/export?format=json|csv` (spec §54)

- [x] JSON in the spec §54 shape, including tags, collections, reflection, mood, favorite state, `savedAt` and Revisits.
- [x] CSV: one row per Echo. Tags and collections are joined with `; `. Values are escaped properly, and cells starting with `=`, `+`, `-` or `@` are guarded against formula injection.
- [x] Stream the response for large libraries, with `Content-Disposition: attachment; filename="echo-export-YYYY-MM-DD.json"`.
- [x] Rate limit: 5 per hour per user.
- [x] Settings → Data → "Export my data" (JSON / CSV buttons).

## 7. Account deletion (spec §62)

- [x] Settings → Data → "Delete account":
  - a dialog explains what will be deleted;
  - the user must type `DELETE` (or their email) to confirm;
  - then the final button.
- [x] `DELETE /api/account`:
  - deletes the `User` in one transaction; `onDelete: Cascade` removes their sessions, accounts, Echoes (including soft-deleted ones), join rows, tags, collections, Revisits and DailyEcho rows;
  - revokes the Google token if one is stored (optional);
  - clears the session cookie and redirects to `/` with a goodbye message.
- [x] Remove the user's data from analytics too (PostHog person delete API) and from Sentry, if the user is identified there.
- [x] Integration test: after deletion, a raw-SQL count of every table for that `user_id` is 0, and another user's data is untouched.

## 8. Launch checklist

- [x] Privacy policy and terms pages. Both must cover: Google sign-in, what is stored, analytics, backups (none), and deletion.
- [x] Google OAuth consent screen published, moved from "Testing" to "In production", with the app name, logo, privacy URL and domain verified.
- [x] Custom domain with HTTPS on Vercel.
- [x] `robots.txt`: allow `/` and `/login`; disallow `/app` and `/api`.
- [x] Prod env vars reviewed. Local development and CI point only at Docker Postgres. Previews share `echo-prod`, so no seed, reset or test script can run there.
- [ ] Full spec §67 Definition of Done run by hand on prod with a fresh Google account.
- [ ] Spec §64 E2E critical flows green against a production-like environment. The Signup flow is replaced by Google sign-in via a seeded session.

## Tests in this phase

- [x] The authorization suite (section 2) runs in CI and is required for merge.
- [x] Rate-limit integration test, using a mocked Upstash client.
- [x] Export: snapshot of the JSON shape, plus CSV escaping and formula-injection cases.
- [x] Account deletion: completeness test (section 7).
- [x] A security headers test: fetch `/` and `/app`, then assert the CSP, HSTS and frame-ancestors headers.

## Exit criteria (= MVP done)

- [x] The Phase 6 UI (export, account deletion, legal pages) passes the `echo-design-system` validation checklist.
- [ ] All 15 items of spec §67 pass on production.
- [x] Authorization suite green. No open high or critical findings from the security review.
- ~~A backup restore has been tested at least once, and the runbook is written.~~ Dropped with §3.
- [ ] Analytics and Sentry are confirmed, by inspecting real payloads, to carry no quote or reflection text.
- [ ] A user can export their data and delete their account on their own.
