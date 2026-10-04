# Echo design system (for Claude Design)

> A private library for the quotes that stay with you, and what they meant to you at the time.
> Tagline: **Words worth coming back to.**

This file covers the product, the content, the screens, the rules that can't change, and the
current visual tokens. The tokens are the **current baseline**. A redesign may replace them, as
long as it keeps everything under "Non-negotiables".

---

## 1. Product in one page

Echo is a personal, private web app. You save a quote (an **Echo**), optionally note why it
mattered (a **Reflection**), and Echo brings it back to you over time. It is **not** a quote feed,
a social network, or a productivity tool.

**Core terms (use them exactly in UI copy):**

| Term | Meaning |
|---|---|
| Echo | A saved quote. Plural: Echoes. |
| Reflection | The user's private note on why an Echo mattered. |
| Collection | A user-made group of Echoes. One Echo can be in many. Each has an accent color. |
| Tag | Lightweight lowercase label, e.g. `courage`, `starting-over`. |
| Favorite | "I love this." A heart toggle. |
| Revisit | "Bring this back to me on a date." Scheduled, then marked as reflected. |
| Today's Echo | One Echo from the user's own library, pinned for the day. |
| Echo me something | A button that swaps in a different Echo from the library. |
| From the past | An Echo saved about 1 month, 6 months or 1 year ago. |

**Emotional target:** calm, literary, personal, quiet confidence. Like opening a well-made notebook,
not a dashboard. The user's words should read like a book; the interface should read like a tool.

**Anti-goals (never design these):** infinite scroll, streaks, goals, badges, XP, engagement
counters, "trending", social proof, share counts, notification bells, upsells, AI chat bubbles,
stock-photo heroes, motivational-poster styling, gradient-heavy "SaaS" look.

---

## 2. Data each screen can show

**Echo**

- `quote`: required, up to 10,000 characters. Can be a single line or several paragraphs.
- `author`: optional, up to 500 characters.
- `source`: optional, up to 1,000 characters (e.g. "Middlemarch", "a podcast", "my grandmother").
- `reflection`: optional, up to 10,000 characters.
- `mood`: optional free text, up to 100 characters (e.g. "hopeful").
- `isFavorite` and `favoritedAt`.
- `savedAt` and `updatedAt`.
- `tags`: zero or more.
- `collections`: zero or more.
- `revisit`: zero or one pending, with a `scheduledFor` date.

**Collection**

- `name`: up to 100 characters.
- `description`: optional, up to 1,000 characters.
- `accent`: exactly one of **4 slots**, stored as `lagoon | bronze | plum | neutral`.
  - A redesign may rename or recolor the slots, but there must be exactly 4, and `neutral` must
    stay a non-colored option.
- `count`: the number of Echoes in it.

**User**

- Name, email and avatar, all from Google.
- Theme: `light`, `dark` or `system`.

Design for missing optional fields everywhere: an Echo with only a quote must look complete, not
broken.

---

## 3. Screens to design

### Public

1. **Landing** (`/`)
   - Hero: "Words worth coming back to." set in the quote serif, and a "Continue with Google" CTA.
   - What it does: Save in seconds, Organize, Find anything, Rediscover.
   - A "Private by design" section.
   - Footer with Privacy and Terms links.
   - No screenshots of fake users, and no testimonials.
2. **Sign in** (`/login`): one centered card with the logo, one line, and the Google button. That's
   it.
3. **Privacy / Terms**: a long-form legal reading layout.

### App (signed in)

4. **Home** (`/app`): a dashboard. Every list on it is capped, so there is no feed.
   - Greeting ("Good evening") plus one quiet line, e.g. "2 Echoes are due for a revisit."
   - **Today's Echo:** the single bold moment of the whole app.
     - The full quote, large, with attribution.
     - A context line, e.g. "From *Courage* · saved 2 years ago".
     - The old reflection in a "You wrote:" block.
     - Actions: **Echo me something** (swaps the quote in place), Open, and Favorite.
   - **Recently added:** up to 5 compact rows.
   - **Revisits due:** shown only when there are any; up to 3, each with "Mark as reflected".
   - **From the past:** one Echo.
   - **Your library:** 4 plain counts (Echoes, Favorites, Collections, Revisits due). No charts,
     no streaks.
   - **Favorites:** up to 3 cards and "View all".
   - **First run (0 Echoes):** the dashboard is replaced by one centered welcome card with
     "Add your first Echo".
