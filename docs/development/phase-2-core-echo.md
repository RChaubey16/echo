# Phase 2 — Core Echo

**Goal:** A user can save a quote in a few seconds, then view, edit, favorite and (soft) delete it. Every read and write is scoped to the owner.

**Spec refs:** §9, §18, §21–25, §36–38, §40, §48, §52, §65, §66 Phase 2

**Depends on:** Phase 1

**UI work in this phase:** use the `echo-design-system` skill (`.claude/skills/echo-design-system/`) for every section that touches the interface: §5 (first UI primitives), §6 (Echo components) and §7 (pages).

---

## 1. Schema

```prisma
model Echo {
  id             String    @id @default(uuid()) @db.Uuid
  userId         String    @map("user_id") @db.Uuid
  quote          String    @db.Text
  author         String?   @db.VarChar(500)
  source         String?   @db.VarChar(1000)
  reflection     String?   @db.Text
  mood           String?   @db.VarChar(100)
  isFavorite     Boolean   @default(false) @map("is_favorite")
  favoritedAt    DateTime? @map("favorited_at")     // enables "recently favorited" sort (§28)
  lastSurfacedAt DateTime? @map("last_surfaced_at") // used in Phase 4
  savedAt        DateTime  @default(now()) @map("saved_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, deletedAt, savedAt])
  @@index([userId, deletedAt, updatedAt])
  @@index([userId, isFavorite])
  @@map("echoes")
}
```

- [x] Add `echoes Echo[]` to `User`, then migrate.
- [x] Composite indexes start with `user_id`, because every query filters by it. They replace the separate single-column indexes listed in spec §51.

## 2. Validation (`src/server/validation/echo.ts`)

- [x] `echoCreateSchema`:
  - `quote`: trimmed, 1–10,000 characters;
  - `author`: ≤500 characters;
  - `source`: ≤1,000 characters;
  - `reflection`: ≤10,000 characters;
  - `mood`: ≤100 characters;
  - `isFavorite`: optional boolean;
  - for optional fields, empty strings are normalized to `null`.
- [x] `echoUpdateSchema = echoCreateSchema.partial()`. Requests with no fields are rejected.
- [x] `echoListQuerySchema`:
  - `page` defaults to 1;
  - `limit` defaults to 20, max 100;
    - Changed: a larger `limit` is clamped to 100 rather than rejected.
  - `sort`: `newest | oldest | recently_updated | author`;
  - `favorite`: boolean.
  - `tag`, `collection` and `search` are added in Phase 3.
- [x] The client forms reuse these same schemas.

## 3. Service layer (`src/server/services/echoes.ts`)

Every function takes `userId` first. Every query includes `userId` and `deletedAt: null`.

- [x] `createEcho(userId, input)`
- [x] `getEcho(userId, id)` throws `ECHO_NOT_FOUND` (404) when the Echo is missing, deleted, or owned by someone else.
- [x] `listEchoes(userId, query)` returns `{ items, page, limit, total, hasMore }`.
  - Sort `author` puts nulls last, then falls back to `savedAt desc`.
- [x] `updateEcho(userId, id, patch)`:
  - first does an ownership check with `updateMany({ where: { id, userId, deletedAt: null } })`; if `count === 0`, throws 404;
    - Changed: runs in a transaction that first reads the owned row (needed to know the current favorite state), then writes with the scoped `updateMany` and checks `count`. Re-sending the current `isFavorite` keeps the original `favoritedAt`.
  - when `isFavorite` changes, sets or clears `favoritedAt`.
- [x] `setFavorite(userId, id, value)` is a thin wrapper around `updateEcho`.
- [x] `softDeleteEcho(userId, id)` sets `deletedAt = now()`.
- [x] A `serializeEcho()` DTO keeps `userId` and `deletedAt` out of responses.

## 4. API routes

| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/echoes` | 201 + Echo DTO (the bare object, as in spec §36) |
| `GET` | `/api/echoes` | paginated list |
| `GET` | `/api/echoes/:id` | 404 if not owned |
| `PATCH` | `/api/echoes/:id` | partial update |
| `DELETE` | `/api/echoes/:id` | soft delete → 204 |

- [x] All routes are wrapped in `apiHandler` and `requireUser`.
- [x] Route params are validated as UUIDs. A malformed ID returns 404, not 500.
  - The check lives in the service (`ownedEcho`), so pages calling `getEcho` get the same 404. A malformed JSON body returns `400 VALIDATION_ERROR` (`readJson` in `http.ts`).

## 5. Design system — first components (`src/components/ui`)

> Build with the `echo-design-system` skill. Its `references/components.md` has the spec and the full set of states for each primitive.

Build only what this phase needs. Make every component accessible from the start.

- [x] `Button` (variants: primary, secondary, ghost, danger; plus a loading state)
- [x] `Input`, `Textarea` (auto-grow), `Label`, `FieldError` (linked to its field with `aria-describedby`). Resting outline is `border-border-input` (3.7:1); disabled buttons use `on-primary-disabled` text.
- [x] `Dialog`: focus trap, Esc to close, returns focus when closed; a bottom sheet below 744px. Native `<dialog>` with `showModal()` or Radix Dialog.
  - Native `<dialog>`. Contents mount only while open. The sheet enters with `animate-rise-in` (no separate slide-up keyframe, to avoid a new token) and closes without an exit animation.
- [x] `Toast`: success/error messages in an `aria-live` region.
- [x] `Card`

## 6. Echo components (`src/components/echo`)

> Build with the `echo-design-system` skill. QuoteText, QuoteCard, EchoRow, FavoriteButton, EchoForm, QuickCapture and DeleteEchoDialog are all specified there. The approved visual reference is `docs/mockups/dashboard.html`.

- [x] `QuoteText`: the only place quote typography lives. Quotes are set in **Newsreader** (`font-quote` with `text-quote-hero` / `text-quote-card` / `text-quote-compact`); everything else stays in Inter.
- [x] `QuoteCard`: props as in spec §48 (`echo`, `showReflection`, `showTags`, `showSavedDate`, `compact`).
  - The quote is rendered through `QuoteText` as plain text with preserved line breaks.
  - Cards are as tall as their content (grids use `items-start`), so short quotes don't leave empty gaps.
  - The saved date is shown as a relative date ("Saved 11 months ago").
  - Tags are not shown yet; `showTags` does nothing until Phase 3.
- [x] `FavoriteButton`: optimistic toggle. On failure, roll back and show a toast. Uses `aria-pressed`.
- [x] `EchoForm`: used for both create and edit.
  - The quote textarea is autofocused.
  - "More details" (author, source, reflection, mood) sits in an expandable section. It starts collapsed on create and expanded on edit.
  - `Cmd/Ctrl+Enter` saves.
  - Validation errors are shown inline.
- [x] `EchoRow`: the compact list row used in dashboard panels (serif quote clamped to 2 lines, "attribution · saved date" meta line, heart on the right, hover fill, optional author-initial monogram).
- [x] `QuickCapture`: the **Add Echo** dialog, so saving takes seconds.
  - Quote is the only field and is autofocused; "More details" holds author, source, reflection and mood (collections join in Phase 3).
  - `Cmd/Ctrl+Enter` saves; an empty quote shows "Add the quote you want to save." inline; Esc or Cancel with text typed asks "Discard this quote?" first.
  - On save: "Saving…", then the dialog closes, the toast "Echo saved" appears, and focus returns to what opened it.
  - "Open full form" links to `/app/echoes/new` for long entries.
  - The Add Echo links stay real links to `/app/echoes/new` (`AddEchoLink`); a plain click opens the dialog, modified clicks open the page. The toast carries a "View" action.
- [x] `DeleteEchoDialog`: uses the confirmation copy from spec §25.

## 7. Pages

> Build with the `echo-design-system` skill. Follow its layout guidance and screen layouts (Library, Detail, New and Edit).

- [x] `/app/echoes`: library list. Turn on the sidebar's **Library** item.
  - Paginated (18 per page, which fills 1, 2 and 3 columns evenly), with a sort selector.
  - Uses `QuoteCard`.
  - Shows a basic empty state with an "Add your first Echo" CTA.
- [x] `/app/echoes/new`: the full `EchoForm` (reached from QuickCapture's "Open full form"). On save, redirect to `/app/echoes/:id`.
- [x] `/app/echoes/:id`: detail page.
  - Shows the quote, author, source, reflection, mood, saved date and favorite state.
  - Actions: Favorite, Edit, Delete.
  - Revisit and Share are added later.
- [x] `/app/echoes/:id/edit`: `EchoForm`, pre-filled.
- [x] Wire the sidebar's **Add Echo** button, the rail's and bottom tab bar's round Add button, and the shortcut `n` (ignored while typing) to open **QuickCapture**.
- [x] `notFound()` for missing or not-owned Echoes. Show a friendly 404 page.
- Added: `/app` Home shows the first-run state with 0 Echoes, otherwise a "Recently added" panel of five `EchoRow`s until the Phase 4 dashboard.
- Added: route-level `error.tsx` (Next 16 passes `retry`, not `reset`) with the error ID, and skeleton `loading.tsx` for the library and detail pages.

Mutations go through **Server Actions** or `fetch` to the route handlers. Pick one approach and use it everywhere. Recommendation: route handlers plus a small typed client (`src/lib/api.ts`), which keeps the API-first principle honest.

- Chosen: route handlers plus `src/lib/api.ts`.
- The full form is read-only until it hydrates (`useHydrated`), because typing into a controlled field before hydration could garble the text. The app shell sets `html[data-hydrated]` once React runs; E2E tests wait for it.
- `pnpm typecheck` now runs `next typegen` first, so `PageProps` route types exist on a fresh CI checkout.

## Tests in this phase

**Unit**

- [x] Zod schema boundaries: empty quote, 10,000 vs 10,001 characters, whitespace-only quote, empty string becoming `null`.
- [x] The `favoritedAt` set/clear logic.

**Integration** (real DB)

- [x] Create → get → update (check that `updatedAt` changes) → soft delete → get returns 404 → list excludes it.
- [x] Pagination: `limit` is capped at 100. Each sort order is checked.
- [x] **Authorization** (spec §65, cases 1–3):
  - user A tries to GET, PATCH or DELETE user B's Echo → 404 each time;
  - check in the DB that B's row is unchanged.

**E2E**

- [x] Sign in → Add Echo (quote only) → lands on the detail page.
- [x] Add Echo → Favorite → reload → still favorited.
- [x] Quick capture: press `n` → type a quote → `Cmd/Ctrl+Enter` → the toast "Echo saved" appears and the Echo is in the library; an empty submit shows the inline error.
- [x] Edit an Echo → the change shows on the detail page.
- [x] Delete an Echo → it is gone from the library.

## Exit criteria

- [x] All Phase 2 UI passes the `echo-design-system` validation checklist (`audit_ui.py` 0 errors, 320–1440px screenshots, keyboard pass).
- [x] Saving a quote-only Echo takes ≤3 interactions: click +, paste, Cmd+Enter.
- [ ] All CRUD works end to end on the preview deploy.
- [x] Every authorization integration test passes.
- [x] No user content appears in the server logs. Check this by grepping logs from a test run.
  - `tests/integration/echoes.test.ts` captures every log line from the API run and asserts no quote text appears.
