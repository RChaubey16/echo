You're redesigning **Echo**, a private web app for saving the quotes that stay with you,
writing down why they mattered, and having them come back to you over time. The attached
**echo-design-system.md** is the source of truth for the product, its data, its screens and its
constraints. Read all of it before you design anything.

## What I want

A **new visual direction** for Echo: a fresh, distinctive and cohesive look that feels like a
beautifully made personal notebook or a small literary press, not a SaaS dashboard. The current
design is clean but generic, borrowing a marketplace look (teal CTAs, white cards, gray page). I
want Echo to have its own identity.

Section 6 of the attached file is the current baseline. Treat it as a reference, not a constraint.
You may change the palette, the typefaces (both must stay open-source), radii, spacing and
surfaces. You may **not** break anything in Section 5, "Non-negotiables".

## The feeling

- **Calm, literary, intimate, unhurried.** Opening Echo should feel like opening a drawer of
  letters you kept.
- **The user's words are the hero.** The quote serif carries all the emotional weight; the UI
  steps back.
- **Quiet confidence:** generous whitespace, a restrained palette, and one strong typographic
  moment per screen.
- **Warm, not cute.** No illustrations of people, no emoji, no confetti.
- Never feed-like: no infinite scroll, streaks or engagement numbers.

## Process

### Step 1: three directions

Before building screens, propose **3 distinct visual directions**. For each one, show:

- a name and one-sentence concept;
- the palette (light and dark), with the 4 collection accent slots;
- the type pairing (quote serif and UI sans), with a specimen;
- the Today's Echo panel and one quote card, rendered in that direction;
- the radius, border and surface approach.

Make the directions really different. For example, one warm paper and ink, one cool and airy
modern-editorial, and one moody and dark-first. Then **stop and let me pick** one, or mix them.

### Step 2: the design system for the chosen direction

- **Tokens** as CSS custom properties, for light and dark, using the same semantic names as the
  current baseline where they still apply:
  - `primary`, `ink`, `body`, `muted`, `hairline`, `border-input`, `canvas`, `surface-soft`,
    `surface-strong`;
  - the three tints and the accent marks;
  - `error`.
- A **type scale** that includes the three quote sizes: `quote-hero`, `quote-card`,
  `quote-compact`.
- **Radius, spacing, elevation and motion** tokens. Motion covers durations and easing, plus the
  reduced-motion fallback.
- **Contrast checks:** list every text/background pair with its ratio, for both themes. All must
  meet WCAG 2.2 AA.
- A **component sheet** with every state (default, hover, focus-visible, active, disabled,
  loading, error):
  - buttons (primary, secondary, tertiary, danger, icon);
  - text input, textarea, select;
  - TagInput, CollectionPicker, RevisitPicker (presets and calendar);
  - QuoteCard, EchoRow, CollectionCard, tag chip, accent dot, favorite heart;
  - dialog, dropdown, toast, tabs, pagination;
  - skeleton, empty state, error state;
  - sidebar, rail, mobile header and bottom tab bar.

### Step 3: the screens

Design these at **desktop (1440px)** and **mobile (390px)**, in **light and dark**. Use the sample
content from Section 8, with varied lengths, missing optional fields and the long Rilke passage.

1. **Home dashboard**, with Today's Echo as the hero. Also show the "Echo me something" swap
   (a before and after frame, plus a note on the motion), and the 0-Echoes welcome state.
2. **Echo detail**, including the first-Echo "Why did this speak to you?" prompt.
3. **Quick Capture dialog**, collapsed and with "More details" expanded. On mobile, show it as a
   bottom sheet.
4. **Library**, with sort, a tag filter and pagination.
5. **Collections** grid, and **Collection detail**.
6. **Revisits** ("Due now" and "Upcoming").
7. **Search** results, and the no-results state.
8. **Settings** (Account, Appearance, Privacy, Data, and the Delete account dialog).
9. **Landing page** and **Sign in**.

Also show the **tablet rail** (around 900px) once, on Home.

## Rules to hold throughout

- **Two typefaces only:** the serif is for quote text and nothing else, and everything else uses
  the sans.
- The brand accent is rare: primary CTAs, links and the favorite-on state. **Nav active states
  are neutral.**
- Collections always show their name next to their color, never color alone.
- Every screen works from 320px wide, with touch targets of at least 44px and visible focus rings.
- User text is plain text. Keep line breaks, and make long words and URLs wrap.
- At most one shadow tier. Get depth from type, space and surface tone.
- Everything must map cleanly to **Tailwind CSS v4** with CSS variables, Google Fonts, and a
  Lucide-style outline icon set. Don't use effects that are hard to build, such as heavy
  glassmorphism, WebGL, or textures that cost layout performance. Subtle paper grain via CSS is
  fine if it stays light.
- Use the terms Echo, Reflection, Collection, Revisit, Today's Echo and "Echo me something"
  exactly, and match the voice in Section 7.

## Deliverables at the end

1. The final token sheet as a ready-to-paste `:root { … }` plus a dark-theme block, and an
   equivalent Tailwind v4 `@theme` block.
2. The component sheet.
3. All the screens above.
4. A short **rationale**, one paragraph per decision: palette, type, shape, motion, and how
   Today's Echo earns its place as the bold moment.
5. A **migration note**: which current tokens map to which new ones, and which components change
   structure versus only style.

Ask me before making any product or feature change. This is a visual redesign, not a feature
redesign.
