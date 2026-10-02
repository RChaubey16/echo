# Tokens: DESIGN.md → Tailwind v4

Echo uses Tailwind CSS v4, so tokens live in CSS (`@theme`), not in a `tailwind.config.js`. The token block sits in `src/app/globals.css`. Token names match the DESIGN.md frontmatter keys exactly, which keeps the two easy to diff.

**If the block below and DESIGN.md disagree, DESIGN.md wins.** Update the block, and this file, to match it.

## Contents

1. [The `@theme` block](#the-theme-block)
2. [Font loading](#font-loading)
3. [Utility cheat sheet](#utility-cheat-sheet)
4. [Spacing map](#spacing-map)
5. [Rules](#rules)

## The `@theme` block

```css
@import "tailwindcss";

@theme {
  /* Reset Tailwind's defaults so that only Echo tokens exist.
     A stray `bg-blue-500` or `shadow-lg` then fails to compile into anything. */
  --color-*: initial;
  --shadow-*: initial;
  --radius-*: initial;
  --breakpoint-*: initial;

  /* ── Colors (DESIGN.md › colors) ── */
  --color-primary: #0e7c6b;            /* Lagoon: primary CTA, saved/favorite state, links */
  --color-primary-active: #0a5f52;     /* pressed + hover */
  --color-primary-disabled: #c5e8e1;
  --color-primary-error-text: #c13515;
  --color-primary-error-text-hover: #b32505;
  --color-luxe: #8a5a12;               /* Bronze: small accent marks only (dots, icon chips) */
  --color-plus: #6b2a5e;               /* Plum: small accent marks only (dots, icon chips) */
  --color-ink: #222222;
  --color-body: #3f3f3f;
  --color-muted: #6a6a6a;
  --color-muted-soft: #929292;
  --color-hairline: #dddddd;
  --color-hairline-soft: #ebebeb;
  --color-border-strong: #c1c1c1;
  --color-border-input: #858585;       /* resting outline of inputs: 3.7:1 (SC 1.4.11) */
  --color-canvas: #ffffff;
  --color-surface-soft: #f7f7f7;
  --color-surface-card: #ffffff;
  --color-surface-strong: #f2f2f2;
  --color-tint-lagoon: #ecf5f3;        /* featured panel (Today's Echo) */
  --color-tint-bronze: #f6f2ec;        /* time panels (Revisits), Bronze marks */
  --color-tint-plum: #f3eef2;          /* memory panels (From the past), Plum marks */
  --color-on-primary: #ffffff;
  --color-on-primary-disabled: #0a5f52; /* disabled CTA label, 5.8:1 */
  --color-on-dark: #ffffff;
  --color-legal-link: #428bff;         /* 3.3:1 on white; never for running text */
  --color-star-rating: #222222;
  --color-scrim: #000000;              /* always used as bg-scrim/50 */

  /* ── Type (DESIGN.md › typography) ── */
  --font-sans: var(--font-inter), "Airbnb Cereal VF", Circular, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif;
  --font-quote: var(--font-newsreader), Georgia, "Times New Roman", serif;   /* quotes only */

  --text-quote-hero: 28px;    --text-quote-hero--line-height: 1.36;    --text-quote-hero--letter-spacing: -0.2px;  --text-quote-hero--font-weight: 400;
  --text-quote-card: 20px;    --text-quote-card--line-height: 1.45;    --text-quote-card--font-weight: 400;
  --text-quote-compact: 17px; --text-quote-compact--line-height: 1.45; --text-quote-compact--font-weight: 400;

  --text-rating-display: 64px; --text-rating-display--line-height: 1.1;  --text-rating-display--letter-spacing: -1px;    --text-rating-display--font-weight: 700;
  --text-display-xl: 28px;     --text-display-xl--line-height: 1.43;     --text-display-xl--letter-spacing: 0;           --text-display-xl--font-weight: 700;
  --text-display-lg: 22px;     --text-display-lg--line-height: 1.18;     --text-display-lg--letter-spacing: -0.44px;     --text-display-lg--font-weight: 500;
  --text-display-md: 21px;     --text-display-md--line-height: 1.43;     --text-display-md--letter-spacing: 0;           --text-display-md--font-weight: 700;
  --text-display-sm: 20px;     --text-display-sm--line-height: 1.2;      --text-display-sm--letter-spacing: -0.18px;     --text-display-sm--font-weight: 600;
  --text-title-md: 16px;       --text-title-md--line-height: 1.25;       --text-title-md--font-weight: 600;
  --text-title-sm: 16px;       --text-title-sm--line-height: 1.25;       --text-title-sm--font-weight: 500;
  --text-body-md: 16px;        --text-body-md--line-height: 1.5;         --text-body-md--font-weight: 400;
  --text-body-sm: 14px;        --text-body-sm--line-height: 1.43;        --text-body-sm--font-weight: 400;
  --text-caption: 14px;        --text-caption--line-height: 1.29;        --text-caption--font-weight: 500;
  --text-caption-sm: 13px;     --text-caption-sm--line-height: 1.23;     --text-caption-sm--font-weight: 400;
  --text-badge: 11px;          --text-badge--line-height: 1.18;          --text-badge--font-weight: 600;
  --text-micro-label: 12px;    --text-micro-label--line-height: 1.33;    --text-micro-label--font-weight: 700;
  --text-uppercase-tag: 8px;   --text-uppercase-tag--line-height: 1.25;  --text-uppercase-tag--letter-spacing: 0.32px;   --text-uppercase-tag--font-weight: 700;
  --text-button-md: 16px;      --text-button-md--line-height: 1.25;      --text-button-md--font-weight: 500;
  --text-button-sm: 14px;      --text-button-sm--line-height: 1.29;      --text-button-sm--font-weight: 500;
  --text-link: 14px;           --text-link--line-height: 1.43;           --text-link--font-weight: 400;
  --text-nav-link: 16px;       --text-nav-link--line-height: 1.25;       --text-nav-link--font-weight: 600;

  /* ── Rounded (DESIGN.md › rounded). rounded-none and rounded-full are built in. ── */
  --radius-xs: 4px;
  --radius-sm: 8px;    /* buttons, inputs */
  --radius-md: 14px;   /* cards, dialogs, menus */
  --radius-lg: 20px;
  --radius-xl: 32px;

  /* ── Elevation: the one shadow tier ── */
  --shadow-float: rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0;

  /* ── Breakpoints (DESIGN.md › Responsive Behavior). Mobile is the unprefixed base. ── */
  --breakpoint-tablet: 744px;
  --breakpoint-desktop: 1128px;
  --breakpoint-wide: 1440px;

  /* ── Motion (see motion.md) ── */
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);   /* entering, arriving */
  --ease-in-soft: cubic-bezier(0.4, 0, 1, 1);        /* leaving */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);       /* state changes in place */
  --animate-fade-in: fade-in 200ms var(--ease-out-soft) both;
  --animate-rise-in: rise-in 320ms var(--ease-out-soft) both;
  --animate-heart-pop: heart-pop 320ms var(--ease-out-soft);
  --animate-menu-in: menu-in 200ms var(--ease-out-soft) both;   /* menus, popovers, listboxes; set origin-* to the trigger side */
  --animate-skeleton: skeleton 1.6s ease-in-out infinite;

  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
  @keyframes rise-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
  @keyframes menu-in { from { opacity: 0; transform: scale(0.98) } to { opacity: 1; transform: none } }
  @keyframes heart-pop { 0% { transform: scale(1) } 40% { transform: scale(1.2) } 100% { transform: scale(1) } }
  @keyframes skeleton { 0%, 100% { opacity: 1 } 50% { opacity: 0.55 } }
}

/* Dark theme (DESIGN.md › colors-dark). Same names, different values: components never change.
   System preference applies unless the user picked a theme; data-theme on <html> wins both ways. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-primary: #3cbaa5;
    --color-primary-active: #5fcbb8;
    --color-primary-disabled: #1f3b36;
    --color-primary-error-text: #ff8f7a;
    --color-primary-error-text-hover: #ffa898;
    --color-luxe: #d9a55a;
    --color-plus: #d68cc4;
    --color-ink: #ecefee;
    --color-body: #c8cecc;
    --color-muted: #9ba4a2;
    --color-muted-soft: #6c7573;
    --color-hairline: #323837;
    --color-hairline-soft: #272c2b;
    --color-border-strong: #454c4b;
    --color-border-input: #7d8786;
    --color-canvas: #1b1f1e;
    --color-surface-soft: #121514;
    --color-surface-card: #1b1f1e;
    --color-surface-strong: #262b2a;
    --color-tint-lagoon: #15302b;
    --color-tint-bronze: #2e2619;
    --color-tint-plum: #2c2029;
    --color-on-primary: #06201b;
    --color-on-primary-disabled: #5fcbb8;
    --color-on-dark: #121514;
    --color-legal-link: #7fb0ff;
    --color-star-rating: #ecefee;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --color-primary: #3cbaa5;
  --color-primary-active: #5fcbb8;
  --color-primary-disabled: #1f3b36;
  --color-primary-error-text: #ff8f7a;
  --color-primary-error-text-hover: #ffa898;
  --color-luxe: #d9a55a;
  --color-plus: #d68cc4;
  --color-ink: #ecefee;
  --color-body: #c8cecc;
  --color-muted: #9ba4a2;
  --color-muted-soft: #6c7573;
  --color-hairline: #323837;
  --color-hairline-soft: #272c2b;
  --color-border-strong: #454c4b;
  --color-border-input: #7d8786;
  --color-canvas: #1b1f1e;
  --color-surface-soft: #121514;
  --color-surface-card: #1b1f1e;
  --color-surface-strong: #262b2a;
  --color-tint-lagoon: #15302b;
  --color-tint-bronze: #2e2619;
  --color-tint-plum: #2c2029;
  --color-on-primary: #06201b;
  --color-on-primary-disabled: #5fcbb8;
  --color-on-dark: #121514;
  --color-legal-link: #7fb0ff;
  --color-star-rating: #ecefee;
  color-scheme: dark;
}

/* Duration tokens. Tailwind v4 has no duration namespace, so expose named utilities. */
:root { --duration-fast: 120ms; --duration-base: 200ms; --duration-slow: 320ms; }
@utility duration-fast { transition-duration: var(--duration-fast); }
@utility duration-base { transition-duration: var(--duration-base); }
@utility duration-slow { transition-duration: var(--duration-slow); }

@layer base {
  html { color: var(--color-ink); background: var(--color-canvas); -webkit-font-smoothing: antialiased; }
  body { font-family: var(--font-sans); font-size: 16px; line-height: 1.5; }
  :focus-visible { outline: 2px solid var(--color-ink); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; scroll-behavior: auto !important; }
  }
}
```

The reduced-motion block in `@layer base` is a safety net, not the plan. Each component should still state its own `motion-reduce:` behavior, because "no motion" sometimes needs a different end state (see motion.md).

## Font loading

Airbnb Cereal VF is a licensed Airbnb font, so Echo does not ship it. DESIGN.md names **Inter** as the substitute. Load it with `next/font`, which self-hosts it, so no third-party requests are made and there is no layout shift:

```tsx
// src/app/layout.tsx
import { Inter, Newsreader } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", style: ["normal", "italic"] });
// <html lang="en" className={`${inter.variable} ${newsreader.variable}`} data-theme={themeFromCookie}>
```

DESIGN.md suggests tightening display line-heights by about 2% for Inter. Treat that as a later tweak: change it in DESIGN.md first, then here.

**Newsreader is for quotes only** (`font-quote` with the `text-quote-*` styles, wrapped in `QuoteText`). Never use it for headings, labels or buttons. The contrast between the serif quote and the sans interface is the point.

**Theme:** render `data-theme` on `<html>` on the server from the user's saved choice (a cookie mirrors `User.theme`), so the page never flashes the wrong theme. Leave it off for "System".

## Utility cheat sheet

| Need | Use | Not |
|---|---|---|
| Page background (app) | `bg-surface-soft`, with white panels on it. Marketing pages use `bg-canvas`. | `bg-white`, `bg-gray-50` |
| Panel / card | `bg-canvas border border-hairline-soft rounded-md` | |
| Featured panel (one per view) | `bg-tint-lagoon` | arbitrary pastels |
| Time / memory panels | `bg-tint-bronze` / `bg-tint-plum` | |
| Accent mark (dot, icon chip) | `bg-primary` / `bg-luxe` / `bg-plus`, icon on matching `bg-tint-*` | Bronze or Plum for text or buttons |
| Main text | `text-ink` | `text-black`, `text-gray-900` |
| Secondary running text | `text-body` | |
| Metadata, labels, captions | `text-muted` | `text-gray-500` |
| Disabled text | `text-muted-soft` | `opacity-50` on text |
| Dividers, card borders | `border-hairline` (`border-hairline-soft` for long lists) | `border-gray-200` |
| Input outline after focus, strong stroke | `border-border-strong` | |
| Subtle fill (hover rows, skeleton range, disabled field) | `bg-surface-soft` | |
| Icon-button fill, skeleton blocks | `bg-surface-strong` | |
| Primary action | `bg-primary text-on-primary` | |
| Inline link | `text-primary underline-offset-2 hover:underline` | `text-legal-link` |
| Error text and border | `text-primary-error-text`, `border-primary-error-text` | `text-red-600` |
| Modal backdrop | `bg-scrim/50` | `bg-black/50` |
| Float (hover card, menu, popover) | `shadow-float` | `shadow-md`, `shadow-lg` |
| Section heading | `text-display-sm` / `text-display-md` | `text-xl font-bold` |
| Page title | `text-display-lg` (detail) / `text-display-xl` (home) | |
| Body copy | `text-body-md` | `text-base` |
| Card meta | `text-body-sm text-muted` | `text-sm text-gray-500` |
| Field label | `text-caption text-muted` | |
| Input outline | `border-border-input` | `border-hairline` (1.4:1) |
| Quote text | `QuoteText` → `font-quote text-quote-*` | `font-serif`, `italic` on whole quotes |

Name clash to watch: the **color** `text-body` (#3f3f3f) and the **type styles** `text-body-md` and `text-body-sm` are different utilities. Combining them, as in `text-body-sm text-body`, is valid and intended.

## Spacing map

Tailwind's default `--spacing` is 4px, which matches DESIGN.md's 4px base unit. Use the numeric scale:

| DESIGN.md | px | Tailwind step | Typical use in Echo |
|---|---|---|---|
| `spacing.xxs` | 2 | `0.5` | icon-to-text nudges |
| `spacing.xs` | 4 | `1` | tight chip gaps |
| `spacing.sm` | 8 | `2` | label to input, meta rows |
| `spacing.md` | 12 | `3` | list row padding, chip padding |
| `spacing.base` | 16 | `4` | card grid gaps, mobile gutter, compact card padding |
| `spacing.lg` | 24 | `6` | card padding, dialog padding, tablet gutter |
| `spacing.xl` | 32 | `8` | gaps between groups inside a section |
| `spacing.xxl` | 48 | `12` | mobile section spacing |
| `spacing.section` | 64 | `16` | section spacing at tablet and wider |

Steps not in this table (`7`, `9`, `10`, `11`, and so on) are off-system. `2.5` (10px) and `5` (20px) appear only where DESIGN.md specifies them directly (pill and badge padding). The other exception is control heights that DESIGN.md specifies directly: buttons `h-12` (48), inputs `h-14` (56), the search bar `h-16` (64) and the top nav `h-20` (80).

## Rules

- **No raw colors in components.** That means no hex, `rgb()`, `bg-[#…]` or `text-[…]` color values. `scripts/audit_ui.py` flags them. The token block above is the only place a color literal may appear.
- **No arbitrary sizes** (`text-[15px]`, `rounded-[12px]`, `p-[13px]`) unless DESIGN.md states that exact value for that exact component. In that case, leave a comment naming the DESIGN.md component.
- **Opacity modifiers on tokens are fine** where they mean something: `bg-scrim/50`, or `bg-ink/5` for a pressed ghost button. Don't use opacity to invent new grays for text. Use `muted` or `muted-soft` instead.
- **Bronze (`luxe`) and Plum (`plus`) are accent colors for small marks.** Use them only for collection dots and icon chips on their matching tint. Never use them for buttons, links or blocks of text.
- **Layered surfaces.** App screens sit on `surface-soft`; panels are white; at most one or two featured panels per view use a tint. If everything is tinted, nothing stands out.
- **Dark mode is a token swap.** Components use only semantic tokens, so the dark block above is the whole implementation. Never write `dark:` variants with literal colors. If a component looks wrong in dark, the fix belongs in `colors-dark` in DESIGN.md.
- **`on-dark` flips in dark mode.** It is the text on `ink` fills (toasts, selected chips). Always pair `bg-ink` with `text-on-dark` or `text-canvas`, never with `text-white`.
