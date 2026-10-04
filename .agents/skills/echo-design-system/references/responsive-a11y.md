# Responsive design and accessibility

Echo has to work comfortably from a 320px phone to a 1440px+ monitor (spec §45), and meet **WCAG 2.2 AA** (spec §46). Build both in from the first line of code. Retrofitting them later costs twice as much.

## Contents

1. [Breakpoints](#breakpoints)
2. [Mobile-first rules](#mobile-first-rules)
3. [Per-breakpoint layout](#per-breakpoint-layout)
4. [Accessibility rules for Echo](#accessibility-rules-for-echo)
5. [Contrast reference](#contrast-reference)

## Breakpoints

These come from DESIGN.md › Responsive Behavior and are defined in `tokens.md`.

| Name | Width | Tailwind prefix |
|---|---|---|
| Mobile | < 744px | (none: the base styles) |
| Tablet | 744–1127px | `tablet:` |
| Desktop | 1128–1439px | `desktop:` |
| Wide | ≥ 1440px | `wide:` |

Tailwind's default `sm`, `md`, `lg` and `xl` prefixes are **reset and unavailable**. If you see them in code, it is drift, so replace them.

## Mobile-first rules

- **Write the 320px layout first, unprefixed,** then layer `tablet:`, `desktop:` and `wide:` on top. Check 320px on every screen, because it is where layouts actually break.
- **Reduce columns, never reflow rows into something new** (DESIGN.md › Collapsing Strategy).
- **The mobile experience is designed, not compressed** (spec §45). Bottom navigation, sticky action bars, sheets instead of centered dialogs, and full-screen search are separate patterns, not squeezed desktop ones.
- **Prevent horizontal scroll.** Any flex or grid child holding text gets `min-w-0`. Quotes get `[overflow-wrap:anywhere]`. Only tables and code may scroll sideways, each inside its own `overflow-x-auto` container.
- **Use touch targets of at least 44×44px.** For visually smaller controls (32px icon circles, chips), extend the hit area with a pseudo-element or padding. WCAG 2.2 SC 2.5.8 sets a floor of 24px; Echo's standard is 44.
- **Respect safe areas.** Fixed bottom bars add `pb-[env(safe-area-inset-bottom)]`, and sticky headers add the top inset.
- **Mobile inputs use `text-body-md` (16px).** Below 16px, iOS Safari zooms in when an input gets focus.
- Never disable zoom in the viewport meta.

## Per-breakpoint layout

| Element | Mobile | Tablet | Desktop / Wide |
|---|---|---|---|
| Navigation | BottomTabBar, plus a 64px header with the logo and avatar | 96px sidebar rail with labelled icons | 256px sidebar (collapsible to the rail) |
| Gutter | 16px (`px-4`) | 24px (`px-6`) | 32px (`px-8`), content capped at `max-w-7xl` |
| QuoteCard grid | 1 column | 2 columns | 3 columns |
| Section spacing | 48px | 64px | 64px |
| Dialogs | Bottom sheet | Centered, `max-w-md` | Centered |
| EchoForm actions | Sticky bottom bar | Inline, end-aligned | Inline |
| Echo detail actions | Sticky bottom bar of labelled icon buttons | Inline row | Inline row |
| Search | Full search page opened from the tab bar | Rail item | Field in the sidebar |
| Today's Echo quote | `text-display-lg` (22px) | `text-display-xl` (28px) | `text-display-xl` |

## Accessibility rules for Echo

### Structure

- Each layout has the landmarks `header`, `nav` (with an `aria-label` when there is more than one), `main` (`id="main"`) and `footer`. The first focusable element is a "Skip to content" link.
- Each page has exactly one `h1`, and heading levels are never skipped. Section headings on Home are `h2`.
- Quotes are `figure > blockquote + figcaption`. Lists of Echoes are `ul > li > article`.
- Use real `<button>` and `<a>` elements: links navigate, buttons act. Never put `onClick` on a `div` or `span`.

### Keyboard

- Every interaction works by keyboard alone: tab order follows visual order, and there is no keyboard trap except inside open dialogs, which trap focus intentionally.
- **Focus is always visible:** the global 2px ink outline with a 2px offset, or a component's documented focus style. Focus is never hidden under the sticky header or bottom bar (SC 2.4.11), so set `scroll-padding-top` and `scroll-padding-bottom` on `html` to match the bar heights.
- **Shortcuts** (`n` for a new Echo, `/` for search) are ignored while typing in a field, and are listed in the Settings help.
- **Focus moves deliberately:**
  - opening a dialog focuses its first field, or Cancel for destructive dialogs;
  - closing a dialog returns focus to its trigger;
  - after a route change, focus moves to the `h1`;
  - a failed form submission focuses the error summary.

### Names, roles, states

- Icon-only buttons need an `aria-label`, which is a required prop in the component types. Decorative icons are `aria-hidden="true"`.
- Toggles use `aria-pressed` (favorite), disclosures `aria-expanded`, and the current navigation item `aria-current="page"`.
- Async regions (search result count, toasts, the Today's Echo swap) use `aria-live="polite"`. Use `assertive` only for blocking errors.
- Relative dates need full context for screen readers: `<time dateTime="2025-11-02" title="November 2, 2025">11 months ago</time>`.

### Forms

- Every field has a visible label. Placeholders are examples only.
- Required fields are marked in text, never by color alone (the quote is the only required field).
- Errors appear next to the field, are linked with `aria-describedby`, and are marked with `aria-invalid`. Their text says how to fix the problem.
- Don't clear user input after a failed submission, and never lose a draft quote. On the Add Echo page, warn before navigating away when the quote field is filled in.

### Color and motion

- Never communicate state with color alone. The heart is filled *and* has a pressed label. Errors have an icon *and* text.
- Contrast must meet 4.5:1 for text and 3:1 for UI components and focus indicators. Pairs to watch are listed below.
- Respect `prefers-reduced-motion` (see `motion.md`).

## Contrast reference

These ratios were checked against DESIGN.md values. Run `scripts/contrast.py` to recheck after any token change.

| Pair | Light | Dark | Verdict |
|---|---|---|---|
| `ink` on `canvas` | 14.1:1 | 13.7:1 | ✓ any text |
| `body` on `canvas` | 9.8:1 | 10.1:1 | ✓ any text |
| `muted` on `canvas` | 6.0:1 | 5.8:1 | ✓ text |
| `muted` on `surface-soft` / `surface-strong` | 5.5 / 4.9:1 | 6.3 / 5.1:1 | ✓ text |
| `muted` on `tint-moss` / `tint-ochre` / `tint-heather` | 5.4 / 5.4 / 5.3:1 | 5.1 / 5.3 / 5.4:1 | ✓ text |
| `primary` on `canvas` (links, focus ring) | 8.5:1 | 8.6:1 | ✓ links |
| `on-primary` on `primary` | 8.5:1 | 8.5:1 | ✓ button labels |
| `on-error` on `error` / `error` on `canvas` | 6.4 / 6.4:1 | 8.1 / 7.6:1 | ✓ danger button, error text |
| `canvas` on `ink` | 14.1:1 | 13.7:1 | ✓ toast, selected chip |
| `muted-soft` on `canvas` | 3.0:1 | 2.9:1 | ✗ for text: disabled text only (WCAG exempts it) |
| `muted-soft` on `primary-disabled` | 2.3:1 | 2.2:1 | disabled CTA label (exempt) |
| `hairline` on `canvas` | 1.4:1 | 1.3:1 | decorative dividers only |
| `border-input` on `canvas` / `surface-soft` | 3.7 / 3.4:1 | 3.9 / 4.3:1 | ✓ input boundary (SC 1.4.11) |

Check both themes after any token change: `python3 scripts/contrast.py` and `python3 scripts/contrast.py --theme dark`.
