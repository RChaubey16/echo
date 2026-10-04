# Phase 4 — Discovery

**Goal:** Echo starts bringing words back to the user: a calm home page, a deterministic Today's Echo, "Echo Me Something", scheduled Revisits, and a very short first-run experience.

**Spec refs:** §14, §20, §31–33, §60, §66 Phase 4, §67 items 12–14, §70

**Depends on:** Phase 3

**UI work in this phase:** use the `echo-design-system` skill (`.claude/skills/echo-design-system/`) for every section that touches the interface: the §4 Revisits UI (RevisitPicker, `/app/revisits`), §5 (home page) and §6 (onboarding).

**Status: implemented (2026-10-04)** in #5; not yet verified on a preview deploy.

**Deviations from this plan** (all in place in the code):
- **`User.timezone` is in place**, as is `User.onboardedAt`. `TimeZoneSync` sends the browser's zone after sign-in; anything `Intl` doesn't recognize falls back to UTC.
- **Home data loading:** every panel's query starts at the same time and each panel waits on its own promise inside its own `Suspense` boundary, rather than one `Promise.all`. Only the library counts are awaited up front, because they decide between the first-run screen and the dashboard.
- **Echo Me Something relaxes its rules in steps:** first it drops the 24 h rule, then the `?exclude=` IDs (`pickFromTiers`). `?exclude=` keeps at most 5 valid UUIDs and ignores anything else.
- **There's no `GET /api/revisits/:id`,** so "A reads B's Revisit" is tested as "B's Revisits never show up in A's lists".
- **Revisits of soft-deleted Echoes are hidden** from lists and counts, and they 404 on PATCH and DELETE.
- **The Echo form schedules Revisits too** (`revisitAt`), using the same rule of one pending Revisit per Echo.

---

## 1. Schema

```prisma
model Revisit {
  id           String    @id @default(uuid()) @db.Uuid
  echoId       String    @map("echo_id") @db.Uuid
  userId       String    @map("user_id") @db.Uuid
  scheduledFor DateTime  @map("scheduled_for")
  completedAt  DateTime? @map("completed_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  echo Echo @relation(fields: [echoId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, completedAt, scheduledFor])
  @@map("revisits")
}
```

- [x] `DailyEcho { userId, date (DATE), echoId, @@id([userId, date]) }`, with cascade on both foreign keys. It pins Today's Echo for the day (see §2).
- [x] Optionally add `User.timezone String?` (IANA name), captured from the browser when the user first signs in. It is used to decide which date "today" is.
- [x] `Echo.lastSurfacedAt` already exists from Phase 2.

## 2. Today's Echo — `GET /api/echoes/today`

Deterministic per user per local date (spec §32):

```ts
const day = localDate(user.timezone ?? "UTC");         // "2026-10-01"
const n = await prisma.echo.count({ where: { userId, deletedAt: null } });
if (n === 0) return null;
const idx = fnv1a32(`${userId}:${day}`) % n;           // pure, unit-tested
const echo = await prisma.echo.findFirst({
  where: { userId, deletedAt: null },
  orderBy: { savedAt: "asc" }, skip: idx,              // stable order
});
```

- [x] `src/lib/daily.ts` holds the pure helpers `fnv1a32` and `localDate`.
- [x] Known trade-off: adding or deleting an Echo during the day can change the pick. To avoid that, the result is **pinned**: once the day's Echo is first computed, store it in a `DailyEcho(userId, date, echoId)` row and return it for the rest of the day. This costs one small table, and is recommended.
- [x] Prefer older Echoes: if the user has more than 10 Echoes, pick from the ones saved more than 7 days ago. The point is rediscovery, not seeing what was just saved.
- [x] Response: the Echo DTO plus `savedAgo` metadata, used for the line "Saved 11 months ago".

## 3. Echo Me Something — `GET /api/echoes/random`

- [x] Choose a random Echo from the non-deleted Echoes, excluding:
  - Echoes with `lastSurfacedAt` in the last 24 h, when enough others exist;
  - the IDs passed in `?exclude=` (the client sends the last 5 shown).
- [x] Implementation:
  - `count` the candidates, then `findFirst({ skip: randomInt(count) })`;
  - avoid `ORDER BY random()` on large tables.
- [x] Set `lastSurfacedAt = now()` on the Echo that is returned.
- [x] If every Echo is excluded, drop the exclusions and pick again. With 0 Echoes, return `null`.

## 4. Revisits

**Service** (`services/revisits.ts`)

- [x] `createRevisit(userId, { echoId, scheduledFor })`:
  - the Echo must be owned by the user and not deleted;
  - `scheduledFor` must be in the future and no more than 10 years away;
  - at most one pending Revisit per Echo: a new one replaces the existing pending one.
- [x] `listRevisits(userId, { status: "due" | "upcoming" | "completed" })`
- [x] `completeRevisit(userId, id)` and `deleteRevisit(userId, id)`.

**API**