5. **Library** (`/app/echoes`)
   - All Echoes as quote cards or rows.
   - Sort: Newest, Oldest, Recently updated.
   - Filter by tag. Pagination, not infinite scroll.
6. **Echo detail** (`/app/echoes/:id`)
   - Calm and immersive; the quote is the visual focus.
   - Attribution, then the reflection, tags, collections, saved date, revisit status ("Revisit on
     Apr 1, 2027", with change and cancel).
   - Actions: Favorite, Revisit, Add to collection, Edit, Delete.
   - Right after the user's **first** Echo, an inline prompt appears: "Why did this speak to you?",
     with a textarea, Save and Skip.
7. **Add / Edit Echo**
   - A full page (`/app/echoes/new`, `/edit`) **and** a **Quick Capture** dialog, opened from
     anywhere with the Add button or a keyboard shortcut.
   - Only the quote is required. Author, source, reflection, mood, tags, collections and revisit
     sit behind "More details", collapsed by default.
   - It must never feel like filling in a database form.
   - Character counters appear only near the limit.
   - Leaving with unsaved changes asks for confirmation.
8. **Favorites** (`/app/favorites`): sort by Recently favorited or Recently updated.
9. **Collections** (`/app/collections`): a grid of collection cards (accent, name, description,
   count) and "+ New collection" (a dialog with name, description and accent picker).
10. **Collection detail**
    - Name, description, count, and the Echoes.
    - Actions: Rename, Delete (the confirmation says "Echoes are kept"), Add Echo (a picker dialog
      with search), and Remove Echo.
11. **Revisits** (`/app/revisits`): "Due now" (each with "Mark as reflected") and "Upcoming".
12. **Search** (`/app/search?q=`)
    - Full-text search across quote, author, source, reflection, tags and collections.
    - Results show matching reflections.
    - Opens with the `/` key.
13. **Settings**
    - Account: name (editable); email and avatar (read-only).
    - Appearance: Light / Dark / System.
    - Privacy: a plain explanation.
    - Data: Export as JSON or CSV, and Delete account (a destructive confirmation dialog).

### Global states (design all of them)

- Empty states per screen, each in a warm, helpful voice with one action.
- Skeleton loading that matches the real layout.
- An inline error with retry, and a route-level error card.
- A 404 page.
- Toasts, e.g. "Echo saved", "Removed from Courage", with Undo where it makes sense.

---

## 4. Navigation and responsive behavior

| Width | Navigation |
|---|---|
| ≥ 1128px | Left sidebar, 256px, collapsible. See the list below. |
| 744–1127px (or collapsed) | A 96px icon rail with a visible label under each icon; Add becomes a round primary button. |
| < 744px | A 64px top header (logo and account), and a **bottom tab bar**: Home, Library, raised Add, Search, Collections. |

The desktop sidebar holds, from top to bottom:

- the logo and a collapse button;
- a full-width **Add Echo** button;
- a search field;
- the nav: Home, Library, Favorites, Collections, Revisits;
- up to 5 collections (accent dot, name, count), then "All collections";
- Settings and the account, at the bottom.

Rules for every size:

- Everything must work from **320px** wide with no horizontal scroll.
- Touch targets are at least 44×44px.
- The active nav item uses a neutral fill and weight, **not** the brand color.
- Public pages use a simple top nav instead of the sidebar.

---

## 5. Non-negotiables

1. **Two typefaces with distinct roles.**
   - Quotes, and only quotes, are set in a literary serif.
   - All interface text is set in a clean sans.
   - The contrast between the two is the brand.
2. **Light and dark themes**, built from the same semantic token names, with only the values
   swapped. Plus a System option.
3. **WCAG 2.2 AA.**
   - Body text ≥ 4.5:1, large text and UI boundaries ≥ 3:1.
   - Visible focus rings.
   - Color is never the only signal: collections always show their name next to their color.
4. **One brand accent, used sparingly:** primary CTAs, links, and the selected Favorite state. Most
   screens are about 90% neutral.
5. **Respect `prefers-reduced-motion`.** Motion is short (150–250ms) and purposeful: the "Echo me
   something" swap, dialog entry, toasts. No parallax, no bouncy springs.
6. **User text is shown as plain text.**
   - Keep line breaks.
   - No rich formatting.
   - Long words and URLs must wrap.
7. **No imagery of people, and no stock photos.** Depth comes from typography, whitespace, soft
   surfaces and at most one shadow tier.
8. **Exactly 4 collection accent slots** (one neutral). Each needs a solid "mark" color, a pale
   "tint" panel color, and both in light and dark.
9. Implementable in **Tailwind CSS v4** with CSS custom properties. Use open-source fonts only
   (Google Fonts). Icons: a single consistent outline set (Lucide-style, 1.5–2px stroke).

---

## 6. Current visual baseline (may be replaced)

### Color: light

| Token | Value | Role |
|---|---|---|
| primary | `#0e7c6b` | "Lagoon" teal. CTAs, links, favorite-on. White text on it: 5.1:1. |
| primary-active | `#0a5f52` | Pressed state. |
| primary-disabled | `#c5e8e1` | Disabled CTA fill (text `#0a5f52`). |
| error | `#c13515` | Validation and destructive text. |
| accent-bronze | `#8a5a12` | Collection mark, time-related icon chips. |
| accent-plum | `#6b2a5e` | Collection mark, memory-related icon chips. |
| ink | `#222222` | Headings, primary text. |
| body | `#3f3f3f` | Long-form text. |
| muted | `#6a6a6a` | Secondary text and meta. |
| muted-soft | `#929292` | Disabled text only. |
| hairline | `#dddddd` | Default 1px borders. |
| hairline-soft | `#ebebeb` | Light dividers. |
| border-input | `#858585` | Input outline (3:1 or better). |
| canvas | `#ffffff` | Panels; the public page background. |
| surface-soft | `#f7f7f7` | The app page background. |
| surface-strong | `#f2f2f2` | Icon-button fill. |
| tint-lagoon | `#ecf5f3` | The Today's Echo panel. |
| tint-bronze | `#f6f2ec` | The Revisits panel. |
| tint-plum | `#f3eef2` | The From the past panel. |

### Color: dark

| Token | Value |
|---|---|
| primary | `#3cbaa5` (text on it `#06201b`) |
| primary-active | `#5fcbb8` |
| error | `#ff8f7a` |
| bronze / plum | `#d9a55a` / `#d68cc4` |
| ink / body / muted | `#ecefee` / `#c8cecc` / `#9ba4a2` |
| hairline / hairline-soft | `#323837` / `#272c2b` |
| border-input | `#7d8786` |
| canvas (panels) | `#1b1f1e` |
| surface-soft (page) | `#121514` |
| surface-strong | `#262b2a` |
| tint-lagoon / bronze / plum | `#15302b` / `#2e2619` / `#2c2029` |

### Typography

- **UI:** Inter.
- **Quotes:** Newsreader (fallback Georgia).

| Token | Size / weight / line height | Use |
|---|---|---|
| display-xl | 28 / 700 / 1.43 | Page titles on public pages. |
| display-lg | 22 / 500 / 1.18, -0.44 tracking | App page titles, greeting. |
| display-sm | 20 / 600 / 1.2 | Section heads. |
| title-md | 16 / 600 / 1.25 | Card titles, nav. |
| body-md | 16 / 400 / 1.5 | Default text. |
| body-sm | 14 / 400 / 1.43 | Meta, dates. |
| caption | 14 / 500 / 1.29 | Labels. |
| caption-sm | 13 / 400 / 1.23 | Fine print. |
| badge | 11 / 600 | Chips. |
| quote-hero | Newsreader 28 / 400 / 1.36 (20 on mobile) | Today's Echo, Echo detail. |
| quote-card | Newsreader 20 / 400 / 1.45 | Quote cards. |
| quote-compact | Newsreader 17 / 400 / 1.45 | Rows, pickers, search results. |

### Shape, space, elevation

- **Radius:** 4 · 8 (buttons, inputs) · 14 (cards, dialogs) · 20 · 32 · full (pills, icon buttons).
- **Spacing:** a 4px base, with steps 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Elevation:** a single shadow tier, used for hover-floated cards, dropdowns and dialogs.
  - Value: `0 0 0 1px rgba(0,0,0,.02), 0 2px 6px rgba(0,0,0,.04), 0 4px 8px rgba(0,0,0,.1)`.
  - Everything else is flat.
- **Modal scrim:** black at 50%.
- **Content width:** the reading column is about 680px; the app content area is about 1120px.

### Components that exist today

- **Buttons:** primary, secondary (outline), tertiary (text), danger, and icon-circle; in sizes
  md (48px) and sm.
- **Form controls:** text input (56px; on focus, a 2px ink border), auto-growing textarea, select,
  TagInput (a combobox that creates a tag on Enter or comma), CollectionPicker (multi-select with
  inline create), RevisitPicker (presets "In 1 month", "In 6 months", "In 1 year", "Pick a date",
  plus a calendar).
- **Echo views:** QuoteCard, EchoRow (a compact row with an author-initial monogram on the
  collection tint), CollectionCard, Chip/Tag, AccentDot, FavoriteButton (heart).
- **Overlays:** Dialog, Dropdown, Toast.
- **Navigation:** Tabs, Pagination.
- **States:** Skeleton, EmptyState, ErrorState, Spinner, SkipLink.

---

## 7. Voice and microcopy

The voice is warm, brief and second person. It is never cute or exclamatory, and never guilt-trips
the user. The examples below show the register; they are not final strings.

- Empty library: "Your library is waiting. Save the first words that stayed with you."
- Reflection prompt: "Why did this speak to you?"
- Today's Echo context: "Something you once wanted to remember."
- Delete collection: "Delete *Courage*? Your Echoes are kept."
- Delete Echo: "Delete this Echo? This can't be undone."
- Revisit done: "Mark as reflected".
- Search empty: "Nothing matches 'starting over' yet."

---

## 8. Sample content for mockups

Use real, varied content: a mix of lengths, some fields missing, and one very long quote.

1. "It is never too late to be what you might have been." George Eliot.
   - Reflection: "I was feeling like I'd already wasted too much time."
   - Tags: change, courage. Collection: Starting Over (lagoon). Favorite.
2. "Tell me, what is it you plan to do with your one wild and precious life?" Mary Oliver,
   *The Summer Day*.
   - Collection: Things I Want to Remember (plum).
3. "Begin anywhere." John Cage.
   - Reflection: "Maybe I should finally start."
   - Saved 1 year ago (good for "From the past").
4. "You don't have to have it all figured out before you begin." No author.
   - Reflection: "I'm scared to start."
5. "The cure for anything is salt water: sweat, tears, or the sea." Isak Dinesen.
   - Collection: For Difficult Days (bronze).
6. A long passage of about 600 characters from Rilke's *Letters to a Young Poet* ("…be patient
   toward all that is unsolved in your heart and try to love the questions themselves…").
   - Source: "Letters to a Young Poet". Revisit due today.
7. "Something my grandmother used to say: you can't pour from an empty cup." Source: "Grandma".
   - Tags: rest. Mood: tender.

**Collections:**

- Starting Over (lagoon, 18)
- For Difficult Days (bronze, 11)
- Things I Want to Remember (plum, 24)
- Work (neutral, 7)
- Books That Changed Me (neutral, 15)
