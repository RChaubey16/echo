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

- [ ] Add `echoes Echo[]` to `User`, then migrate.
- [ ] Composite indexes start with `user_id`, because every query filters by it. They replace the separate single-column indexes listed in spec §51.

## 2. Validation (`src/server/validation/echo.ts`)

- [ ] `echoCreateSchema`:
  - `quote`: trimmed, 1–10,000 characters;
  - `author`: ≤500 characters;
  - `source`: ≤1,000 characters;
  - `reflection`: ≤10,000 characters;
  - `mood`: ≤100 characters;
  - `isFavorite`: optional boolean;
  - for optional fields, empty strings are normalized to `null`.
- [ ] `echoUpdateSchema = echoCreateSchema.partial()`. Requests with no fields are rejected.
- [ ] `echoListQuerySchema`:
  - `page` defaults to 1;
  - `limit` defaults to 20, max 100;
  - `sort`: `newest | oldest | recently_updated | author`;
  - `favorite`: boolean.
  - `tag`, `collection` and `search` are added in Phase 3.
- [ ] The client forms reuse these same schemas.

## 3. Service layer (`src/server/services/echoes.ts`)

Every function takes `userId` first. Every query includes `userId` and `deletedAt: null`.

- [ ] `createEcho(userId, input)`
- [ ] `getEcho(userId, id)` throws `ECHO_NOT_FOUND` (404) when the Echo is missing, deleted, or owned by someone else.
- [ ] `listEchoes(userId, query)` returns `{ items, page, limit, total, hasMore }`.
  - Sort `author` puts nulls last, then falls back to `savedAt desc`.
- [ ] `updateEcho(userId, id, patch)`:
  - first does an ownership check with `updateMany({ where: { id, userId, deletedAt: null } })`; if `count === 0`, throws 404;
  - when `isFavorite` changes, sets or clears `favoritedAt`.
- [ ] `setFavorite(userId, id, value)` is a thin wrapper around `updateEcho`.
- [ ] `softDeleteEcho(userId, id)` sets `deletedAt = now()`.
- [ ] A `serializeEcho()` DTO keeps `userId` and `deletedAt` out of responses.

## 4. API routes

| Method | Route | Notes |
|---|---|---|
| `POST` | `/api/echoes` | 201 + Echo DTO |
| `GET` | `/api/echoes` | paginated list |
| `GET` | `/api/echoes/:id` | 404 if not owned |
| `PATCH` | `/api/echoes/:id` | partial update |
| `DELETE` | `/api/echoes/:id` | soft delete → 204 |

- [ ] All routes are wrapped in `apiHandler` and `requireUser`.
- [ ] Route params are validated as UUIDs. A malformed ID returns 404, not 500.

## 5. Design system — first components (`src/components/ui`)

> Build with the `echo-design-system` skill. Its `references/components.md` has the spec and the full set of states for each primitive.

Build only what this phase needs. Make every component accessible from the start.

- [ ] `Button` (variants: primary, secondary, ghost, danger; plus a loading state)
- [ ] `Input`, `Textarea` (auto-grow), `Label`, `FieldError` (linked to its field with `aria-describedby`). Resting outline is `border-border-input` (3.7:1); disabled buttons use `on-primary-disabled` text.
- [ ] `Dialog`: focus trap, Esc to close, returns focus when closed; a bottom sheet below 744px. Native `<dialog>` with `showModal()` or Radix Dialog.
- [ ] `Toast`: success/error messages in an `aria-live` region.
- [ ] `Card`

## 6. Echo components (`src/components/echo`)

> Build with the `echo-design-system` skill. QuoteText, QuoteCard, EchoRow, FavoriteButton, EchoForm, QuickCapture and DeleteEchoDialog are all specified there. The approved visual reference is `docs/mockups/dashboard.html`.

- [ ] `QuoteText`: the only place quote typography lives. Quotes are set in **Newsreader** (`font-quote` with `text-quote-hero` / `text-quote-card` / `text-quote-compact`); everything else stays in Inter.
- [ ] `QuoteCard`: props as in spec §48 (`echo`, `showReflection`, `showTags`, `showSavedDate`, `compact`).
  - The quote is rendered through `QuoteText` as plain text with preserved line breaks.
  - Cards are as tall as their content (grids use `items-start`), so short quotes don't leave empty gaps.
  - The saved date is shown as a relative date ("Saved 11 months ago").
  - Tags are not shown yet; `showTags` does nothing until Phase 3.
