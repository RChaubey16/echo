# Validating UI work

Run these checks before calling UI work done. They are ordered from cheapest to most expensive. If a check doesn't apply (no app running yet, no Playwright installed), say so in your summary instead of skipping it silently.

## 1. Static checks (always)

Run from the project root:

```bash
pnpm typecheck && pnpm lint
python3 .agents/skills/echo-design-system/scripts/audit_ui.py src        # design drift + a11y slips
python3 .agents/skills/echo-design-system/scripts/contrast.py            # only if you touched tokens or color pairs
python3 .agents/skills/echo-design-system/scripts/contrast.py --theme dark
```

- **Errors from `audit_ui.py`** must be fixed. The only alternative is a deliberate, justified exception marked `audit-ignore` with a reason in the line comment.
- **Warnings** must be looked at. Each one is either fixed or understood (for example, `outline-none` on an input that has a documented focus style on the same element).
- **`contrast.py`**: run it for both themes (`--theme dark`). The only known failure is `legal-link`, which Echo doesn't use. Any other FAIL is new and needs fixing.

## 2. State review (always)

Go through the state matrix in `components.md` for each component you created or changed, and confirm that each state exists in code:

- default, hover (pointer only), focus-visible, active, disabled, loading;
- for data views: empty (with the spec copy), loading skeleton (shaped like the content), error (with retry), and long content (a 1,000-character quote, a 60-character unbroken word, a missing author or source).

Check the long-content cases explicitly. They are the most common way Echo cards break.

## 3. Run it and look (when the app can run)

Use the project's `run` skill, or `pnpm dev`, then look at the change at these widths: **320, 375, 744, 1128 and 1440px**. With Playwright available, a quick script does all five:

```ts
// scratch script, not committed
import { chromium } from "@playwright/test";
const widths = [320, 375, 744, 1128, 1440];
const browser = await chromium.launch();
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto("http://localhost:3000/app"); // the route you changed; authenticate first if needed
  await page.screenshot({ path: `shot-${w}.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) console.log(`horizontal overflow at ${w}px`);
}
await browser.close();
```

Read the screenshots back, and check that:

- there is no horizontal scroll, and nothing clipped or overlapping;
- the bottom bar and sticky header don't cover content or focus;
- the quote is the strongest element on the screen, and there are only one or two Lagoon moments;
- spacing follows the rhythm: 16px between cards, 48–64px between sections;
- the layout at 320px looks designed, not squeezed.

## 4. Keyboard and screen reader pass (new screens and interactive components)

- Tab through the whole screen. The order matches the visual order, every stop shows a visible focus ring, and no focus is hidden under sticky bars.
- Operate every control with Enter or Space. Esc closes dialogs and menus. Arrow keys work in menus, the combobox and the calendar grid.
- Opening and closing a dialog moves focus in and returns it to the trigger.
- The accessible names make sense out of context ("Remove from favorites", not "button").
- If `@axe-core/playwright` is installed (Phase 5), run it on the route and fix every serious or critical issue:

```ts
import AxeBuilder from "@axe-core/playwright";
const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
console.log(results.violations.map(v => `${v.impact} ${v.id}: ${v.nodes.length}`));
```

## 5. Motion check (if you added or changed motion)

- Emulate reduced motion with `page.emulateMedia({ reducedMotion: "reduce" })` in Playwright, or the DevTools Rendering panel. Nothing moves, but state changes are still visible and announced.
- Click a control repeatedly. Animations restart or settle cleanly, and the UI never ends up in the wrong state.
- Throttle the network to a slow 3G profile and save an Echo. Feedback is immediate (pressed or pending state), and nothing waits for an animation.
- Only `opacity` and `transform` animate, with the motion tokens (`duration-fast`, `duration-base`, `duration-slow`, `ease-out-soft`, `ease-in-soft`, `ease-standard`).

## 6. Consistency check (always)

- **Reuse:** did you use an existing component wherever one fits, and did any new pattern become a component or variant rather than a one-off?
- **Tokens:** every color, size, radius and shadow traces back to DESIGN.md. If you needed a new value, it was proposed, added to DESIGN.md, and then added to `@theme`.
- **Copy:** labels describe exactly what happens, the empty-state copy matches the spec, and there are no exclamation marks.
- **Repo rules:** TSDoc on new utility functions, no logging of quote or reflection text, and user content never rendered as HTML.

## Reporting

End your summary with a short validation note, for example:

> Validated: typecheck/lint clean; audit_ui: 0 errors, 1 accepted warning (outline-none on Input with inset focus outline); screenshots at 320–1440 checked, no overflow; keyboard pass OK; reduced motion checked. Not run: axe (not installed yet).
