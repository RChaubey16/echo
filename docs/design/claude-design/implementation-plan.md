# Inkwell redesign: implementation plan

The design is in `export/`; its handoff notes (rationale and migration) are in
`export/Echo Handoff Notes.dc.html`. Ignore `export/_ds/modernist-*`: it's the seed theme Claude
Design started from, not part of Echo.

## Decisions (2026-10-04)

1. **Product changes from the handoff: all accepted.**
   - Upcoming Revisits rows get Change and Cancel.
   - The mobile Library filter shows 3 tags plus "More tags".
   - The Quick Capture footer shows the hint "Only the words are needed.", and Save stays disabled
     until there's a quote.
   - Settings gets an in-page section list on desktop.
2. **Today's Echo uses a new `quote-today` token:** 44px at desktop, 26px on mobile. `quote-hero`
   (38px) stays for Echo detail.
3. **The Library keeps the CSS-columns masonry.** The visual order runs down each column; the DOM
   order stays the sorted order.
4. **Recolor the logo, favicon, apple-icon, OG image and `theme-color`** to Inkwell.
5. **The export is committed as reference** (without the zip).
6. **Collections keep the stored `lagoon | bronze | plum | neutral` values**, shown in the UI as
   moss, ochre, heather and neutral. No database migration.
7. **The theme switch keeps the current mechanism.** No `data-theme` attribute means System,
   handled with `prefers-color-scheme`. The export's `data-theme="system"` is not adopted.

## PR 1: tokens and docs

- `src/app/globals.css`:
  - Inkwell light and dark tokens.
  - Radius 2/4/6/10/full.
  - `shadow-1`.
  - Motion tokens, with a reduced-motion fallback.
  - Paper grain on the body.
  - The `user-text` utility.
  - The type scale, including `quote-display` and `quote-today`.
- Fonts in `src/app/layout.tsx`: Hanken Grotesk and EB Garamond via `next/font`.
- Rename old tokens across `src/`:
  - `tint-lagoon/bronze/plum` → `tint-moss/ochre/heather`
  - `luxe/plus` → `mark-ochre/heather`
  - `primary-error-text` → `error`
  - `on-dark` → `canvas` (for inverted surfaces)
- Remove unused tokens: `legal-link`, `star-rating`, `surface-card`, `border-strong`.
- Map collection accents in `AccentDot` and the related components.
- Rewrite `DESIGN.md` and the skill references (`tokens.md`, `components.md`, `motion.md`), and
  update the inputs to `contrast.py` and `audit_ui.py`.
- Recolor the icon, apple-icon, OG image, `theme-color` and logo.

## PR 2: primitives and shell

- Restyle all of `src/components/ui/*` with every state from the component sheet.
- Inverted toast.
- Tabs with a 2px ink underline.
- Restyle the shell: sidebar, rail, mobile header, and the bottom tab bar with a neutral pill on
  the active item.

## PR 3: Echo components and screens

- Today's Echo: a two-column layout at ≥1128px, with "You wrote" as a margin note.
- QuoteCard: a footer row with the collection and the heart.
- CollectionCard: a 4px accent bar along the top.
- Library masonry.
- Quote textarea in `font-quote`.
- Search highlights with `<mark>` on `tint-ochre` plus an underline, built from split plain text
  (no HTML injection).
- The four accepted product changes.
- Every screen checked against its mockup at 390, 900 and 1440px, in light and dark.

## Checks for every PR

- `pnpm typecheck`, `pnpm lint`, `pnpm audit:ui`.
- `contrast.py` in both themes.
- `pnpm test`.
- `pnpm test:e2e`, including axe.
- Manual screenshots compared against the export.
