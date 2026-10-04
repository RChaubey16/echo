# Echo components

> Everything below is on Inkwell, as built in PRs 1–3. The export's component sheet and screens
> (`docs/design/claude-design/export/`) are the visual reference. When this file and the export's
> component sheet (`docs/design/claude-design/export/Echo Design System.dc.html`) differ, the
> export is the target, and `docs/design/claude-design/implementation-plan.md` lists the
> structural changes.

This file is the inventory of Echo's components. For each one it gives the DESIGN.md component it borrows its treatment from, the build spec, and the states it must ship with. Class strings are a starting point, so adapt them to the real props. All values come from `tokens.md`.

## Contents

1. [Layout frame](#layout-frame)
2. [State matrix (every component)](#state-matrix)
3. [Primitives: `src/components/ui/`](#primitives)
4. [Navigation: `src/components/shell/`](#navigation-srccomponentsshell)
5. [Echo components: `src/components/echo/`](#echo-components)
6. [Screen recipes](#screen-recipes)
7. [Empty, loading and error states](#empty-loading-and-error-states)
8. [Voice and copy](#voice-and-copy)

## Layout frame

| Thing | Spec |
|---|---|
| App shell width | `mx-auto max-w-7xl` (1280px, the DESIGN.md editorial cap) |
| Reading width (detail, forms, settings) | `max-w-3xl` (768px, about 65–75 characters at body-md) |
| Side gutter | `px-4 tablet:px-6 desktop:px-8` |
| Section rhythm | `py-12 tablet:py-16` between major sections; `gap-8` between groups inside one |
| Card grids | `grid gap-4 items-start`, with 1 column, then `tablet:grid-cols-2`, then `desktop:grid-cols-3`. Cards are as tall as their content: equal-height cards leave empty gaps under short quotes. Quotes need line length, so never use 4 columns, even though DESIGN.md's photo cards do. |
| Surfaces | App background `bg-paper`. Panels and cards are `bg-canvas` with `border-hairline`. The featured panel uses `bg-tint-moss`; time and memory panels may use `bg-tint-ochre` / `bg-tint-heather`. |
| Separation | Separate with whitespace first, surfaces second, and a hairline third. |
| Collection accents | Each collection gets an accent slot, stored as lagoon, bronze, plum or neutral and shown as moss, ochre, heather or a neutral ring. It appears as an 8px dot, an icon chip or a 4px card bar, always next to its name. |

## State matrix

A component isn't finished until it handles every state that applies to it.

| State | Interactive elements | Data views |
|---|---|---|
| Default | ✓ | ✓ |
| Hover | Only inside `@media (hover:hover)`, which Tailwind's `hover:` variant does in v4. It must be a visible change, never the only path to an action. | Cards: `hover:border-border-input` |
| Focus-visible | A 2px primary outline offset 2px (global), or the documented component focus. Never removed without a replacement. | Focusable cards |
| Active/pressed | `active:` color shift plus, for buttons, `active:scale-98` | — |
| Disabled | Tokens, `disabled:cursor-not-allowed`, and the native `disabled` attribute (not just a style) | — |
| Loading | Busy affordance inside the control, `aria-busy="true"`, width kept, double-submit prevented | Skeleton that matches the final layout |
| Empty | — | Copy and the primary next action (see below) |
| Error | Inline message next to the cause | Friendly message, retry and error ID |
| Long content | Labels truncate with `truncate` and a `title` attribute | Quotes wrap (`[overflow-wrap:anywhere]`); cards clamp; detail shows everything |
| Success feedback | A toast or an inline state change (heart fills, card appears) | — |

## Primitives

These match the component sheet (`Echo Design System.dc.html`, sections 05–11) as built in PR 2.

### Button (`buttonClasses` / `Button`)

All variants share `relative inline-flex items-center justify-center gap-2 rounded-md`, `transition-[background-color,border-color,color,transform] duration-fast ease-standard` and `disabled:cursor-not-allowed`. Labels are `text-button-md` (15/600).

| Variant | Classes | Use |
|---|---|---|
| `primary` | `h-12 px-5 bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active active:scale-98 disabled:bg-primary-disabled disabled:text-muted-soft` | One per view: Save Echo, Echo me something, Create collection |
| `secondary` | `h-12 px-5 border border-border-input text-ink hover:border-ink hover:bg-surface-strong active:bg-hairline disabled:border-hairline disabled:text-muted-soft` (no fill, so it sits on any surface) | Cancel, Open, Edit |
| `tertiary` | `h-11 px-3 text-ink hover:bg-surface-strong active:bg-hairline disabled:text-muted-soft` | Skip, Show more, quiet inline actions |
| `danger` | `h-12 px-5 bg-error text-on-error hover:bg-error-hover focus-visible:outline-error disabled:bg-error-tint disabled:text-muted-soft` | Confirm buttons in delete dialogs only |
| `icon` | `h-11 w-11 rounded-full bg-surface-strong text-ink hover:bg-hairline active:bg-border-input active:text-canvas` | Icon-only actions; `aria-label` is required |
| `pill` | An alias of `primary`, kept for existing callers. Inkwell has no pill buttons. | — |

- **Sizes:** `md` (48px, the default) and `sm` (`h-10`, `text-button-sm`), with a `::before` that extends the hit area to 44px. Use `sm` only in dense toolbars and inline banners.
- **Loading:** show a 16px spinner before the label, change the label to its progressive form ("Saving…"), and set `disabled`. Keep the button the same width.
- **Focus:** the global 2px `primary` ring, offset 2px. Danger buttons use an `error` ring.
- Links that look like buttons are `<a>`/`<Link>` with `buttonClasses`. Actions are `<button type="button">`.

### Input / Textarea / Select (`field.tsx`, `select.tsx`)

- `CONTROL` (shared): `rounded-md border bg-canvas px-4 text-body-md text-ink placeholder:text-muted hover:border-ink`.
  - The input is `h-13` (52px).
  - A stacked select is `h-13`; an inline (toolbar) select is `h-11`.
  - The textarea is `min-h-28 py-3.5` and grows with its content.
- **Resting border:** `border-border-input` (3.7:1 on canvas, meeting SC 1.4.11).
- **Focus:** the border becomes 2px ink, and the global primary ring sits outside it:
  - `focus:border-ink focus:ring-1 focus:ring-ink focus:ring-inset`;
  - the inset ring adds the second pixel without a layout shift.
- **Label:** a visible `<label>` above the field in `text-caption text-ink`. A placeholder is an example, not a label.
- **Error:**
  - the field gets `border-error ring-1 ring-error ring-inset` (2px error) and `aria-invalid="true"`;
  - below it goes `FieldError` (`text-caption-sm text-error` with a 16px alert icon), linked through `aria-describedby`;
  - validate on blur and on submit.
- **Disabled / read-only:** `border-hairline bg-surface-soft text-muted`.
- **Quote textarea:** uses `quoteClasses("card")`, so typed text looks like a saved Echo.
- **Counter:** shown only within 10% of the limit, in `text-caption-sm text-muted`, turning to `text-error` past it.

### Card (base for QuoteCard and CollectionCard)

`relative rounded-lg border border-hairline bg-canvas p-6`.

- **Interactive cards** add `transition-colors duration-fast ease-standard hover:border-border-input`. Cards never lift and never gain a shadow.
- **When the content is the click target,** use the stretched-link pattern:
  - the main `<Link>` gets `after:absolute after:inset-0`;
  - nested buttons get `relative z-10`.

### Tag chip (`chipClasses`, `ChipLink`)

- **Resting:** `relative inline-flex h-9 items-center rounded-sm px-3 text-caption bg-surface-strong text-body hover:bg-hairline hover:text-ink`. That is a 36px visual chip, with a `::before` that extends the hit area to 44px.
- **Selected or active filter:** `bg-ink text-canvas`, plus a check icon where the chip is a toggle. Ink fill is Echo's selection language. Never use the primary accent here.
- **Removable chip** (TagInput): a trailing × button labelled `Remove tag courage`.

### Badge

`rounded-sm bg-surface-strong px-2 py-0.5 text-badge text-body`, for counts and small states. `text-badge` (12px) is the floor.

### Dialog / Sheet

- **Backdrop:** `bg-scrim`, fading in.
- **Panel:** `rounded-lg bg-canvas p-6 shadow-float`, `max-w-md` (or `max-w-lg`), entering with `animate-rise-in`.
- **Below 744px,** it becomes a bottom sheet: `rounded-t-lg`, full width, with a drag handle and bottom safe-area padding.
- Native `<dialog>` with `showModal()`. Focus is trapped and returns to the trigger. Esc asks the owner to close it.
- **Destructive dialogs:** Cancel (secondary) gets initial focus, and the danger button sits on the right.

### Dropdown / Menu (`dropdown.tsx`, `account-menu.tsx`)

- **Menu:** `min-w-56 rounded-lg bg-canvas p-1.5 shadow-float`.
- **Items:** `h-11 rounded-md px-3 gap-2.5 text-body-md hover:bg-surface-strong focus-visible:bg-surface-strong`, with 18px muted icons.
- **Destructive items** read in `text-error` and sit after a `hairline-soft` separator.
- Full keyboard support: arrows, Home/End, typeahead and Esc.

### Toast

- **Style:** inverted, `min-h-13 rounded-md bg-ink text-canvas pl-4 pr-2 text-body-md shadow-float`.
- **Placement:** bottom center, raised above the mobile tab bar and its Add button (`bottom-28`, or `tablet:bottom-6`).
- **Action:** one optional action ("Undo", "View") as a 44px underlined button.
- **Behavior:** toasts live in an `aria-live="polite"` region, auto-dismiss after 4s and pause on hover or focus. They confirm actions; they never report form errors.

### Tabs

- **Tab:** `h-12 px-3.5 rounded-t-md text-nav-link`.
- **Active:** a 2px ink underline (`border-b-2 border-ink text-ink`).
- **Inactive:** `font-medium text-body`, with a `surface-strong` fill on hover.
- Use `role="tab"` and `aria-selected` for in-page tabs, and links with `aria-current="page"` for navigation.

### Pagination

- Previous / numbered pages / Next. `pageList()` shows the first and last page plus the current page and its neighbours, with "…" for gaps.
- **Numbers:** 44px squares (`rounded-md`). The current page is `bg-ink text-canvas font-semibold` with `aria-current="page"`, and the others get a `surface-strong` hover.
- **Previous / Next:** text with chevrons. When unavailable, they show `text-muted-soft` and are not links.

### Skeleton

`rounded-sm bg-surface-strong animate-skeleton motion-reduce:animate-none`. Shape it like the content it replaces, and keep the container size so nothing shifts.

### EmptyState / ErrorState / SectionError

- **EmptyState:** a left-aligned card, `max-w-xl rounded-lg border border-hairline bg-canvas p-6 tablet:p-8`.
  - It holds an optional icon on a 44px `tint-moss` disc (`text-mark-moss`), a `text-display-sm` title, one line of `text-body-md text-body`, and one action.
- **ErrorState:** the same card, with a primary **Try again** and an optional error ID with Copy.
- **SectionError** (a section that failed inside a working page): an `error-tint` banner with an alert icon, the message, and a small secondary **Try again**.

## Navigation (`src/components/shell/`)

- **Wordmark:** "Echo" set in `text-display-sm tracking-tight`, the interface sans. The logo mark stays on public pages and the favicon.
- **Sidebar (≥1128px, `w-64`):**
  - **Add Echo:** a full-width primary button.
  - **Search:** a 44px `rounded-md` field with a `/` hint.
  - **Nav items:** `h-11 px-3 text-body-md text-body`, with a `hover:bg-surface-soft`.
  - **Collections:** a `text-label uppercase` heading with a 44px "+" button. Rows are `h-10 text-body-sm`, followed by "All collections" in `text-primary`.
  - **Footer:** Settings, then the account button. It shows a heather initial avatar, the name (600) and the email (muted, truncated).
- **Rail (744–1127px, or collapsed):**
  - `w-24`, with 80px-wide items that stack an icon over a `text-badge` label.
  - Add is a 56px round primary button.
- **Mobile (<744px):**
  - **Header:** 64px, with the wordmark and a 44px account button holding the avatar.
  - **BottomTabBar:** `h-18` (72px). The raised Add is a 56px primary circle with `shadow-float`, sitting `-mt-6`.
  - **Active tab:** a neutral `surface-strong` pill behind the icon, and a weight-600 label.
  - The main content pads `pb-28` so nothing hides under the bar.
- **Active state everywhere:** `bg-surface-strong font-semibold text-ink`. Never the accent.

## Echo components

### QuoteText: the one place quote typography is defined

Quotes are set in EB Garamond (`font-quote`). Keep the sizes in this single component, so the classes aren't repeated across screens.

| `size` | Mobile → tablet → desktop | Where |
|---|---|---|
| `today` | 26 → 38 → 44 | Today's Echo only |
| `hero` | 26 → 38 | Echo detail |
| `memory` | 26 | From the past |
| `card` | 21 → 23 | QuoteCard, search results, due Revisits |
| `compact` | 19 | EchoRow, upcoming Revisits, pickers |

- All sizes add `user-text text-pretty text-ink`.
- Render a `<blockquote>`, with the attribution in a `<figcaption>` inside a `<figure>`.
- `Attribution` renders the author in weight 600, then " · " and the source. `attribution()` returns the plain "Author, Source" string, for meta lines and titles.

### QuoteCard

Built on an interactive Card (`flex flex-col gap-3.5`, border darkens on hover), in this order:

1. **QuoteText `card`**, clamped with `line-clamp-6` (`line-clamp-3` when `compact`).
2. **Attribution** in `text-body-sm`. Leave it out when both fields are missing; never write "Unknown".
3. **Reflection** (`showReflection`): `border-l-2 border-hairline pl-3 text-body-sm text-body line-clamp-3`, prefixed with the visually hidden text "Your reflection:".
4. **Tags** (`showTags`): small chips (`ChipLink size="sm"`), at most 4, then a "+N" chip.
5. **Footer row:** `border-t border-hairline-soft pt-3 text-caption-sm text-muted`.
   - Left: the first collection (accent dot and name), or else the saved date.
   - Right: an optional action (e.g. "Remove" on a collection page), then the heart.

Other behavior:
- The quote's stretched link opens `/app/echoes/:id`. The heart, chips and action sit above it (`relative z-10`).
- `highlightQuery` marks the query's words in the quote and reflection (see Search).
- Lists of QuoteCards use the masonry: `MASONRY` (`columns-1 tablet:columns-2 desktop:columns-3 gap-x-4`) on the `<ul>`, and `MASONRY_ITEM` (`mb-4 break-inside-avoid`) on each `<li>`. The visual order runs down each column; the DOM order stays sorted.

### FavoriteButton

- A 20px heart.
- **Variants:**
  - `icon`: a 44px circle with a `surface-strong` hover (cards, rows, the detail toolbar).
  - `filled`: a 48px `surface-strong` disc (Today's Echo).
  - `labelled`: heart plus text.
- **States:** saved is filled `text-primary`; unsaved is a `text-muted` outline turning `hover:text-ink`.
- `aria-pressed`, with the label "Add to favorites" or "Remove from favorites".
- **Optimistic:** it flips at once and pops (`animate-heart-pop`, only when it becomes saved). On failure it reverts and shows a toast.

### TodaysEcho: the one bold moment

- **Panel:** `rounded-lg border border-hairline bg-canvas`, with padding `p-6`, `tablet:p-10` and `desktop:p-14`.
- **Desktop layout:** a grid of `minmax(0,1fr) 17.5rem`.
  - Left column: the heading ("Today's Echo" in 600 ink, plus "Something you once wanted to remember." in muted), the quote figure, then the actions.
  - Right column: "You wrote" as a margin note (`bg-surface-soft rounded-md p-5`, with a `text-label uppercase` kicker).
  - Smaller screens stack it all, with the note under the quote.
- **Quote figure:** QuoteText `today`, the attribution, then the context line ("From Courage · saved 2 years ago", with the accent dot, or "From your library · …").
- **Actions:**
  - **Echo me something** is the screen's only filled button.
  - **Open** is secondary.
  - The heart is the `filled` variant.
  - On phones, Echo me something is full width, with Open and the heart on the next row.
- **The swap:**
  - Only the quote block and the note re-key and rise in; the buttons stay mounted, so focus stays put.
  - The grid keeps its height during the swap.
  - A polite `role="status"` region announces the new Echo.

### CollectionCard

- **Card:** an interactive Card with `border-t-4` in the slot's mark (`border-t-mark-*`, or `border-t-hairline` for neutral), at `min-h-45`.
- **Contents:** the name beside a 10px AccentDot, the description (`text-body-md text-body`, 3 lines), and the count at the bottom (`mt-auto text-body-sm text-muted`).
- The stretched link opens the collection.

### Collection accents in code

`accent-dot.tsx` holds the slot maps:

- `AccentDot`, with `size` "sm" (8px) or "md" (10px). The neutral slot is a ring.
- `ACCENT_LABEL` (Moss, Ochre, Heather, Neutral).
- `ACCENT_TINT` (the `bg-tint-*` panel class).

`collection-card.tsx` has the top-bar map, and `echo-row.tsx` the monogram map.

### TagInput, CollectionPicker, RevisitPicker

- **TagInput:** an ARIA combobox inside a 52px `CONTROL`-style box (`min-h-13 px-2 py-1.5`), with the same 2px ink focus border plus the primary ring.
  - Chips sit inline before the input.
  - Enter or comma creates a tag. Backspace on an empty input arms the last chip, then removes it.
  - Suggestions use the menu styling (`p-1.5`, 44px rounded rows).
- **CollectionPicker:** a 52px trigger that opens a popover checklist.
  - Rows are 44px with `surface-strong` hover and a primary-accent checkbox.
  - "New collection" is the last row, in `text-primary`.
- **RevisitPicker:**
  - **Presets:** bordered 44px boxes ("In 1 month", "In 6 months", "In 1 year", "Pick a date"). "Pick a date" open is `border-2 border-ink bg-surface-strong` with a check.
  - **Calendar:** 40px `rounded-md` cells. The selected day is `bg-primary text-on-primary`; past days are disabled.
  - **Once chosen:** "Revisit on **Apr 1, 2027**" with an ochre calendar icon, plus tertiary **Change** and **Cancel revisit**.

### EchoRow (dense lists inside panels)

- **Row:** `relative flex gap-3.5 rounded-md p-3`, inside a `rounded-lg border bg-canvas p-1.5` list, with `hover:bg-surface-strong` (or `hover:bg-canvas/60` on tints).
- **Monogram:** an optional 40px `rounded-md` square, decorative, holding:
  - the author's initial in 15/600, on the first collection's tint;
  - or, without an author, a quote mark on `tint-neutral`.
- **Contents:** the quote in QuoteText `compact` (2 lines), then a `text-caption-sm text-muted` meta line ("Author, Source · Saved 3 days ago"), then the heart.

### QuickCapture dialog

- Native `<dialog>`, `max-w-lg`; a bottom sheet below 744px. `n` opens it from anywhere.
- **Quote:** autofocused and typed in QuoteText `card`. "Only the words are needed." sits under it.
- **"More details" / "Fewer details":** a chevron disclosure holding:
  - Author | Source in two columns;
  - Reflection;
  - Mood | Tags (1fr / 2fr);
  - Collections.
- **Footer:** a top hairline, then tertiary **Cancel** and primary **Save Echo**. Save is disabled until the quote has words.
- `Cmd/Ctrl+Enter` saves; closing with a draft asks "Discard this quote?" inline.

### Search results

- **SearchField:** a visible label ("Search your library"), and a 52/60px field with a leading search icon (a spinner while pending) and a 44px clear button. `/` focuses it.
- **Results:** one `rounded-lg border bg-canvas` list with hairline dividers. Each row shows:
  - the quote (QuoteText `card`, 4 lines);
  - the attribution;
  - a matching reflection under a "You wrote" kicker;
  - "In {collection}";
  - the heart.
- **Highlighting:** `highlight(text, query)` (`src/lib/highlight.tsx`) wraps each query word in a `<mark>` (`bg-tint-ochre text-ink` plus an ochre underline, so it isn't colour alone). It never builds HTML.

### Revisits

- **Due now:** cards with a 4px ochre top bar, holding:
  - "Due {date}" with an ochre calendar icon;
  - the quote (QuoteText `card`) and attribution;
  - a footer with **Mark as reflected** (secondary, 48px) and a tertiary **Open**.
- **Upcoming:** one bordered list. Each row shows the date (600) with "in 3 weeks" under it, the quote on one line, and **Change** / **Cancel** (`UpcomingRevisitActions`).
  - Change opens a dialog with the RevisitPicker.
  - Cancel removes the Revisit at once.

## Screen recipes

| Screen | Structure |
|---|---|
| `/app` Home | The greeting ("Good evening, Ana" in `text-display-lg`, plus one quiet line). Below it: TodaysEcho at full width; then Recently added (≤5 EchoRows) beside the side column (Revisits due on `tint-ochre`, From the past on `tint-heather`), in a `7fr / 5fr` grid; then Your library (four counts in one bordered row); then Favorites (≤3 QuoteCards). Finite, with no "load more". The first run replaces it all with a centered welcome card. |
| `/app/echoes` Library | The title and count, the sort Select, a tag strip ("All" plus the most-used tags with counts; three on phones, then "More tags"), the QuoteCard masonry, and numbered pagination. |
| `/app/echoes/:id` Detail | A toolbar row (back to Library; heart, Revisit, Add to collection, Edit, Delete; icons only on phones). Then a 760px reading column: QuoteText `hero`, the attribution after a short rule, the reflection card, and a `dl` of Tags, Collections, Mood, Saved and Revisit. |
| `/app/echoes/new`, `/edit` | `max-w-3xl` EchoForm. |
| `/app/collections` | The title, a "New collection" secondary button, and the CollectionCard grid. The dialog has Name, Description and a Color radio group. |
| `/app/collections/:id` | A back link, then a header panel on the collection's tint (name, description, count, Add Echoes and the More menu), then the QuoteCard masonry. |
| `/app/revisits` | Due now cards, then the Upcoming list. |
| `/app/search` | The SearchField, the result count (`role="status"`), and the results list. With no results: a neutral search disc, "Nothing matches "{q}" yet.", and "Add an Echo". |
| `/app/settings` | On desktop, a sticky section list beside a 680px column of section cards (Account, Appearance, Shortcuts, Privacy, Notifications, Data). |
| `/`, `/login` | Landing: the serif tagline (`quote-display`), Continue with Google, an example Today's Echo, four feature columns under ink rules, and a Private by design panel on `tint-moss`. Sign in: one centered card with the wordmark and Continue with Google. |

## Empty, loading and error states

**Page-level states fill the screen.** The app frame is `flex min-h-dvh flex-col`, and `<main>` is `flex flex-1 flex-col`, so a state view can take all the remaining height:
- **Loading:** `flex flex-1 flex-col`, with the same grid as the loaded page. The last panel in each column stretches (`flex-1 min-h-0 overflow-hidden`). Keep the skeleton's natural height under one screen (e.g. 3 placeholder rows, not 5), so it fills the screen without scrolling.
- **First run and route-level Error:** `flex flex-1 items-center justify-center py-12`, so the card sits in the exact center. The page greeting is hidden in these states (it would describe data that isn't there), so the state's title becomes the `h1`.
- Section-level errors and empty sections stay inline in their panel. Only whole-page states fill the screen.

**Empty-state layout** (`EmptyState`): a left-aligned card, `max-w-xl p-6 tablet:p-8`, containing:
- an optional icon on a 44px `tint-moss` disc;
- a title in `text-display-sm text-ink`;
- a line of body text in `text-body-md text-body`;
- one call to action.

Copy, taken verbatim from the spec where it exists:

| Where | Title | Body | Call to action |
|---|---|---|---|
| Library | Your library is empty. | Save the words that make you stop and think. | + Add your first Echo (primary) |
| Favorites | Nothing here yet. | Favorite the Echoes you never want to lose. | — |
| Collections | No collections yet. | Collections help you gather Echoes around ideas, moments, and themes. | + Create a collection (secondary) |
| Collection detail | This collection is empty. | Add Echoes from your library to start gathering them here. | Add Echoes (secondary) |
| Library, filters match nothing | No Echoes match these filters. | Try removing a filter, or clear them all to see your whole library. | Clear filters (secondary) |
| Search, no results | Nothing matches "{q}" yet. | Search looks through quotes, authors, sources, your reflections, tags and collections. Try fewer words, or save it if it's something you want to keep. | Add an Echo (secondary) |
| Revisits | Nothing scheduled. | Pick an Echo and choose a day to see it again. | — |
| First run (`/app`, 0 Echoes) | Welcome to Echo, {first name} | Your library is waiting. Save the first words that stayed with you: a line from a book, something a friend said, a lyric you can't shake. | Add your first Echo (primary), with "Only the words are needed. Everything else can wait." |

**Loading skeletons** match the content's shape:
- **QuoteCard skeleton:** three bars at 100%, 85% and 60% width (`h-4`, `gap-2`), then a 30%-width meta bar `mt-4`, all inside the same Card padding.
- **TodaysEcho skeleton:** two `h-7` bars (90% and 70%) and one meta bar.
- **Lists:** render the number of skeleton cards you expect (6 for the library), not 1.

Use a spinner only inside buttons.

**Errors:**
- **Route level:** in `error.tsx`, show the title "Something went wrong.", the body "We couldn't load this page. Your Echoes are safe.", a **Try again** secondary button, and the line "Error ID: {id}" in `text-caption-sm text-muted` with a copy button.
- **Section level:** show an inline message in the section's place with a retry action, so the rest of the page keeps working.
- **404:** "This Echo doesn't exist or isn't yours." with a link back to the library. The same message covers both cases, so it reveals nothing about other users.

## Voice and copy

- Use plain, warm, short sentences in the second person. Don't use exclamation marks, emoji or jokes. The user's words provide the emotion; the UI stays calm.
- Buttons say exactly what happens: "Save Echo", "Delete Echo", "Add to collection". Avoid vague labels like "Submit", "OK" or "Confirm".
- Confirmations use past tense: "Echo saved", "Added to Favorites", "Collection deleted. Its Echoes are still in your library."
- Errors say what happened and what to do next: "Couldn't save your Echo. Check your connection and try again." Avoid "Oops", "Error 500" and blame.
- Dates are relative for recent ones ("Saved 3 days ago") and absolute for older ones ("Saved March 2025"). Always put the full date in the `<time>` element's `title`.
- Use "Echo" and "Echoes" (capitalized) for saved items. "Quote" is the text inside an Echo.
