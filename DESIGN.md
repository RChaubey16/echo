---
version: inkwell-1
name: Echo design system (Inkwell)
description: A private notebook for the words that stay with you. Cream paper and warm brown-black ink, one iron-gall blue accent used sparingly, EB Garamond for quotes and only quotes, Hanken Grotesk for everything else. Corners like cut card stock, hairlines and surface tone instead of shadows, and a faint paper grain on the page.

colors:
  primary: "#2d4a72"
  primary-hover: "#253f62"
  primary-active: "#1c3150"
  primary-disabled: "#d5dce6"
  on-primary: "#fbf8f2"
  error: "#a8301c"
  error-hover: "#8f2716"
  on-error: "#fbf8f2"
  error-tint: "#f7e4dd"
  ink: "#2b2622"
  body: "#463f39"
  muted: "#675e55"
  muted-soft: "#9a9085"
  hairline: "#ddd4c4"
  hairline-soft: "#e8e1d3"
  border-input: "#8a7f72"
  canvas: "#fbf8f2"
  surface-soft: "#f3eee4"
  surface-strong: "#e9e2d4"
  tint-moss: "#ecefe0"
  tint-ochre: "#f5ecda"
  tint-heather: "#f2e7ec"
  tint-neutral: "#efe9df"
  mark-moss: "#56703a"
  mark-ochre: "#8a5a12"
  mark-heather: "#74405f"
  mark-neutral: "#675e55"
  scrim: "rgb(43 38 34 / 0.5)"

colors-dark:
  primary: "#a3bce3"
  primary-hover: "#b6cbea"
  primary-active: "#c9d8ef"
  primary-disabled: "#2b3442"
  on-primary: "#14202f"
  error: "#f09a86"
  error-hover: "#f4ae9d"
  on-error: "#2a120c"
  error-tint: "#3a221c"
  ink: "#f0e9de"
  body: "#d3c9bb"
  muted: "#a39888"
  muted-soft: "#6f665b"
  hairline: "#3a332c"
  hairline-soft: "#2d2823"
  border-input: "#857a6c"
  canvas: "#221e1a"
  surface-soft: "#1a1714"
  surface-strong: "#2d2823"
  tint-moss: "#262b1d"
  tint-ochre: "#2e2619"
  tint-heather: "#2e2129"
  tint-neutral: "#2a2520"
  mark-moss: "#a8bf86"
  mark-ochre: "#d9a55a"
  mark-heather: "#d39cbd"
  mark-neutral: "#a39888"
  scrim: "rgb(0 0 0 / 0.6)"

typography:
  sans: "'Hanken Grotesk', system-ui, sans-serif"
  quote: "'EB Garamond', Georgia, serif"
  quote-display: { size: 56px, mobile: 40px, lineHeight: 1.1, weight: 400 }
  quote-today: { size: 44px, tablet: 38px, mobile: 26px, lineHeight: 1.24, letterSpacing: -0.005em, weight: 400 }
  quote-hero: { size: 38px, mobile: 26px, lineHeight: 1.28, mobileLineHeight: 1.32, weight: 400 }
  quote-card: { size: 23px, mobile: 21px, lineHeight: 1.42, weight: 400 }
  quote-compact: { size: 19px, lineHeight: 1.42, weight: 400 }
  display-xl: { size: 36px, lineHeight: 1.15, letterSpacing: -0.02em, weight: 600 }
  display-lg: { size: 28px, lineHeight: 1.2, letterSpacing: -0.01em, weight: 600 }
  display-sm: { size: 20px, lineHeight: 1.3, weight: 600 }
  title-md: { size: 16px, lineHeight: 1.35, weight: 600 }
  title-sm: { size: 16px, lineHeight: 1.35, weight: 500 }
  body-md: { size: 16px, lineHeight: 1.55, weight: 400 }
  body-sm: { size: 14px, lineHeight: 1.5, weight: 400 }
  caption: { size: 14px, lineHeight: 1.4, weight: 500 }
  caption-sm: { size: 13px, lineHeight: 1.4, weight: 400 }
  label: { size: 12px, lineHeight: 1.2, letterSpacing: 0.06em, weight: 600, transform: uppercase }
  badge: { size: 12px, lineHeight: 1.2, weight: 500 }
  button-md: { size: 15px, lineHeight: 1.25, weight: 600 }
  button-sm: { size: 14px, lineHeight: 1.25, weight: 600 }
  nav-link: { size: 15px, lineHeight: 1.25, weight: 600 }

rounded:
  xs: 2px
  sm: 4px
  md: 6px
  lg: 10px
  full: 9999px

spacing:
  base: 4px
  steps: [2, 4, 8, 12, 16, 24, 28, 32, 40, 48, 56, 64, 80, 96]
  reading-column: 680px
  app-content: 1120px
  gutter: 32px
  gutter-mobile: 20px

elevation:
  float: "0 1px 2px rgb(43 38 34 / 0.06), 0 8px 24px rgb(43 38 34 / 0.1)"
  float-dark: "0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px rgb(0 0 0 / 0.45)"

