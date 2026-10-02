# Echo components

This file is the inventory of Echo's components. For each one it gives the DESIGN.md component it borrows its treatment from, the build spec, and the states it must ship with. Class strings are a starting point, so adapt them to the real props. All values come from `tokens.md`.

## Contents

1. [Layout frame](#layout-frame)
2. [State matrix (every component)](#state-matrix)
3. [Primitives: `src/components/ui/`](#primitives)
4. [Echo components: `src/components/echo/`](#echo-components)
5. [Screen recipes](#screen-recipes)
6. [Empty, loading and error states](#empty-loading-and-error-states)
7. [Voice and copy](#voice-and-copy)

## Layout frame

| Thing | Spec |
|---|---|
| App shell width | `mx-auto max-w-7xl` (1280px, the DESIGN.md editorial cap) |
| Reading width (detail, forms, settings) | `max-w-3xl` (768px, about 65–75 characters at body-md) |
| Side gutter | `px-4 tablet:px-6 desktop:px-8` |
| Section rhythm | `py-12 tablet:py-16` between major sections; `gap-8` between groups inside one |
| Card grids | `grid gap-4 items-start`, with 1 column, then `tablet:grid-cols-2`, then `desktop:grid-cols-3`. Cards are as tall as their content: equal-height cards leave empty gaps under short quotes. Quotes need line length, so never use 4 columns, even though DESIGN.md's photo cards do. |
| Surfaces | App background `bg-surface-soft`. Panels and cards are `bg-canvas` with `border-hairline-soft`. The featured panel uses `bg-tint-lagoon`; time and memory panels may use `bg-tint-bronze` / `bg-tint-plum`. |
| Separation | Separate with whitespace first, surfaces second, and a hairline third. |
| Collection accents | Each collection gets an accent (lagoon, bronze, plum or neutral) shown as an 8px dot or an icon chip, always next to its name. |

## State matrix

A component isn't finished until it handles every state that applies to it.

| State | Interactive elements | Data views |
|---|---|---|
| Default | ✓ | ✓ |
| Hover | Only inside `@media (hover:hover)`, which Tailwind's `hover:` variant does in v4. It must be a visible change, never the only path to an action. | Cards: `hover:shadow-float` |
| Focus-visible | A 2px ink outline (global), or the documented component focus. Never removed without a replacement. | Focusable cards |
| Active/pressed | `active:` color shift plus, for buttons, `active:scale-98` | — |
| Disabled | Tokens, `disabled:cursor-not-allowed`, and the native `disabled` attribute (not just a style) | — |
| Loading | Busy affordance inside the control, `aria-busy="true"`, width kept, double-submit prevented | Skeleton that matches the final layout |
| Empty | — | Copy and the primary next action (see below) |
| Error | Inline message next to the cause | Friendly message, retry and error ID |
| Long content | Labels truncate with `truncate` and a `title` attribute | Quotes wrap (`[overflow-wrap:anywhere]`); cards clamp; detail shows everything |
| Success feedback | A toast or an inline state change (heart fills, card appears) | — |

## Primitives

### Button (DESIGN.md `button-*`)

| Variant | Classes | Use |
|---|---|---|
| `primary` | `h-12 px-6 rounded-sm bg-primary text-on-primary text-button-md hover:bg-primary-active active:bg-primary-active active:scale-98 disabled:bg-primary-disabled disabled:text-on-primary-disabled` | One per view: Save Echo, Create collection |
| `secondary` | `h-12 px-6 rounded-sm border border-ink bg-canvas text-ink text-button-md hover:bg-surface-soft active:bg-surface-strong` | Cancel, Edit, other secondary actions |
| `tertiary` | `h-auto px-0 text-ink text-button-md underline-offset-4 hover:underline` | Show more, Skip, inline actions |
| `pill` | `rounded-full px-5 py-2.5 bg-primary text-on-primary text-button-sm hover:bg-primary-active` | Featured soft call to action: **Echo me something** |
| `danger` | `h-12 px-6 rounded-sm bg-primary-error-text text-on-primary hover:bg-primary-error-text-hover` | Confirm buttons inside delete dialogs only |

- **Sizes:** `md` (48px, the default) and `sm` (`h-10 px-4 text-button-sm`), for dense desktop toolbars only. On touch, keep a hit area of at least 44px.
- **Loading:** show a 16px spinner before the label, change the label to its progressive form ("Saving…"), and set `disabled`. Keep the button the same width so the layout doesn't jump.
- **Transitions:** `transition-[background-color,transform] duration-fast ease-standard`. Never `transition-all`.
- Links that look like buttons are `<a>`/`<Link>` with the button classes. Actions are `<button type="button">`.

### IconButton (DESIGN.md `icon-button-circle` / `icon-button-outline`)

- `circle`: a 32px visual `rounded-full bg-surface-strong text-ink`, with the hit area extended to 44px using a `before:absolute before:-inset-1.5` pseudo-element.
- `outline`: 40px, `rounded-full border border-hairline bg-canvas`.
- `aria-label` is a **required** prop in the TypeScript type. Icons are `aria-hidden`.
- Hover: `hover:bg-surface-soft` (outline) or `hover:bg-hairline-soft` (circle).

### Input / Textarea (DESIGN.md `text-input`)

- `h-14 px-3 rounded-sm border border-border-input bg-canvas text-body-md text-ink placeholder:text-muted`. `border-input` (#858585) is 3.7:1 on white, meeting the 3:1 boundary contrast WCAG requires.
- **Focus:** DESIGN.md asks for "2px ink, no glow, no ring". Get it without layout shift by keeping the 1px border and adding an inset outline: `focus:border-ink focus:outline-1 focus:outline-ink focus:-outline-offset-2`. If you choose a different technique, check it at runtime.
- **Label:** a visible `<label>` above the field, in `text-caption text-muted`, with `gap-1.5`. A placeholder is an example of the input, not a label.
- **Error:** `border-primary-error-text`, `aria-invalid="true"`, and a message below the field in `text-body-sm text-primary-error-text` with a 14px icon, linked through `aria-describedby`. Validate on blur and on submit, not on every keystroke.
- **Disabled:** `bg-surface-soft text-muted-soft`.
- **Textarea:** grows with its content (`field-sizing: content` where supported, otherwise grow in JS), with `min-h-32`, and has no manual resize handle on touch devices.
- **Counter:** show it only when within 10% of the maximum length (the spec limits a quote to 10,000 characters and author to 500). Use `text-caption-sm text-muted`, turning to error color once the limit is passed.

### Card (base for QuoteCard and CollectionCard)

`relative rounded-md border border-hairline bg-surface-card p-6`. When interactive, add `transition-shadow duration-base ease-standard hover:border-transparent hover:shadow-float`. When the content is the click target, use the stretched-link pattern: the main `<Link>` gets `after:absolute after:inset-0`, and nested buttons get `relative z-10`. Never nest interactive elements inside a `<a>`.

### Tag chip (DESIGN.md `category-strip` / `button-sm` pill)

- `inline-flex h-8 items-center rounded-full border border-hairline px-3 text-button-sm text-ink hover:border-ink`.
- **Selected or active filter:** `bg-ink text-canvas border-ink`. Ink fill is Echo's selection language (it matches `date-picker-day-selected`). Don't use Lagoon here: Lagoon means *saved* and *primary action*.
- **Removable chip** (TagInput): a trailing × IconButton labelled `Remove tag courage`.

### Badge (DESIGN.md `guest-favorite-badge`)

`rounded-full bg-canvas px-2.5 py-1 text-badge text-ink`. Add `shadow-float` only when it floats over other content. Use it for "Revisit due", "Favorite" and counts. **Don't use `text-uppercase-tag` (8px)** in Echo. It is below a readable size, so use `text-badge` (11px) as the floor.

### Dialog / Sheet

- **Backdrop:** `bg-scrim/50`, fading in with `animate-fade-in`.
- **Panel:** `rounded-md bg-canvas p-6 shadow-float w-full max-w-md`, entering with `animate-rise-in`.
- **Below 744px,** it becomes a bottom sheet: `rounded-t-xl` (32px), full width, with a drag handle (`h-1 w-10 rounded-full bg-hairline`) and bottom safe-area padding.
- Focus is trapped and returns to the trigger when the dialog closes. Esc closes it. The title is linked with `aria-labelledby`. Prefer Radix Dialog if it's installed; otherwise use native `<dialog>` with `showModal()`.
- **Destructive dialogs:** the primary (danger) button sits on the right, and Cancel gets initial focus.

### Dropdown / Menu / Popover

`rounded-md bg-canvas shadow-float py-2 min-w-48`. Items are `h-10 px-4 text-body-md hover:bg-surface-soft focus-visible:bg-surface-soft`. Use full keyboard support (arrows, Home/End, typeahead, Esc). Prefer Radix.

### Toast

`rounded-sm bg-ink text-on-dark px-4 py-3 text-body-sm shadow-float`, placed at the bottom center (above the bottom tab bar on mobile). Toasts live in an `aria-live="polite"` region, auto-dismiss after 4s, pause on hover or focus, and can carry one optional action ("Undo", "View"). Use toasts to confirm an action, never to report a form error.

### Tabs / nav tabs (DESIGN.md `product-tab-*`)

The active tab is `text-ink border-b-2 border-ink`, inactive tabs are `text-muted hover:text-ink`, and all use `text-nav-link`. Mark the current item with `aria-current="page"` for navigation, or with `role="tab"` and `aria-selected` for in-page tabs.

### Skeleton

`rounded-xs bg-surface-strong animate-skeleton motion-reduce:animate-none`. Always shape it like the content it replaces (see below), and keep the same container size so nothing shifts when the content arrives.

## Echo components

### QuoteText: the one place quote typography is defined

Quotes are set in Newsreader (`font-quote`) with the DESIGN.md `quote-*` styles. Keep them in this single component, so the classes aren't repeated across screens and the quote typeface can change in one place.

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
- **Saved:** filled `text-primary` (Lagoon), which is the DESIGN.md "heart save state". **Unsaved:** a `text-muted` outline, turning `hover:text-ink`.
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

### Navigation (DESIGN.md `app-sidebar`)

- **Sidebar (≥1128px, expanded):**
  - `fixed inset-y-0 left-0 w-64 border-r border-hairline bg-canvas`, with the page content offset by the same width;
  - top: logo plus a collapse button (`aria-expanded`, `aria-controls`);
  - a full-width primary **Add Echo** button, then a search field (press `/`);
  - nav items Home, Library, Favorites, Collections, Revisits: `h-10 px-3 rounded-sm text-body-md text-body hover:bg-surface-soft`. The active item (`aria-current="page"`) gets `bg-surface-soft text-ink font-semibold`. Never Lagoon;
  - a Collections list: at most 5 rows of accent dot, name and count (`text-body-sm`), then "All collections";
  - Settings and the account at the bottom, above a hairline.
- **Rail (744–1127px, or collapsed on desktop):** `w-24`. Items stack an icon over a `text-caption-sm` label (labels stay visible; never icon-only). Add becomes the 48px round Lagoon button, and Search becomes a nav item. On desktop an Expand button sits at the end of the nav.
- **Mobile (<744px):** no sidebar. A 64px header with the logo and account, plus the BottomTabBar: Home, Library, **Add** (the orb, raised `-mt-4`), Search, Collections. Favorites, Revisits and Settings live in the account menu.
- The user's collapse choice is remembered per browser.
- **The sidebar never scrolls sideways.** Its middle section is `overflow-y-auto overflow-x-hidden [scrollbar-width:thin]`. Every list in it uses `grid grid-cols-1` (a `minmax(0,1fr)` track), so long collection names truncate instead of widening the column. A plain `grid` sizes its column to the longest row.
- **Marketing pages** (`/`, `/login`) use the DESIGN.md top-nav, with a hamburger below 744px.

### EchoRow (dense lists inside panels)

- `relative flex gap-4 py-4 -mx-3 px-3 rounded-sm`, with a hover fill: `hover:bg-surface-soft` on white panels, `hover:bg-canvas/60` on tinted ones.
- Optional 40px **monogram**: the author's initial (or a quote mark) on the Echo's collection tint (`bg-tint-*` with matching text). It is decorative, so `aria-hidden`.
- The quote uses QuoteText `compact`, clamped to 2 lines. Below it, a `text-body-sm text-muted` meta line: attribution `·` saved date, joined by a middle dot.
- A FavoriteButton on the right. An optional action ("Mark as reflected") sits under the meta line.
- The whole row opens the Echo (stretched link). Its children stay independently clickable.

### QuickCapture dialog (DESIGN.md `quick-capture-dialog`)

Add Echo opens a dialog instead of a page, so saving takes seconds. `n` opens it from anywhere.

- A native `<dialog>` with `showModal()`, which traps focus and makes the page inert. `rounded-md bg-canvas p-6 shadow-float w-full max-w-lg`; a bottom sheet below 744px.
- **Fields:** Quote (Textarea, autofocused, the only required field, typed text shown in QuoteText `card`). A "More details" disclosure holds Author, Source, Reflection and Collection.
- **Actions:** Save Echo (primary) and Cancel (secondary). `Cmd/Ctrl+Enter` saves, and Esc cancels.
- **Validation:** an empty quote shows the inline error "Add the quote you want to save." under the field and moves focus to it.
- **Saving:** the button shows "Saving…" and is disabled, then the dialog closes, the toast "Echo saved" appears, and the new Echo shows up at the top of Recently added. Focus returns to the control that opened the dialog.
- **Closing with typed text:** Cancel asks "Discard this quote?" inline (Discard / Keep editing), so a draft is never lost silently.
- "Open full form" links to `/app/echoes/new` for the rare long entry.

## Screen recipes

| Screen | Structure |
|---|---|
| `/app` Home (dashboard) | A greeting header ("Good evening" in `text-display-lg`, plus one quiet line such as "2 Echoes are due for a revisit."). Then a 3-column grid at desktop. Main column (span 2): TodaysEcho in a `bg-tint-lagoon` panel, then Recently added (≤5 EchoRows with monograms) in a white panel. Side column: Revisits due (`bg-tint-bronze`), From the past (`bg-tint-plum`), then Your library (four counts with icon chips). Full width below: Favorites (≤3 QuoteCards at content height, `items-start`). The page is finite, with no "load more". |
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
