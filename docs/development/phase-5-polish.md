# Phase 5 — Polish

**Goal:** Echo feels calm, fast and good to use on every screen size and for every user. That means finishing the design system, empty/loading/error states, WCAG 2.2 AA, dark mode, Settings, and performance tuning.

**Spec refs:** §39, §44–50, §61 (Account and Appearance sections), §66 Phase 5, §67 item 15

**Depends on:** Phase 4. Polish work can start earlier, but this phase is where it gets finished and audited.

**UI work in this phase:** use the `echo-design-system` skill (`.claude/skills/echo-design-system/`) for every section that touches the interface: this whole phase except §7's server-side items. Settle the skill's **open decisions** (dark palette, quote typeface, disabled-button contrast, input-border contrast) with the product owner at the start of the phase. Record them in `DESIGN.md` before building.

---

## 1. Design system completion

- [ ] Audit `src/components/ui` against the spec §47 list and fill the gaps:
  - Select;
  - Tabs;
  - EmptyState;
  - LoadingState / Skeleton;
  - ErrorState.
- [ ] Typography pass: quotes use Newsreader through `QuoteText` everywhere (decided; fonts already self-hosted via `next/font` since Phase 1). Check that no screen sets quote text any other way.
- [ ] Dark mode audit: the palette and tokens shipped in Phase 1 (`colors-dark` in DESIGN.md). Walk every screen in dark, and fix anything that looks wrong **in the tokens** (DESIGN.md first), never with `dark:` overrides in components.
- [ ] A component catalog page at `/app/_dev/ui`, available in dev only, for visual QA. Optional; this can be Storybook later.

## 2. Responsive design (≥320px)

- [ ] Navigation review (built in Phase 1): the sidebar, the tablet rail and the mobile bottom tab bar (Home, Library, Add, Search, Collections). Favorites, Revisits and Settings are reachable from the mobile account menu.
- [ ] On mobile, QuickCapture is a bottom sheet; the full `/app/echoes/new` form keeps its sticky Save bar above the keyboard.
- [ ] Quote text sizes come from the quote tokens (`quote-card` on mobile, `quote-hero` from tablet), and long words wrap (`overflow-wrap: anywhere`).
- [ ] Dialogs become bottom sheets on small screens.
- [ ] Touch targets are at least 44×44 px. The 24×24 minimum in WCAG 2.2 SC 2.5.8 is the floor.
- [ ] Test at these widths, which are the `DESIGN.md` breakpoints used in the skill's validation checklist: 320, 375, 744, 1128 and 1440 px.

## 3. Empty, loading & error states

- [ ] Empty states use the exact copy from spec §49 for the library, favorites and collections. Also add empty states for:
  - search with no results (with a suggestion to try other words);
  - an empty collection;
  - no Revisits.
- [ ] `loading.tsx` skeletons for each route segment, shaped like the spec §50 quote skeleton. Avoid spinners except inside buttons.
- [ ] `error.tsx` in every route group, with a friendly message, a "Try again" button, and an error ID for support.
- [ ] `not-found.tsx` for missing Echoes and collections.
- [ ] The client API wrapper maps error codes to friendly copy. Technical details go to the console and logger only.

## 4. Optimistic UI (spec §44)

- [ ] These actions update the UI optimistically and roll back with a toast on failure:
  - Favorite toggle;
  - adding or removing a tag;
  - adding or removing a collection;
  - marking a Revisit complete.
- [ ] Save Echo: disable the button and show a pending state, then navigate. Don't fake the ID. Echo uses UUIDs from the server.
- [ ] Use React 19 `useOptimistic` / `useTransition`, or TanStack Query if client caching becomes necessary. Choose one and document it.

## 5. Accessibility — WCAG 2.2 AA (spec §46)

- [ ] Semantic landmarks (`header`, `nav`, `main`) and a "Skip to content" link.
- [ ] One `h1` per page and a correct heading hierarchy.
- [ ] Visible focus rings. Focus is never hidden under sticky headers (SC 2.4.11).
- [ ] Everything works with the keyboard, including the combobox, dialogs, the dropdown and the Revisit picker.
- [ ] Icon-only buttons have an `aria-label`. Toggle buttons use `aria-pressed`.
- [ ] Form errors are announced: `aria-invalid`, `aria-describedby`, and an error summary on submit.
- [ ] Contrast:
  - 4.5:1 for text and 3:1 for UI elements;
  - checked in **both** themes.
- [ ] `prefers-reduced-motion` disables the fade and slide transitions.
- [ ] Toasts are announced through `aria-live="polite"`.
- [ ] Automated: run `@axe-core/playwright` on every main route in the E2E suite.
- [ ] Manual: VoiceOver or NVDA pass through the main flows. Record the results in `docs/development/a11y-audit.md`.

## 6. Settings — `/app/settings` (partial)

- [ ] **Account:**
  - name (editable);
  - email (read-only, from Google);
  - profile image (from Google, read-only). Avatar upload is deferred until S3 is available.
- [ ] **Appearance:** Light / Dark / System.
  - Stored in `User.theme` and mirrored in the theme cookie the root layout already reads (Phase 1), so the server renders the right theme and there is no flash on load.
- [ ] **Privacy:** a static explanation of what Echo stores, that the content is never public, and that analytics never include quote text.
- [ ] **Notifications:** hidden, or shown as "Coming soon". The MVP has no notifications.
- [ ] **Data:** placeholders for Export and Delete account. These are implemented in Phase 6.

## 7. Performance (spec §44)

**Targets**

- Initial load: < 2.5 s, measured as LCP.
- Search: < 500 ms p95.
- Interactions should feel immediate.

**Tasks**

- [ ] Use Server Components by default. Mark a component `"use client"` only when it needs interactivity.
- [ ] Check bundle size with `@next/bundle-analyzer`. Keep the first-load JS of `/app` small.
- [ ] Home: fetch all sections in parallel, and stream them with `Suspense`.
- [ ] Prisma:
  - select only the needed fields in list queries (no `include` of full relations);
  - check that the connection pooling settings suit serverless.
- [ ] Co-locate regions: the Vercel function region matches the Supabase region.
- [ ] Lighthouse CI or Vercel Speed Insights on the preview, with budget assertions on `/login` and `/app`.
- [ ] Set `Cache-Control: private, no-store` on every authenticated API response, so user content is never cached by a CDN.

## Tests in this phase

- [ ] axe checks pass on every route (E2E).
- [ ] Playwright runs at a mobile viewport (iPhone SE, 320–375 px) for the critical flows.
- [ ] Visual snapshot tests for QuoteCard in its variants and both themes. Optional, but cheap.
- [ ] A Lighthouse performance budget runs in CI.

## Exit criteria

- [ ] Running the full `echo-design-system` validation checklist across every route finds no open issues.
- [ ] Spec §67 item 15 (comfortable on mobile) is met, validated by hand on a real phone.
- [ ] Zero serious or critical axe violations, and the manual screen-reader pass is recorded.
- [ ] Every main section has an empty, a loading and an error state.
- [ ] Dark mode has no flash on load and meets contrast in both themes.
- [ ] LCP is under 2.5 s on the prod-like preview.
