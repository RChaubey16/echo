# Echo components

> **Inkwell migration in progress.** Tokens (PR 1), primitives and the shell (PR 2) are on
> Inkwell. Echo components and screens move in PR 3; until then their entries below describe the
> code as built. When this file and the export's
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

Quotes are set in EB Garamond (`font-quote`) with the DESIGN.md `quote-*` styles. Keep them in this single component, so the classes aren't repeated across screens and the quote typeface can change in one place.

| `size` | Classes | Where |
|---|---|---|
| `hero` | `font-quote text-quote-card tablet:text-quote-hero` | Today's Echo, Echo detail |
| `card` | `font-quote text-quote-card` | QuoteCard |
| `compact` | `font-quote text-quote-compact` | EchoRow, compact cards, pickers, search rows |

All sizes use `whitespace-pre-wrap [overflow-wrap:anywhere] text-ink text-pretty`. Render a `<blockquote>`, with attribution in a `<figcaption>` inside a `<figure>`.

### QuoteCard / EchoCard (DESIGN.md `property-card` treatment, without the photo)

Built on Card, in this order:

1. **Top-right:** a FavoriteButton (`absolute right-4 top-4 z-10`).
2. **QuoteText `card`,** clamped with `line-clamp-6` (`line-clamp-3` when `compact`). Leave room on the right (`pr-8`) so the text clears the heart.
3. **Attribution:** `— Author, Source` in `text-body-sm text-muted`, `mt-3`. If both are missing, leave the line out entirely. Never write "Unknown".
4. **Reflection** (`showReflection`): `mt-4 border-t border-hairline-soft pt-4 text-body-sm text-body line-clamp-3`, prefixed with the visually hidden text "Your reflection:".
5. **Tags** (`showTags`): a row of chips at `mt-4 flex flex-wrap gap-1`, showing at most 4 with a "+N" overflow chip.
6. **Footer:** "Saved 11 months ago" in `text-body-sm text-muted` (`showSavedDate`), with a `<time dateTime>` element.

- Compact variant: `p-4`, with no reflection and no tags.
- The whole card opens `/app/echoes/:id` through the stretched link on the quote.
- The heart and the tag chips stay independently clickable.

### FavoriteButton (DESIGN.md heart save state)

- A 24px heart inside a 44px hit area.
- **Saved:** filled `text-primary`, the favorite-on state. **Unsaved:** a `text-muted` outline, turning `hover:text-ink`.
- Use `aria-pressed`, with the label "Add to favorites" or "Remove from favorites".
- **Optimistic:** flip the state immediately and play `animate-heart-pop` (only when it becomes saved). If the request fails, revert and show a toast: "Couldn't update favorites. Try again."

### AddEchoButton (DESIGN.md `search-orb` treatment)

- A 48px circle, `rounded-full bg-primary text-on-primary hover:bg-primary-active active:scale-95`, with a plus icon and `aria-label="Add Echo"`.
- It sits in the desktop header (left of the avatar) and in the center of the mobile tab bar.
- It is Echo's most frequent primary action, so it gets the orb. Keyboard shortcut: `n`, ignored while typing in a field.

### SearchField (DESIGN.md `search-bar-pill`, a single segment)

- `h-12 desktop:h-16 rounded-full border border-hairline bg-canvas shadow-float pl-6 pr-2`, with the input `text-body-md`.
- A 40/48px orb button at the end: `bg-primary`, with a search icon and `aria-label="Search"`.
- It lives inside a `role="search"` landmark. Pressing `/` focuses it, and Esc clears and blurs it.
- **Mobile:** shown in a collapsed form, as a tappable pill or icon that opens the full search page.

### EchoForm (DESIGN.md `text-input` family)

