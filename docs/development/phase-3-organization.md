# Phase 3 — Organization

**Goal:** A growing library stays easy to organize and find: tags, collections, a favorites page, and full-text search across quotes, authors, sources, reflections, tags and collections.

**Spec refs:** §10–13, §17–18, §26–30, §36 (`tagIds`, `collectionIds`), §40, §51, §57, §65 (case 4), §66 Phase 3

**Depends on:** Phase 2

**UI work in this phase:** use the `echo-design-system` skill (`.claude/skills/echo-design-system/`) for every section that touches the interface: §6 (TagInput, CollectionPicker, collection and favorites pages, search UI).

---

## 1. Schema

```prisma
model Collection {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  name        String   @db.VarChar(100)
  description String?  @db.Text
  accent      CollectionAccent @default(neutral)  // DESIGN.md › Tints: dot + icon chip color
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user   User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  echoes EchoCollection[]

  @@unique([userId, name])
  @@index([userId])
  @@map("collections")
}

enum CollectionAccent {
  lagoon
  bronze
  plum
  neutral
}

model EchoCollection {
  echoId       String   @map("echo_id") @db.Uuid
  collectionId String   @map("collection_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")

  echo       Echo       @relation(fields: [echoId], references: [id], onDelete: Cascade)
  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  @@id([echoId, collectionId])
  @@index([collectionId])
  @@map("echo_collections")
}

model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  name      String   @db.VarChar(50)   // stored normalized: trimmed, lowercased
  createdAt DateTime @default(now()) @map("created_at")

  user   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  echoes EchoTag[]

  @@unique([userId, name])
  @@index([userId])
  @@map("tags")
}

model EchoTag {
  echoId    String   @map("echo_id") @db.Uuid
  tagId     String   @map("tag_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  echo Echo @relation(fields: [echoId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([echoId, tagId])
  @@index([tagId])
  @@map("echo_tags")
}
```

- [ ] Add the back-relations on `User` and `Echo`, then migrate.
- [ ] Deleting a collection cascades only to the `echo_collections` join rows. The Echoes themselves are untouched (spec §27).
- [ ] Decision: tag names are lowercased, so "Courage" and "courage" are the same tag. Collection names keep the user's casing, but uniqueness is case-insensitive per user. Use a `citext` column or a functional unique index on `lower(name)` (raw SQL).

## 2. Full-text search migration (raw SQL)

Prisma can't express tsvector columns, so create an empty migration with `prisma migrate dev --create-only` and edit it:

```sql
ALTER TABLE echoes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(quote, '')),      'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')),     'B') ||
    setweight(to_tsvector('simple', coalesce(source, '')),     'C') ||
    setweight(to_tsvector('simple', coalesce(reflection, '')), 'B')
  ) STORED;

CREATE INDEX echoes_search_idx ON echoes USING GIN (search_vector);

-- Partial-word / typo-tolerant fallback, also used for tag & collection names
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX tags_name_trgm_idx        ON tags        USING GIN (name gin_trgm_ops);
CREATE INDEX collections_name_trgm_idx ON collections USING GIN (name gin_trgm_ops);
```

- [ ] Declare `search_vector` in Prisma as `Unsupported("tsvector")?` so that Prisma doesn't try to drop it.
- [ ] Language config `'simple'`: quotes can be in any language, and stemming English text by mistake hurts recall. We can revisit this later.

## 3. Validation

- [ ] Echo create/update schemas gain `tagIds` (UUID array, max 50) and `collectionIds` (UUID array, max 50).
- [ ] `tagNames` (string array, max 50, each 1–50 characters) is also accepted, so the form can create tags inline.
- [ ] Collection: `name` 1–100 characters, `description` ≤1,000 characters, `accent` one of `lagoon | bronze | plum | neutral` (new collections cycle through them so neighbours differ).
- [ ] List query gains `tag` (id), `collection` (id) and `search` (string, ≤200 characters).

## 4. Services

**Tags** (`services/tags.ts`)

- [ ] `listTags(userId)`, including a usage count for each tag.
- [ ] `upsertTagsByName(userId, names)` normalizes the names, then runs `createMany({ skipDuplicates })` followed by a find.
- [ ] `renameTag` and `deleteTag`. Deleting a tag removes only the join rows.

**Collections** (`services/collections.ts`)

- [ ] `listCollections(userId)` with an `_count` of non-deleted Echoes. Filter the count on `echo.deletedAt = null`.
- [ ] `getCollection(userId, id)` returns the collection with a paginated list of its Echoes.
- [ ] `createCollection`, `updateCollection` (rename / description) and `deleteCollection`.
- [ ] `addEchoToCollection(userId, collectionId, echoId)` and `removeEchoFromCollection(...)`. Both verify that the user owns the collection **and** the Echo.

**Echoes** (extend)

- [ ] On create and update, `assertOwnedIds(userId, tagIds, collectionIds)`:
  - counts the matching rows with `userId`;
  - if the count doesn't match the number of IDs sent, throws `403 FORBIDDEN` (spec §65 case 4).
