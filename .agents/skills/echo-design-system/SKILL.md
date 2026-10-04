---
name: echo-design-system
description: The primary design and UI implementation skill for the Echo app (the private quote & reflection library). Use it for ANY user-facing work in Echo, such as building, editing, styling or polishing a page, component, layout, form, dialog, navigation, card, empty/loading/error state, Tailwind classes, colors, typography, spacing, responsive behavior, accessibility, hover/focus states, transitions or micro-interactions. Use it even when the request doesn't say "design", e.g. "add the favorites page", "make the home page nicer", "the save button feels laggy", "fix the mobile layout", "build the QuoteCard". Also use it to review UI code or screenshots for consistency. It sets Echo's design language from DESIGN.md and brings in the ui-ux-pro-max skill for UX research, interaction patterns and polish.
---

# Echo Design System

Echo is a calm, private library of quotes and personal reflections ("Words worth coming back to"). Every screen should feel quiet, focused and well made. The user's words are the content. The UI exists to frame them, never to compete with them.

This skill makes UI work in Echo consistent. It tells you where the design decisions live, how to apply them, when to bring in `ui-ux-pro-max`, and how to check your work before you call it done.

## Sources of truth (in priority order)

1. **The user's explicit instruction** in this conversation.
2. **`DESIGN.md`** (project root): all visual tokens, i.e. colors, type scale, radii, spacing, the single shadow, and component specs. Read its YAML frontmatter at the start of any UI task, because it may have changed since this skill was written.
3. **This skill's references.** They translate DESIGN.md into Echo's own components and add motion and state rules:
   - `references/tokens.md`: how DESIGN.md maps to Tailwind v4 `@theme` tokens and utility classes. Read it before writing any styles.
   - `references/components.md`: Echo's component inventory, how each one is built from DESIGN.md specs, required states, and copy. Read it before creating or changing a component.
   - `references/motion.md`: motion tokens, interaction recipes and reduced-motion rules. Read it when adding any transition, animation or interactive feedback.
   - `references/responsive-a11y.md`: breakpoints, the mobile layout and the WCAG 2.2 AA rules as they apply to Echo. Read it for layout or navigation work, and for every new screen.
   - `references/validation.md`: the checks to run before you finish. Always read it at the end.
4. **Existing code in `src/components/`.** Follow its patterns, unless they contradict 1–3. In that case, fix the drift or flag it; don't copy it.
5. **`ui-ux-pro-max`.** It supplies research and patterns that fill gaps. It never overrides 1–4.
6. **Your own taste**, for whatever is still undecided.

Product behavior (routes, features, copy, flows) comes from `docs/echo-techincal-prod-spec.md` and the phase files in `docs/development/`. DESIGN.md decides how things look. The spec decides what exists.

### Inkwell and the Claude Design export

DESIGN.md describes **Inkwell**: cream paper, warm ink, one iron-gall blue accent, EB Garamond for quotes and Hanken Grotesk for the interface. It was designed in Claude Design. The export in `docs/design/claude-design/export/` has every screen at 390, 900 and 1440px, with a light/dark switch on each file, plus the component sheet with every state (`Echo Design System.dc.html`). Use it as the visual reference for a screen or component. `docs/design/claude-design/implementation-plan.md` records the decisions and the structural changes. Ignore `export/_ds/modernist-*`: it is the seed theme Claude Design started from, not part of Echo.

## Echo's design principles

These come from the product spec. Use them to decide anything the tokens don't cover.

- **The words are the hero.** On any screen showing an Echo, the quote has the strongest typographic presence. Chrome (nav, metadata, buttons) is quieter: ink and muted grays, small type, plenty of whitespace.
- **One or two accent moments per view.** `primary` (iron-gall blue) marks the main action, links, the favorite-on state and the focus ring. Spread it across many elements and it stops meaning anything. App screens sit on `bg-paper` with canvas panels; Revisits and From the past use their pale tints (see `tokens.md`).
- **Calm, not a feed.** Home and list screens are capped, sectioned and finite. Don't add infinite scroll, auto-playing content, badges that nag, streaks or attention bait.
- **Saving takes seconds.** Every extra field, step or confirmation in the capture flow has a cost. Only the quote is required; everything else goes behind progressive disclosure.
- **Private and quiet.** No social metaphors (likes, followers, share counts). Sharing, when it exists, is a deliberate action.
- **Paper, not app.** Corners are like cut card stock (4/6/10; circles only for icon buttons and dots), surfaces are separated by hairlines and tone, and the single shadow is reserved for things that float. Weights stay modest (600 for display, 400 for body). Avoid gradients, glassmorphism, neon and decorative illustration noise.

## Workflow

### 1. Inspect before you touch anything

Spend a minute getting oriented. It saves rework later.