- **Quote:** a Textarea with `autoFocus`, using QuoteText `card` styling inside the input so that what you type looks like a saved Echo. Its label is "Quote". Required.
- **"More details"** is a disclosure button (`aria-expanded`). It is collapsed on create and expanded on edit, and holds author, source, reflection, mood, tags, collections and revisit.
- **Actions:** Save (primary) and Cancel (secondary). On mobile they sit in a sticky bottom bar (`sticky bottom-0 bg-canvas border-t border-hairline p-4` plus safe-area padding).
- `Cmd/Ctrl+Enter` submits. Saving shows "Saving…", then navigates to the new Echo's detail page.
- Errors show inline per field. If the server rejects the form, show a summary above it with links to the fields, then move focus to the summary.

### TodaysEcho (DESIGN.md `rating-display-card`, Echo's "single loud moment")

- No card chrome: just generous space, `py-12 tablet:py-16`, with a centered or left-aligned column at `max-w-3xl`.
- It contains:
  - an eyebrow, "Today's Echo", in `text-caption text-muted`;
  - QuoteText `hero`;
  - the attribution;
  - "Saved 11 months ago";
  - the old reflection in `text-body-md text-body` with the label "You wrote:".
- Actions: **Echo me something** (`pill`) and a tertiary "Open".
- Swapping to a new Echo uses the cross-fade described in `motion.md`. The container keeps its minimum height while it swaps, so the page doesn't jump.
- Under the quote, a context line names where it came from: "From Courage · saved 2 years ago", with the collection's accent dot. Without a collection it reads "From your library · saved …".
- **Mobile action row:** Echo me something is full width; Open Echo and the heart share the next row, spaced apart.

### CollectionCard (DESIGN.md `host-card` treatment)

Built on Card (`p-6`):
- the name in `text-title-md text-ink`;
- the count ("24 Echoes") in `text-body-sm text-muted`, using `tabular-nums`;
- the description clamped to 2 lines in `text-body-sm text-body`.

The stretched link opens the collection.

### MetaList (DESIGN.md `amenity-row`)

Used on the Echo detail page for Author, Source, Saved, Collections and Revisit. It's a `<dl>` with rows `py-3 grid grid-cols-[8rem_1fr] gap-4 text-body-md`. Labels (`<dt>`) are `text-muted`, values (`<dd>`) are `text-ink`. Groups are separated by `border-t border-hairline`.

### TagInput, CollectionPicker

