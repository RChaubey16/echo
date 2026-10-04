# Accessibility audit (WCAG 2.2 AA)

Spec §46, Phase 5 §5. This file records the automated checks and the manual screen-reader pass.

## Automated

`tests/e2e/a11y.spec.ts` runs `@axe-core/playwright` (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) and fails on any **serious** or **critical** violation:

| Scope | Routes |
|---|---|
| Signed out, light and dark | `/`, `/login`, a 404 |
| Signed in, light and dark, 1280px, seeded library | `/app`, `/app/echoes`, `/app/echoes/new`, `/app/echoes/:id`, `/app/echoes/:id/edit`, `/app/favorites`, `/app/collections`, `/app/collections/:id`, `/app/search` (results and no results), `/app/revisits`, `/app/settings` |
| Signed in, empty library | `/app`, `/app/echoes`, `/app/favorites`, `/app/collections`, `/app/revisits` |
| Signed in, 375px | the same signed-in routes |

Each signed-in route is also checked for exactly one `h1`. Lighthouse CI asserts an accessibility score of at least 0.95 on `/login` and `/app`.

## Manual screen-reader pass

**Status: not yet done.** It needs a person with VoiceOver (macOS/iOS) or NVDA (Windows). Record each flow below with the date, the screen reader and browser, and any issue found (with a link to its fix).

| Flow | What to check | Result |
|---|---|---|
| Sign in | The page title, the "Continue with Google" button name | — |
| Skip link | The first Tab shows "Skip to content" and moves focus into `main` | — |
| Navigation | Sidebar/tab bar landmarks are named; the current page is announced ("current page") | — |
| Quick capture | `n` opens "Add Echo"; focus lands in Quote; an empty save announces "Add the quote you want to save."; Esc asks before discarding; focus returns to the trigger | — |
| Full form | The error summary is announced and focused on a failed save; each field error is read with its field | — |
| Echo detail | The quote is read as a quotation with its attribution; Favorite reads as a toggle with its state | — |
| Tags combobox | Suggestions are announced; arrow keys move through them; Backspace removes the last chip | — |
| Add to collection | The dialog title is read; each checkbox reads its collection and state | — |
| Revisit picker | Presets read as buttons; the calendar grid reads full dates ("Thursday, April 1, 2027"); past days read as unavailable | — |
| Today's Echo | "Echo me something" announces the new quote (`aria-live`) | — |
| Toasts | "Echo saved", "Marked as reflected" are announced politely, without stealing focus | — |
| Search | The result count is announced after a search | — |
| Settings | The Name field and its error; the Theme radio group reads three options and the selected one | — |
| 404 / error | The heading is read first; "Try again" and the error ID copy button have clear names | — |