- Read the `DESIGN.md` frontmatter for tokens.
- Read the token file (`src/app/globals.css`, the `@theme` block). If it has no tokens yet, create it first from `references/tokens.md`.
- List what exists: `ls src/components/ui src/components/echo`. Open the 1–3 components closest to what you are building.
- Look at one existing screen like yours (a list page, a detail page, a form) and match its structure: page header, max width, section spacing.
- Check the stack: `package.json` (Next.js App Router, React 19, Tailwind v4), plus any class-merge helper (`cn`) or headless primitives (Radix) already installed.

### 2. Reuse, extend, or create

Decide in this order and stop at the first answer that fits:

1. **Reuse.** An existing component already does it, maybe with different props. Use it as is.
2. **Extend.** An existing component does about 80% of it. Add a variant or prop, such as `<Button variant="pill">` or `<QuoteCard compact>`. Keep the API small and named after intent (`variant="danger"`, not `red`). Extending is the default when the need is a visual variation of something that already exists.
3. **Create.** Only when no component fits by role. Put generic primitives (no Echo domain knowledge) in `src/components/ui/`, and anything that knows about Echoes, tags, collections or revisits in `src/components/echo/`. A new component must:
   - be built only from tokens (no raw hex, no arbitrary px values that aren't on the scale);
   - implement every state in the state matrix in `references/components.md`;
   - be accessible by default: labels, roles, focus and keyboard support;
   - accept `className` for layout only (margins, grid placement), never to restyle its internals.

Before creating, ask yourself whether a second screen will need this soon. If yes, make it a component now. If you are only extracting it so one page file stays tidy, a local function in that file is fine.

Avoid one-off styling inside a page: `<div className="rounded-[14px] shadow-[...] p-6">` repeated across pages is a component waiting to be extracted. Also avoid forking: don't make a `SpecialButton` when `Button` needs a variant.

### 3. Implement

- Style only with token-backed utilities (`bg-primary`, `text-ink`, `text-muted`, `rounded-lg`, `shadow-float`, `text-body-sm`, the spacing scale). If a value isn't in the tokens, see "Changing the design system" below.
- Use semantic HTML first (`button`, `a`, `nav`, `main`, `h1–h3`, `label`, `dialog` patterns). Add ARIA only where native semantics are missing.
- Render user content as text, never as HTML. Quotes and reflections use `whitespace-pre-wrap` and `[overflow-wrap:anywhere]`.
- Build mobile-first (from 320px), then add `tablet:`, `desktop:` and `wide:` overrides (see `references/responsive-a11y.md`).
- Every interactive element gets hover (pointer devices only), focus-visible, active and disabled states, and a loading state where the action is async. Recipes are in `references/motion.md`.
- Every data-driven view ships with its empty, loading (skeleton) and error states in the same change, never as a follow-up. Copy is in `references/components.md`.
- Follow the repository rules in `CLAUDE.md`. In particular, every utility function you add (formatters, hooks, class builders) gets a TSDoc block with `@param` and `@returns`.

### 4. Bring in ui-ux-pro-max where it adds value

Use it (see the next section) when you face a UX or interaction question the references don't answer.

### 5. Validate

Read `references/validation.md` and run its checks. That includes `scripts/audit_ui.py`, which catches raw colors, missing focus styles, `transition-all` and similar drift. Don't call the UI work finished until those checks pass or you have stated clearly why one doesn't apply.

## Using ui-ux-pro-max

`ui-ux-pro-max` is a searchable database of UX guidelines, interaction patterns, stack advice and accessibility rules. The two skills divide the work:

- **echo-design-system decides *what Echo looks like*:** tokens, components, voice.
- **ui-ux-pro-max improves *how well it works*:** UX patterns, interaction quality, accessibility details, stack implementation and performance.

### When to use it

- **Designing a new screen or flow** (onboarding, the revisit picker, search results): search for the interaction pattern before building.
- **Interaction or motion you haven't done in Echo yet** (combobox, bottom sheet, optimistic toggle, drag): search for the pattern, then implement it with Echo's motion tokens.
- **Accessibility questions about a specific behavior:** one outcome per query, e.g. `"focus not obscured"`, `"error summary validation"`, `"icon button accessible label"`.
- **Next.js or React implementation concerns:** use `--stack nextjs`, `--stack react` or `--domain react` (for example, Suspense streaming or re-render cost).
- **Polish reviews:** read the relevant section of its `references/quick-reference.md` (§1 Accessibility, §2 Touch, §5 Layout, §7 Animation, §8 Forms, §9 Navigation).

Skip it for pure token or copy changes, backend work, or anything the references already answer directly.

### How to run it

Run from the project root:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<2-5 terms, one intent>" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<concern>" --stack nextjs
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<concern>" --stack html-tailwind
```

### Rules for combining the two

- **Don't run `--design-system`**, and never `--persist` (which writes a competing `design-system/*/MASTER.md`). Echo's visual direction is already decided in DESIGN.md. The only exception is when the user explicitly asks to explore a new visual direction; even then, show the result as a proposal and don't apply it.
- **Ignore color, typography and style recommendations** that conflict with DESIGN.md. Take the *principle* (for example "deceleration on enter") and express it with Echo's tokens.
- **No GSAP or new animation dependencies** without asking. Echo's motion is CSS transitions plus small keyframes (see `references/motion.md`). Treat `--domain gsap` results as ideas only.
- **`pro-rules.md` is scoped to native mobile apps.** Use the checklist items that apply to the web (contrast, touch targets, feedback, focus), and skip the safe-area and haptics specifics unless they apply.
- **Verify before applying.** Check that the result's domain, platform (Web/All) and intent match the task. If a search comes back off-topic, retry once with a narrower query. If it's still off-topic, fall back to the references and say so.
- In your summary, briefly mention any guideline from ui-ux-pro-max that changed what you built, so the user can see where the decision came from.

## Motion in one paragraph

Motion in Echo is feedback and continuity, never decoration. Use only the motion tokens: `fast` (150ms) for hover, press and color changes, `base` (200ms) for dialogs, menus, toasts and fades, and `slow` (250ms) for the Echo me something swap and the mobile sheet. Enter with `ease-out-soft`, exit faster with `ease-in-soft`. Animate only `opacity` and `transform`. Every animation has a `motion-reduce:` fallback that removes movement but keeps meaning, for example an instant swap or a plain opacity change. Full recipes are in `references/motion.md`.

## Mistakes that come up in Echo work

- **Copying the export's inline styles verbatim.** The export is plain HTML with inline styles and its own variable names (`--canvas`, `--quote`). Rebuild it with Echo's components and token utilities.
- **The accent everywhere**: colored headings, tag chips, nav state, borders and icons all in primary. Keep it for the main action, the saved/favorite state and inline links.
- **Raw values**: `#2d4a72`, `text-[15px]`, `rounded-[12px]`, `shadow-lg`. Use tokens; Tailwind's default shadows and colors are not part of Echo.
- **A second shadow tier, or shadows on everything.** There is one shadow, `shadow-float`, used on dialogs, menus, toasts and the raised Add button. Cards never get a shadow, not even on hover (their border darkens instead). Everything else is flat, separated by hairlines.
- **Truncating the user's words where they matter.** Clamping on list cards is fine (with a clear way to open the full Echo). The detail page and Today's Echo always show the full quote.
- **Placeholder-only labels, errors only as toasts, `outline-none` without a replacement focus style, icon-only buttons without `aria-label`.**
- **Spinners for page content.** Use skeletons shaped like the content (see `components.md`), and keep spinners inside buttons only.
- **Hover-only affordances.** Anything revealed on hover (card actions) must also be reachable by keyboard focus and visible on touch devices.
- **Feed patterns on Home**: infinite lists, "trending", counts that nag.
- **Motion that blocks the user**: a save that waits for an animation, a route that waits for a transition, entrance animations on every list item.
- **Hand-picking dark-mode colors.** Dark mode is the `colors-dark` token swap. If something looks wrong in dark, fix the token in DESIGN.md, not the component.

## Changing the design system

If the task needs a value or component that the tokens don't cover, such as a new color role, a new type style or a new radius:

1. Check whether an existing token works if you look at the role differently. That is usually the case.
2. If not, propose the addition to the user in one or two lines: the name, the value, and why.
3. Once approved, add it to `DESIGN.md` (frontmatter and prose), then to the `@theme` block, then use it. Keep all three in sync, so the next person doesn't have to guess which one is right.

Never add a token only in code.

## Decisions already made

These used to be open questions. They are settled in DESIGN.md; follow them and don't reopen them unless the user asks.

- **Dark mode:** Light, Dark and System are supported through `colors-dark` in DESIGN.md, a pure token swap (see `tokens.md`). Never write `dark:` variants with literal colors.
- **Quote typeface:** EB Garamond for quote text only, through `QuoteText` (`today`, `hero`, `card`, `compact`). The landing tagline is the one exception. Everything else uses Hanken Grotesk.
- **Disabled primary button:** `muted-soft` text on `primary-disabled`. Disabled controls are exempt from contrast minimums.
- **Input borders:** `border-input` (#8a7f72, 3.7:1).
- **App navigation:** a left sidebar at desktop, a labelled rail at tablet, and a bottom tab bar on mobile (see `components.md` › Navigation). The top nav is for marketing pages only.
- **Collection slots:** stored as `lagoon | bronze | plum | neutral`, and shown as moss, ochre, heather and a neutral ring through `mark-*` and `tint-*`. The database keys aren't renamed.
- **Theme switch:** `data-theme` is absent for System. The export's `data-theme="system"` is not adopted.