- **TagInput:** an ARIA combobox (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`). Chips sit inline before the input. Enter or comma creates a tag, and Backspace on an empty input selects the last chip, then removes it. Suggestions appear in the Menu styling.
- **CollectionPicker:** a Popover holding a checkbox list plus a "New collection" row at the bottom.

### RevisitPicker (DESIGN.md `date-picker-day*`)

- **Presets** as chips: "In 1 month", "In 6 months", "In 1 year", "Pick a date".
- **Calendar cells:** 40px `rounded-full text-body-sm tabular-nums`. The selected day is `bg-ink text-canvas`. Today is `ring-1 ring-hairline`. Past days are disabled, in `text-muted-soft line-through`.
- The calendar is a grid (`role="grid"`) navigated with the arrow keys, and each cell's label is the full date ("Thursday, April 1, 2027").
- Once a date is chosen, show the result as text: "Revisit on Apr 1, 2027" plus a "Change" tertiary button.

### EchoRow (dense lists inside panels)

- `relative flex gap-4 py-4 -mx-3 px-3 rounded-md`, with a hover fill: `hover:bg-surface-soft` on white panels, `hover:bg-canvas/60` on tinted ones.
- Optional 40px **monogram**: the author's initial (or a quote mark) on the Echo's collection tint (`bg-tint-*` with matching text). It is decorative, so `aria-hidden`.
- The quote uses QuoteText `compact`, clamped to 2 lines. Below it, a `text-body-sm text-muted` meta line: attribution `·` saved date, joined by a middle dot.
- A FavoriteButton on the right. An optional action ("Mark as reflected") sits under the meta line.
- The whole row opens the Echo (stretched link). Its children stay independently clickable.

### QuickCapture dialog (DESIGN.md `quick-capture-dialog`)

Add Echo opens a dialog instead of a page, so saving takes seconds. `n` opens it from anywhere.

- A native `<dialog>` with `showModal()`, which traps focus and makes the page inert. `rounded-lg bg-canvas p-6 shadow-float w-full max-w-lg`; a bottom sheet below 744px.
- **Fields:** Quote (Textarea, autofocused, the only required field, typed text shown in QuoteText `card`). A "More details" disclosure holds Author, Source, Reflection and Collection.
- **Actions:** Save Echo (primary) and Cancel (secondary). `Cmd/Ctrl+Enter` saves, and Esc cancels.
- **Validation:** an empty quote shows the inline error "Add the quote you want to save." under the field and moves focus to it.
- **Saving:** the button shows "Saving…" and is disabled, then the dialog closes, the toast "Echo saved" appears, and the new Echo shows up at the top of Recently added. Focus returns to the control that opened the dialog.
- **Closing with typed text:** Cancel asks "Discard this quote?" inline (Discard / Keep editing), so a draft is never lost silently.
- "Open full form" links to `/app/echoes/new` for the rare long entry.

## Screen recipes

| Screen | Structure |
|---|---|
| `/app` Home (dashboard) | A greeting header ("Good evening" in `text-display-lg`, plus one quiet line such as "2 Echoes are due for a revisit."). Then a 3-column grid at desktop. Main column (span 2): TodaysEcho in a `bg-tint-moss` panel, then Recently added (≤5 EchoRows with monograms) in a white panel. Side column: Revisits due (`bg-tint-ochre`), From the past (`bg-tint-heather`), then Your library (four counts with icon chips). Full width below: Favorites (≤3 QuoteCards at content height, `items-start`). The page is finite, with no "load more". |
| `/app/echoes` Library | Page title `text-display-lg`, a sort Select and filter chips in one row (wrapping on mobile), the QuoteCard grid, and pagination (Previous/Next with "Page 2 of 7"), not infinite scroll. |
| `/app/echoes/:id` Detail | `max-w-3xl`: a back link, QuoteText `hero` with the full quote, the attribution, the reflection block, tags, MetaList, and an action row (Favorite, Edit, Revisit, Delete). On mobile, the action row becomes IconButtons with labels in a sticky bottom bar. |
| `/app/echoes/new`, `/edit` | `max-w-3xl` EchoForm. |
| `/app/collections` | Title, a "+ New collection" secondary button, and the CollectionCard grid. |
| `/app/search` | SearchField at the top of the page, the result count in `text-body-sm text-muted` (an `aria-live` region), and QuoteCards with `showReflection`. |
| `/app/settings` | `max-w-3xl` sections, each with a `text-display-sm` heading and `py-8` spacing, divided by hairlines. |

## Empty, loading and error states

**Page-level states fill the screen.** The app frame is `flex min-h-dvh flex-col`, and `<main>` is `flex flex-1 flex-col`, so a state view can take all the remaining height:
- **Loading:** `flex flex-1 flex-col`, with the same grid as the loaded page. The last panel in each column stretches (`flex-1 min-h-0 overflow-hidden`). Keep the skeleton's natural height under one screen (e.g. 3 placeholder rows, not 5), so it fills the screen without scrolling.
- **First run and route-level Error:** `flex flex-1 items-center justify-center py-12`, so the card sits in the exact center. The page greeting is hidden in these states (it would describe data that isn't there), so the state's title becomes the `h1`.
- Section-level errors and empty sections stay inline in their panel. Only whole-page states fill the screen.

**Empty-state layout:** `py-16 text-center max-w-sm mx-auto`, containing:
- an optional 48px line icon in `text-muted`;
- a title in `text-title-md text-ink`;
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
| Search, no results | No Echoes match "{q}". | Try a different word, an author, or a tag. | — |
| Revisits | Nothing scheduled. | Pick an Echo and choose a day to see it again. | — |
| First run (`/app`, 0 Echoes) | Welcome to Echo. | Save the words you don't want to forget. | Add your first Echo (primary) |

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