motion:
  fast: 150ms
  base: 200ms
  slow: 250ms
  ease-out: "cubic-bezier(0.2, 0, 0, 1)"
  ease-in: "cubic-bezier(0.4, 0, 1, 1)"

grain:
  light: "rgb(60 40 20 / 0.035)"
  dark: "rgb(255 240 220 / 0.025)"
  pattern: "radial-gradient 1px dots on a 3px grid"
---

## Overview

Echo is a personal library of quotes and reflections. Inkwell makes it feel like a well-kept
notebook rather than a dashboard:

- The ground is **cream paper** (`canvas` #fbf8f2, and `surface-soft` #f3eee4 for the app page),
  with **warm brown-black ink** (`ink` #2b2622) for text.
- There is a single accent, **iron-gall blue** (`primary` #2d4a72), the colour of a fountain pen.
- Dark mode is the same desk at night: warm umber surfaces, not blue-gray.

The words are the hero:

- **EB Garamond** carries every quote and nothing else. The one exception is the landing
  tagline, which is treated as a quote.
- **Hanken Grotesk** handles the interface, including the wordmark.
- The serif is always the largest literary voice on the screen.

The design was produced in Claude Design. The export, with the rationale, the component sheet and
every screen in light and dark, lives in `docs/design/claude-design/export/`. The implementation
plan and decisions are in `docs/design/claude-design/implementation-plan.md`.

**Key characteristics:**

- **One accent, used rarely:** primary CTAs, inline links, the favorite-on state and the focus
  ring. Most screens are about 90% paper and ink. Navigation state is never the accent.
- **Today's Echo is the one bold moment** in the app. It is the only place quote type reaches
  44px, the only panel with 56px of padding, and on desktop it splits into a quote column and a
  "You wrote" margin note. "Echo me something" is the only filled button on Home.
- **Shape is soft but square-ish, like cut card stock:** 4px chips, 6px controls, 10px panels.
  Icon buttons are circles. There are no pills.
- **Flat surfaces:**
  - Panels are separated by one warm hairline and a change of surface tone.
  - The single shadow tier is kept for things that truly float: dialogs, menus, toasts and the
    raised Add button.
  - Cards never lift on hover; their border darkens to `border-input`.
- **Paper grain:** a 3px dot pattern (one CSS gradient, no image) on the app page (`bg-paper`).

## Colors

### Accent

- **Primary** (#2d4a72, dark #a3bce3): CTAs, inline links, the favorite-on heart, the focus ring.
  Text on it is `on-primary` (8.5:1).
- **Primary hover / active:** the hover and pressed fills.
- **Primary disabled:** the disabled CTA fill. Disabled text uses `muted-soft`; disabled controls
  are exempt from contrast minimums.

### Error

- `error` is validation text and the danger fill.
- `error-hover` is the danger hover.
- `on-error` is text on the danger fill.
- `error-tint` is the error panel. Errors are always warm red, never mistaken for the blue accent.

### Text

- `ink`: headings and primary text.
- `body`: long-form text such as reflections.
- `muted`: meta, secondary text and labels. It passes AA on every surface and tint.
- `muted-soft`: disabled text only.

### Surfaces and lines

- `canvas`: panels, cards, dialogs, and the public pages' background.
- `surface-soft`: the app page, with grain.
- `surface-strong`: hover fills, chips, the active nav item, skeleton blocks.
- `hairline`: panel borders.
- `hairline-soft`: inner dividers.
- `border-input`: input outlines and hovered card borders, at 3:1 or better (SC 1.4.11).
- `scrim`: the modal backdrop, with its opacity built in.

### Collection slots

Collections store `lagoon | bronze | plum | neutral` in the database. Inkwell shows them as:

| Stored | Shown as | Mark | Tint |
|---|---|---|---|
| `lagoon` | Moss | `mark-moss` | `tint-moss` |
| `bronze` | Ochre | `mark-ochre` | `tint-ochre` |
| `plum` | Heather | `mark-heather` | `tint-heather` |
| `neutral` | Neutral (a ring, not a fill) | `mark-neutral` | `tint-neutral` |

How the slots are used:

- **Marks** are small: dots, icon chips, and the 4px bar on a collection card. They never fill
  buttons, links or blocks of text.
- **Tints** are pale panels. Ochre is the Revisits panel, Heather is From the past, and each
  slot's tint sits behind its EchoRow monogram.
- **A collection always shows its name next to its colour**, so colour is never the only signal.
- **The primary accent is not a collection colour.** Moss is a separate token.

### Contrast

Every text pair passes WCAG 2.2 AA in both themes:

- `ink`, `body` and `muted` on canvas, surfaces and all tints.
- `primary` on canvas and surfaces.
- `on-primary` on all primary states.
- `on-error` on error.
- `canvas` on ink (toasts, selected chips).

Marks, `border-input` and the focus ring are at least 3:1. Run
`python3 .agents/skills/echo-design-system/scripts/contrast.py` and the same with `--theme dark`
after any change.

## Typography

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `quote-display` | 56/1.1, mobile 40 | 400 | The landing tagline only. |
| `quote-today` | 44/1.24 at ≥1128px, 38 tablet, 26 mobile | 400 | Today's Echo only. |
| `quote-hero` | 38/1.28, mobile 26/1.32 | 400 | Echo detail. |
| `quote-card` | 23/1.42, mobile 21 | 400 | QuoteCard. |
| `quote-compact` | 19/1.42 | 400 | Rows, pickers, search results. |
| `display-xl` | 36/1.15, -0.02em | 600 | Public page titles. |
| `display-lg` | 28/1.2, -0.01em | 600 | App page titles, the greeting. |
| `display-sm` | 20/1.3 | 600 | Section heads. |
| `title-md` | 16/1.35 | 600 | Card titles. |
| `title-sm` | 16/1.35 | 500 | The account name. |
| `body-md` | 16/1.55 | 400 | Default text. |
| `body-sm` | 14/1.5 | 400 | Meta, dates. |
| `caption` | 14/1.4 | 500 | Field labels. |
| `caption-sm` | 13/1.4 | 400 | Fine print, counters. |
| `label` | 12/1.2, +0.06em, uppercase | 600 | Section kickers ("You wrote", "Today's Echo"). |
| `badge` | 12/1.2 | 500 | Counts, small chips. |
| `button-md` / `button-sm` | 15 / 14 | 600 | Button labels. |
| `nav-link` | 15 | 600 | Tabs. |

The quote sizes step up from the old Newsreader scale because Garamond sets smaller for the same
point size. Quote text and the quote textarea come only from `QuoteText` / `quoteClasses`.

## Shape, space, elevation

- **Radius** (Tailwind names, which match the export):
  - `rounded-xs` 2px: tags.
  - `rounded-sm` 4px: chips.
  - `rounded-md` 6px: buttons, inputs.
  - `rounded-lg` 10px: panels, cards, dialogs, menus, the mobile sheet top.
  - `rounded-full`: icon buttons and dots only.
- **Spacing** has a 4px base, with steps 2 · 4 · 8 · 12 · 16 · 24 · 28 · 32 · 40 · 48 · 56 · 64 · 80 · 96.
  - 28 is card and dialog padding, 40 the gap between Home's sections, 56 Today's Echo's padding,
    and 80 the public pages' desktop gutter. 10, 14 and 18 (Tailwind 2.5, 3.5 and 4.5) are for fine
    alignment inside components.
  - The reading column is 680px, and the app content area is 1120px.
  - Gutters are 32px, or 20px on mobile.
- **Elevation** has one tier, `shadow-float`, warm-tinted, with a darker value in dark mode. Use
  it for dialogs, menus, toasts and the raised Add button. Everything else is flat.
- **Focus** is a 2px `primary` outline, offset 2px, on every interactive element. On inputs, the
  border also becomes 2px `ink`.

## Motion

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover, press, chip toggle. |
| `duration-base` | 200ms | Dialog, menu, toast in. |
| `duration-slow` | 250ms | The Echo me something swap. |
| `ease-out-soft` | `cubic-bezier(0.2, 0, 0, 1)` | Entering. |
| `ease-in-soft` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving. |

The swap is a short fade and rise with a height ease, so a long passage never makes the page
jump. With reduced motion there is no movement: every transition and entrance becomes a 150ms
opacity or colour change, so state changes stay visible (see the skill's `motion.md`).

## Layout and navigation

Breakpoints are tablet 744px, desktop 1128px and wide 1440px.

| Width | Navigation |
|---|---|
| ≥ 1128px | A 256px sidebar on `canvas` with a right hairline. |
| 744–1127px | A 96px labelled rail. |
| < 744px | A 64px header, and a bottom tab bar (Home, Library, raised Add, Search, Collections). |

The desktop sidebar holds:

- the wordmark and a collapse button;
- a full-width Add Echo button;
- search, with the `/` shortcut;
- the nav: Home, Library, Favorites, Collections, Revisits;
- up to 5 collections;
- Settings and the account.

Navigation details:

- The active item is a `surface-strong` fill with weight 600, never the accent.
- Add Echo is the only accent in the chrome.
- Everything works from 320px wide, with touch targets of at least 44px.

## Components

The component sheet in the export (`Echo Design System.dc.html`) shows every state. Structural
changes from the previous design are tracked in `implementation-plan.md`:

- Today's Echo uses two columns.
- The QuoteCard has a footer row.
- The CollectionCard has a 4px accent bar.
- The Library uses masonry.
- The toast is inverted.
- Tabs use an underline.
- The tab bar marks the active item with a pill.
- The quote textarea uses the serif.
- Search highlights matches with `<mark>`.

The skill's `references/components.md` describes the components as built.

## Voice

Warm, brief, second person; never cute or exclamatory, and never guilt-tripping. For example:
"Your library is waiting." / "Why did this speak to you?" / "Delete *Courage*? Your Echoes are
kept."