- [ ] `FavoriteButton`: optimistic toggle. On failure, roll back and show a toast. Uses `aria-pressed`.
- [ ] `EchoForm`: used for both create and edit.
  - The quote textarea is autofocused.
  - "More details" (author, source, reflection, mood) sits in an expandable section. It starts collapsed on create and expanded on edit.
  - `Cmd/Ctrl+Enter` saves.
  - Validation errors are shown inline.
- [ ] `EchoRow`: the compact list row used in dashboard panels (serif quote clamped to 2 lines, "attribution · saved date" meta line, heart on the right, hover fill, optional author-initial monogram).
- [ ] `QuickCapture`: the **Add Echo** dialog, so saving takes seconds.
  - Quote is the only field and is autofocused; "More details" holds author, source, reflection and mood (collections join in Phase 3).
  - `Cmd/Ctrl+Enter` saves; an empty quote shows "Add the quote you want to save." inline; Esc or Cancel with text typed asks "Discard this quote?" first.
  - On save: "Saving…", then the dialog closes, the toast "Echo saved" appears, and focus returns to what opened it.
  - "Open full form" links to `/app/echoes/new` for long entries.
- [ ] `DeleteEchoDialog`: uses the confirmation copy from spec §25.

## 7. Pages

> Build with the `echo-design-system` skill. Follow its layout guidance and screen layouts (Library, Detail, New and Edit).

- [ ] `/app/echoes`: library list. Turn on the sidebar's **Library** item.
  - Paginated (18 per page, which fills 1, 2 and 3 columns evenly), with a sort selector.
  - Uses `QuoteCard`.
  - Shows a basic empty state with an "Add your first Echo" CTA.
- [ ] `/app/echoes/new`: the full `EchoForm` (reached from QuickCapture's "Open full form"). On save, redirect to `/app/echoes/:id`.
- [ ] `/app/echoes/:id`: detail page.
  - Shows the quote, author, source, reflection, mood, saved date and favorite state.
  - Actions: Favorite, Edit, Delete.
  - Revisit and Share are added later.
- [ ] `/app/echoes/:id/edit`: `EchoForm`, pre-filled.
- [ ] Wire the sidebar's **Add Echo** button, the rail's and bottom tab bar's round Add button, and the shortcut `n` (ignored while typing) to open **QuickCapture**.
- [ ] `notFound()` for missing or not-owned Echoes. Show a friendly 404 page.

Mutations go through **Server Actions** or `fetch` to the route handlers. Pick one approach and use it everywhere. Recommendation: route handlers plus a small typed client (`src/lib/api.ts`), which keeps the API-first principle honest.

## Tests in this phase

**Unit**

- [ ] Zod schema boundaries: empty quote, 10,000 vs 10,001 characters, whitespace-only quote, empty string becoming `null`.
- [ ] The `favoritedAt` set/clear logic.

**Integration** (real DB)

- [ ] Create → get → update (check that `updatedAt` changes) → soft delete → get returns 404 → list excludes it.
- [ ] Pagination: `limit` is capped at 100. Each sort order is checked.
- [ ] **Authorization** (spec §65, cases 1–3):
  - user A tries to GET, PATCH or DELETE user B's Echo → 404 each time;
  - check in the DB that B's row is unchanged.

**E2E**

- [ ] Sign in → Add Echo (quote only) → lands on the detail page.
- [ ] Add Echo → Favorite → reload → still favorited.
- [ ] Quick capture: press `n` → type a quote → `Cmd/Ctrl+Enter` → the toast "Echo saved" appears and the Echo is in the library; an empty submit shows the inline error.
- [ ] Edit an Echo → the change shows on the detail page.
- [ ] Delete an Echo → it is gone from the library.

## Exit criteria

- [ ] All Phase 2 UI passes the `echo-design-system` validation checklist (`audit_ui.py` 0 errors, 320–1440px screenshots, keyboard pass).
- [ ] Saving a quote-only Echo takes ≤3 interactions: click +, paste, Cmd+Enter.
- [ ] All CRUD works end to end on the preview deploy.
- [ ] Every authorization integration test passes.
- [ ] No user content appears in the server logs. Check this by grepping logs from a test run.
