# Tokens: DESIGN.md → Tailwind v4

Echo uses Tailwind CSS v4, so tokens live in CSS (`@theme` in `src/app/globals.css`), not in a
`tailwind.config.js`. Token names match the DESIGN.md frontmatter keys exactly, which keeps the
two easy to diff.

**If `globals.css` and DESIGN.md disagree, DESIGN.md wins.** Fix `globals.css`, and this file if
needed. This file doesn't copy the token block, so it can't drift. Read `globals.css` for the
values.

## Contents

1. [How globals.css is laid out](#how-globalscss-is-laid-out)
2. [Font loading](#font-loading)
3. [Utility cheat sheet](#utility-cheat-sheet)
4. [Spacing map](#spacing-map)
5. [Rules](#rules)

## How globals.css is laid out

1. **`@theme`** resets Tailwind's colors, shadows, radii and breakpoints (`--color-*: initial`
   and so on), so a stray `bg-blue-500` or `shadow-lg` compiles to nothing. It then defines:
   - the light colors;
   - the fonts and the type scale (`--text-*` with line height, tracking and weight);
   - the radii `xs` 2, `sm` 4, `md` 6, `lg` 10;
   - `shadow-float`;
   - the breakpoints `tablet` 744, `desktop` 1128, `wide` 1440;
   - the eases and the `animate-*` keyframes.
2. **The dark theme** redefines the same `--color-*` names, plus `--shadow-float` and `--grain`:
   - under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, for System;
   - under `:root[data-theme="dark"]`, for an explicit choice.

   Components never change between themes.
3. **`:root`** holds the duration tokens (`--duration-fast` 150ms, `--duration-base` 200ms,
   `--duration-slow` 250ms) and the light `--grain`.
4. **Utilities:**
   - `duration-fast`, `duration-base`, `duration-slow`;
   - `bg-paper` (surface-soft plus the 3px dot grain);
   - `user-text` (`white-space: pre-wrap; overflow-wrap: anywhere`).
5. **`@layer base`** holds the html colors, the body font, the focus ring (2px `primary`, offset
   2px) and the reduced-motion transition limit. A `prefers-reduced-motion` block on `:root` turns
   every duration and entrance animation into a 150ms fade (see motion.md).

**Theme:** `data-theme` on `<html>` is rendered on the server from the theme cookie, which mirrors
`User.theme`. It is absent for System, so the page never flashes the wrong theme. The export's
`data-theme="system"` attribute is intentionally not used.

## Font loading

Both fonts are self-hosted by `next/font` in `src/app/layout.tsx`, so there are no third-party
requests and no layout shift:

```tsx
import { EB_Garamond, Hanken_Grotesk } from "next/font/google";
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const quote = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", display: "swap", style: ["normal", "italic"] });
```

`--font-sans` and `--font-quote` in `@theme` point at those variables.

- **EB Garamond is for quotes only.** Use `QuoteText` or `quoteClasses()`, which apply
  `font-quote` and a `text-quote-*` size. Never use it for headings, labels or buttons. The one
  exception is the landing tagline (`text-quote-display`), which is treated as a quote.
- **The OG image** (`src/app/opengraph-image.tsx`) renders outside the browser, so it reads static
  TTFs from `assets/fonts/` and mirrors the light colors by hand.

## Utility cheat sheet

| Need | Use | Not |
|---|---|---|
| App page background | `bg-paper` | `bg-white`, `bg-surface-soft` on its own for a page |
| Public page background | `bg-canvas` (bands may use `bg-surface-soft`) | |
| Panel / card | `rounded-lg border border-hairline bg-canvas` | shadows on cards |
| Card hover | `hover:border-border-input` (no lift, no shadow) | `hover:shadow-float` |
| Revisits panel / From the past panel | `bg-tint-ochre` / `bg-tint-heather` | arbitrary pastels |
| Collection mark (dot, chip, card bar) | `bg-mark-moss` / `-ochre` / `-heather`; neutral is `border-2 border-mark-neutral` | marks as text or button colors |
| Monogram / icon chip | `bg-tint-<slot> text-mark-<slot>` | |
| Main text | `text-ink` | `text-black` |
| Long-form text | `text-body` | |
| Metadata, captions | `text-muted` | `text-gray-500` |
| Section kicker | `text-label uppercase text-muted` | |
| Disabled text | `text-muted-soft` | `opacity-50` on text |
| Panel border | `border-hairline` (`border-hairline-soft` inside panels) | `border-gray-200` |
| Input outline | `border-border-input` | `border-hairline` (1.4:1) |
| Hover row, chip, active nav | `bg-surface-strong` (rows on canvas may use `bg-surface-soft`) | |
| Primary action | `bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active` | |
| Disabled primary | `disabled:bg-primary-disabled disabled:text-muted-soft` | |
| Inline link | `text-primary underline-offset-2 hover:underline` | |
| Danger action | `bg-error text-on-error hover:bg-error-hover` | |
| Error text / border / panel | `text-error`, `border-error`, `bg-error-tint` | `text-red-600` |
| Inverted surface (toast, selected chip) | `bg-ink text-canvas` | `text-white` |
| Modal backdrop | `bg-scrim` (opacity is in the token) | `bg-black/50` |
| Float (dialog, menu, toast, raised Add) | `shadow-float` | `shadow-md` |
| Page title | `text-display-lg` (app) / `text-display-xl` (public) | `text-2xl font-bold` |
| Section heading | `text-display-sm` | |
| Body copy / meta | `text-body-md` / `text-body-sm text-muted` | `text-base` |
| Field label | `text-caption` | |
| Quote | `QuoteText size="today" \| "hero" \| "card" \| "compact"` | `font-serif`, italic whole quotes |
| User-written text | `user-text` | `whitespace-pre-wrap [overflow-wrap:anywhere]` by hand |

**Quote sizes are responsive inside `QuoteText`**, so don't add breakpoints at call sites:

| Size | Mobile | Tablet (≥744px) | Desktop (≥1128px) |
|---|---|---|---|
| `today` | `quote-hero-sm` (26) | `quote-hero` (38) | `quote-today` (44) |
| `hero` | `quote-hero-sm` (26) | `quote-hero` (38) | `quote-hero` (38) |
| `card` | `quote-card-sm` (21) | `quote-card` (23) | `quote-card` (23) |
| `compact` | 19 | 19 | 19 |

**Name clash to watch:** the color `text-body` and the type styles `text-body-md` / `text-body-sm`
are different utilities. `text-body-sm text-body` is valid and intended.

## Spacing map

Tailwind's default `--spacing` is 4px, matching DESIGN.md's base unit.

| px | Tailwind step | Typical use in Echo |
|---|---|---|
| 2 | `0.5` | icon-to-text nudges |
| 4 | `1` | tight chip gaps |
| 8 | `2` | label to input, meta rows |
| 12 | `3` | list row padding, chip padding |
| 16 | `4` | card grid gaps, compact card padding |
| 24 | `6` | card padding, dialog padding |
| 28 | `7` | roomy card padding (settings, due Revisits), gaps inside Today's Echo |
| 32 | `8` | the desktop gutter, gaps between groups |
| 40 | `10` | gaps between Home's sections, tablet panel padding |
| 48 | `12` | mobile section spacing |
| 56 | `14` | Today's Echo's desktop padding, the welcome card |
| 64 | `16` | section spacing at tablet and wider |
| 80 | `20` | the public pages' desktop gutter and section rhythm |
| 96 | `24` | the largest section breaks |

`2.5` (10), `3.5` (14), `4.5` (18) and `5` (20, the mobile gutter and button padding) are for fine
alignment inside components. Other steps (`9`, `11`, `18`, `22`, `28`) are flagged by
`audit_ui.py`. Control heights the design specifies directly: buttons `h-12` (48), small buttons
`h-10` (40) with a 44px hit area, inputs `h-13` (52), the search field `h-15` (60), the mobile tab
bar `h-18` (72).

## Rules

- **No raw colors in components.** That means no hex, `rgb()`, `bg-[#…]` or `text-[…]` color
  values. `scripts/audit_ui.py` flags them. Colors may only be written in `globals.css` and in the
  places that can't read CSS variables (the OG image, `themeColor`, `icon.svg`), and those carry
  an `audit-ignore` comment.
- **No arbitrary sizes** unless DESIGN.md states that exact value for that component. In that
  case, leave a comment naming it.
- **Opacity modifiers on tokens are fine** where they mean something, such as `bg-canvas/60` for a
  hover on a tinted panel. Don't use opacity to invent new grays for text.
- **The accent is rare.** It is for primary CTAs, links, the favorite-on state and the focus ring.
  Nav state, headings, tags and icons stay ink or muted.
- **Marks stay small.** Collection marks are dots, chips and 4px bars; tints are panels. A
  collection always shows its name beside its colour.
- **Dark mode is a token swap.** Never write `dark:` variants with literal colors. If something
  looks wrong in dark, fix `colors-dark` in DESIGN.md and the dark blocks in `globals.css`.