- [ ] Create and update run in a single `$transaction`. For tags and collections, an update **replaces** the whole set: delete the join rows that aren't in the new set, and insert the missing ones.
- [ ] `listEchoes` supports the `tag`, `collection` and `favorite` filters. The `favorite` + `sort=recently_favorited` combination uses `favoritedAt`.
- [ ] The Echo DTO now includes `tags: {id, name}[]` and `collections: {id, name}[]`.

**Search** (`services/search.ts`)

- [ ] `searchEchoes(userId, q, page, limit)` via `$queryRaw` (parameterized, never string-built):
  - it matches when **any** of these hold:
    - `search_vector @@ websearch_to_tsquery('simple', q)`;
    - an `ILIKE` on quote, author or source (catches partial words);
    - the Echo has a tag or collection whose name matches `q` (trigram or `ILIKE`);
  - rank with `ts_rank`, plus a bonus for exact tag or collection matches, then sort by `saved_at desc`;
  - always filter on `user_id = $userId AND deleted_at IS NULL`.
- [ ] Response shape as in spec §30, with the full Echo DTO for each result.
- [ ] Escape `%` and `_` in `ILIKE` input.

## 5. API routes

| Method | Route |
|---|---|
| `GET`, `POST` | `/api/tags` |
| `PATCH`, `DELETE` | `/api/tags/:id` |
| `GET`, `POST` | `/api/collections` |
| `GET`, `PATCH`, `DELETE` | `/api/collections/:id` |
| `POST` | `/api/collections/:id/echoes` — body `{ echoId }` |
| `DELETE` | `/api/collections/:id/echoes/:echoId` |
| `GET` | `/api/search?q=&page=&limit=` |
| `GET` | `/api/echoes?tag=&collection=&favorite=&search=&sort=` (extended) |

## 6. UI

> Build with the `echo-design-system` skill. It specifies tag chips, TagInput (combobox), CollectionPicker, CollectionCard, SearchField and the empty states for collections and search.

**New components**

- [ ] `TagInput`: a combobox that autocompletes existing tags and creates a new one on Enter or comma. Built with ARIA combobox semantics.
- [ ] `CollectionPicker`: multi-select with inline "New collection". Each option shows its accent dot next to the name.
- [ ] `Tag` / `Badge`
- [ ] `CollectionCard`: name, description and Echo count.
- [ ] `Dropdown`, `Select`

**Changes to existing screens**

- [ ] `EchoForm` and `QuickCapture` gain Tags and Collection fields inside "More details".
- [ ] `QuoteCard`: `showTags` now renders the tags. Clicking a tag opens `/app/echoes?tag=<id>`.
- [ ] The Echo detail page shows tags and collections, and offers "Add to collection".

**Pages**

- [ ] `/app/collections`: list with "+ New Collection" (dialog), in the spec §26 layout.
- [ ] `/app/collections/:id`:
  - shows the name, description, count and Echo cards;
  - actions: Rename, Delete (with confirmation that says "Echoes are kept"), Add Echo (picker dialog with search), and Remove Echo from each card.
- [ ] `/app/favorites`: favorite Echoes, with a sort toggle between "Recently favorited" and "Recently updated".
- [ ] `/app/search?q=`:
  - the search box is debounced at 250 ms;
  - the URL is the source of truth;
  - results render as QuoteCards with `showReflection`.
- [ ] Search entry: the sidebar's search field (desktop), the rail's and bottom tab bar's Search item, and the `/` shortcut.
- [ ] Turn on the sidebar's **Favorites** and **Collections** items.
- [ ] Sidebar **Collections list**: at most 5 collections (accent dot, name truncated with "…", count), then "All collections →", and a "+" that opens New collection. The list uses `grid grid-cols-1` so long names never widen the sidebar.

## Tests in this phase

**Unit**

- [ ] Tag name normalization.
- [ ] The diff logic that replaces the tag and collection sets.
- [ ] `ILIKE` escaping.

**Integration**

- [ ] Tags: create Echo with `tagNames` → the tags exist → renaming a tag shows on the Echo → deleting a tag leaves the Echo intact.
- [ ] Collections: count excludes soft-deleted Echoes. Deleting a collection keeps its Echoes.
- [ ] Search finds by:
  - a quote word;
  - author;
  - source;
  - a word in the reflection;
  - tag name;
  - collection name;
  - a partial word.

  It never returns deleted Echoes, or Echoes owned by another user.
- [ ] **Authorization:**
  - A attaches B's tag or collection ID → 403;
  - A adds A's Echo to B's collection → 404;
  - A gets B's collection → 404;
  - a search by A never returns B's content, even when B's text matches exactly.

**Performance**

- [ ] Seed 5,000 Echoes for one user. p95 search time must stay under 500 ms (spec §44). Check with `EXPLAIN ANALYZE` that the GIN index is used.

**E2E**

- [ ] Add Echo → assign to a collection → open the collection → the Echo is there.
- [ ] Add Echo → Favorite → view Favorites.
- [ ] Search for a word from a reflection → open the result.

## Exit criteria

- [ ] All Phase 3 UI passes the `echo-design-system` validation checklist.
- [ ] Spec §67 items 5 (add tags), 6 (add to a collection) and 8 (search) work end to end.
- [ ] Search meets the <500 ms p95 target on the 5,000-Echo seed.
- [ ] Every ownership check on a join table is covered by an integration test.