| Method | Route |
|---|---|
| `POST` | `/api/revisits` — body per spec §33 |
| `GET` | `/api/revisits?status=` |
| `PATCH` | `/api/revisits/:id` — `{ completed: true }` or `{ scheduledFor }` |
| `DELETE` | `/api/revisits/:id` |

**UI** (build with the `echo-design-system` skill; RevisitPicker follows its date-picker spec)

- [x] `RevisitPicker` on the Add/Edit form and the detail page, with presets:
  - "In 1 month";
  - "In 6 months";
  - "In 1 year";
  - "Pick a date".
- [x] The Echo detail page shows "Revisit on Apr 1, 2027", with options to change or cancel it.
- [x] `/app/revisits` (turn on the sidebar's **Revisits** item):
  - "Due now" (with a "Mark as reflected" button);
  - "Upcoming".
- [x] No notifications in this phase (spec §33). Due Revisits are surfaced on the home page.

## 5. Home page — `/app`

> Build with the `echo-design-system` skill. TodaysEcho is the screen's single bold moment, and the "Echo Me Something" swap uses the skill's motion recipe, with a reduced-motion fallback and an `aria-live` announcement.

The home page is the **dashboard** from the approved mockup `docs/mockups/dashboard.html`. There is **no infinite feed**: every list is capped.

- **Greeting header:** "Good morning / afternoon / evening" (`text-display-lg`) with one quiet line, e.g. "2 Echoes are due for a revisit." linking to Revisits (or "Here's something from your library.").
- **Main column (two thirds at desktop):**
  1. **Today's Echo** in a `bg-tint-lagoon` panel: the full quote in Newsreader (`quote-hero`), attribution, a context line ("● From Courage · saved 2 years ago"), and the old reflection in a white "You wrote:" block. Actions: **Echo me something** (swaps in place with the skill's motion recipe and an `aria-live` announcement), Open Echo, and the heart. On mobile, Echo me something is full width.
  2. **Recently added:** up to 5 `EchoRow`s with author-initial monograms on their collection tint, in a white panel, with "View library".
- **Side column (one third):**
  3. **Revisits due** (`bg-tint-bronze`, calendar icon): shown only if there are any; at most 3 rows with "Mark as reflected"; links to `/app/revisits`.
  4. **From the past** (`bg-tint-plum`, clock icon): one Echo saved about a month, 6 months or a year ago (±7 days), if one exists. Pure query, no randomness.
  5. **Your library:** four plain counts (Echoes, Favorites, Collections, Revisits due) with tinted icon chips, each linking to its view. No goals or streaks.
- **Full width below:** **Favorites**, up to 3 QuoteCards at content height, with "View all".
- Collections are reached from the sidebar's Collections list, so the home page has no Collections section.
- **Loading:** the same layout as gray skeletons that fill the screen height (keep the skeleton's natural height under one screen). **Error:** the centered route-level error card.

- [x] Data is fetched in parallel in a Server Component (`Promise.all` over the services). Each section has its own `Suspense` boundary.

## 6. Onboarding (first run)

> Build with the `echo-design-system` skill, using its first-run empty state and copy.

- [x] If the user has 0 Echoes, `/app` shows the welcome card from spec §60 (built in Phase 1), **centered** in the screen, instead of the dashboard. The greeting header is hidden, and the card's title is the page's `h1`. Its single CTA, "Add your first Echo", opens QuickCapture.
- [x] After the **first** Echo is saved, the detail page shows an inline prompt: "Why did this speak to you?"
  - The prompt has a reflection textarea plus Save and Skip.
  - It is shown only once; track this with `User.onboardedAt DateTime?`.
- [x] No questionnaires, and no multi-step tour.

## Tests in this phase

**Unit**

- [x] `fnv1a32` and the daily index are stable for a fixed `userId` and date, and differ across dates.
- [x] `localDate` handles timezone boundaries, e.g. 23:30 UTC versus `Asia/Kolkata`.
- [x] Random selection with exclusions, including the fallback when every Echo is excluded.
- [x] Revisit date validation.

**Integration**

- [x] `/today` returns the same Echo on repeated calls within a day (pinned), and a different seeded result on another date.
- [x] `/today` and `/random` never return deleted Echoes, or Echoes owned by another user.
- [x] Revisits: create → list as upcoming → move the clock forward (a fake `now` is injected into the service) → listed as due → complete.
- [x] **Authorization:** A creates a Revisit on B's Echo → 404. A reads, edits or deletes B's Revisit → 404.

**E2E**

- [x] New user: welcome screen → add first Echo → reflection prompt → home shows Today's Echo.
- [x] Home: click "Echo Me Something" → the card changes.
- [x] Add Echo → schedule a Revisit → it appears under Upcoming.

## Exit criteria

- [x] All Phase 4 UI passes the `echo-design-system` validation checklist, including the motion check.
- [x] Spec §67 items 12 (return home), 13 (personal Today's Echo) and 14 (random) all work.
- [x] Today's Echo doesn't change when the page is reloaded.
- [ ] The rediscovery flow from spec §70 can be shown end to end on the preview. (Not yet checked on a preview deploy.)
