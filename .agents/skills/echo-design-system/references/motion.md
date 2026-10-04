# Motion and interaction

Echo's motion should feel like turning a page: brief, soft, and always explaining what just happened. If an animation doesn't show cause and effect, continuity, or a change of state, leave it out.

## Contents

1. [Tokens](#tokens)
2. [Principles](#principles)
3. [Interaction recipes](#interaction-recipes)
4. [Page and route transitions](#page-and-route-transitions)
5. [Reduced motion](#reduced-motion)
6. [What not to animate](#what-not-to-animate)
7. [Implementation notes](#implementation-notes)

## Tokens

All tokens are defined in `tokens.md`.

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 150ms | Hover, press feedback, color and border changes, chip toggles |
| `duration-base` | 200ms | Dialogs, menus and toasts entering, fades, small movements (≤8px) |
| `duration-slow` | 250ms | The Echo me something swap, the mobile sheet, the heart pop |
| `ease-out-soft` | `cubic-bezier(0.2, 0, 0, 1)` | Anything **entering** or arriving: it decelerates into place |
| `ease-in-soft` | `cubic-bezier(0.4, 0, 1, 1)` | Anything **leaving**: it accelerates away |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes in place (hover, color, shadow) |
| linear | — | Only for constant-rate progress (spinner rotation, progress bars) |

Exits run faster than entrances: a dialog enters in 200–250ms and leaves in 150ms. The user has already decided to leave, so don't make them wait for it.

These are the only durations. If something seems to need 500ms or more, it is probably decoration, so reconsider it.

## Principles

1. **Feedback within one frame.** Pressing a control changes something on the next frame, even if the result comes later: a pressed state, a spinner, or an optimistic update. Don't put a delay before feedback.
2. **Animate opacity and transform only.** They run on the compositor. Animating `width`, `height`, `top`, `margin` or `box-shadow` on large elements causes layout work and jank. For card hovers, the shadow transition is acceptable because the cards are small and few, but don't extend it to layout properties.
3. **Small distances.** Entrance translations are 4–8px. Elements arrive from where they come from: sheets from the bottom, menus from their trigger (use `origin-top` or `origin-top-right` plus a scale of 0.98→1).
4. **One moving thing at a time.** Don't stagger list items on every render. A list may fade in once when its data first loads, but not again on filter or sort.
5. **Never block the user.** Navigation, saving and typing never wait for an animation to finish. Interrupting an animation (clicking again or navigating away) must leave the UI correct.
6. **Consistent vocabulary.** The same kind of change always animates the same way everywhere. That is why the recipes below exist; use them instead of inventing new ones.

## Interaction recipes

| Interaction | Recipe |
|---|---|
| **Button hover/press** | `transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-hover active:bg-primary-active active:scale-98`. Secondary buttons: `hover:bg-surface-soft active:bg-surface-strong`. |
| **Card hover** | `transition-colors duration-fast ease-standard hover:border-border-input`. Cards never lift and never gain a shadow on hover. |
| **Focus** | Instant. Never animate the focus ring, because a fading ring can be missed. |
| **Favorite (heart)** | On save: fill with `text-primary`, plus `animate-heart-pop` (250ms, scale 1→1.2→1). On unsave: a 150ms color change only, with no pop. Removing should feel quieter than adding. |
| **Tag chip added** | `animate-fade-in` on the new chip. On removal, remove it instantly. Animating removal shifts the chips around while the user is still typing. |
| **Toast** | Enter: `animate-rise-in` from the bottom. Exit: opacity to 0 over 150ms with `ease-in-soft`. On mobile, it sits above the tab bar. |
| **Dialog** | The backdrop runs `animate-fade-in` while the panel runs `animate-rise-in` (desktop) or slides up from `translate-y-full` (mobile sheet) at 250ms with `ease-out-soft`. Exit takes 150ms with `ease-in-soft`. |
| **Menu/popover** | `animate-menu-in` (200ms: opacity 0→1 and scale 0.98→1), with `origin-top-left` or `origin-top-right` matching the trigger. Exit takes 150ms. With reduced motion, use `motion-reduce:animate-fade-in`. |
| **"More details" disclosure** | Animate the content's opacity and a 4px translate. Animate height only with `grid-template-rows: 0fr → 1fr`, which doesn't require measuring and stays on the compositor-friendly path. On reduced motion, open instantly. |
| **Echo me something / Today's Echo swap** | Keep the container's minimum height. The old quote fades out (150ms, `ease-in-soft`), then the new one fades in with a 4px rise (250ms, `ease-out-soft`), while the container eases its height so a long passage never makes the page jump. Announce it with `aria-live="polite"` on the quote region. If the next Echo is still loading, keep the old one visible at reduced opacity rather than showing a skeleton for a short wait. |
| **Optimistic save/delete** | Apply the change immediately. If it fails, revert with the same transition, then show an error toast. Never animate a failure as a success. |
| **Skeleton** | `animate-skeleton` (an opacity pulse of 1→0.55 every 1.6s). Don't use a moving shimmer gradient, which is busier and harder on battery. |
| **Loading button** | The spinner fades in after 150ms. Fast saves then never flash a spinner. |
| **Copy-to-clipboard** | Swap the icon to a check for 1.5s with a 150ms cross-fade, and set the label to "Copied" in a live region. |
| **Logo (the one decorative moment)** | Inside a `group/logo` link, the mark's two waves ripple outward once on hover or keyboard focus: `animate-echo-wave` (opacity 0.1 → their own, 250ms), the outer wave 100ms after the inner. Off under reduced motion. |
| **Home sections arriving** | Each streamed section rises in once (`animate-rise-in`), 40ms apart (`[animation-delay:40ms]` … `160ms`). Sections only, never the items inside them. |
| **Echo me something icon** | The shuffle icon turns half a turn per press (`transition-transform duration-slow`), so the button answers before the new Echo lands. |
| **Mobile tab bar** | The active tab's pill settles in (`animate-pill-in`: opacity plus `scaleX(0.6 → 1)`, 200ms) each time a tab becomes current. |
| **Mark as reflected** | The check pops (`animate-heart-pop`) when it flips to "Reflected". |
| **Dialog / toast exits** | Dialogs sink out (`animate-sink-out`, 150ms) and toasts fade out (`animate-fade-out`, 150ms) before they leave; focus returns once the dialog has gone. Reopening mid-exit cancels it. |

## Page and route transitions

- The default is **no route transition**. A fast, stable page beats an animated one. `loading.tsx` skeletons already provide continuity.
- When a transition clearly helps, such as going from a QuoteCard to its detail page, you may use the View Transitions API to cross-fade the shared quote. Only do this if the project's Next.js version supports it in a stable form; check `node_modules/next/dist/docs/` before relying on it. Keep it under `duration-slow`, and keep it optional: it must work as a plain navigation where the API isn't available.
- New content within a route (a section streamed in with Suspense) can use `animate-fade-in` once. Never fade the whole page on every navigation.

## Reduced motion

`prefers-reduced-motion: reduce` means *remove movement*, not *remove feedback*. Every change
becomes a 150ms opacity or colour change.

`globals.css` does most of it:
- `--duration-fast`, `--duration-base` and `--duration-slow` all become 150ms.
- `--animate-rise-in`, `--animate-menu-in` and `--animate-fade-in` all become a 150ms fade.
- `--animate-heart-pop` and `--animate-skeleton` become `none`.
- Transitions may only change opacity and colours: `transition-property` is limited to them, so
  transforms, heights and grid rows snap.

Still write the `motion-reduce:` end state on a component when it differs:

| Normal | Reduced |
|---|---|
| Rise in, slide up, menu scale-in | 150ms fade (`motion-reduce:animate-fade-in`) |
| Heart pop | Colour fill only |
| Today's Echo swap | The old quote dims while loading, then the new one fades in over 150ms; the live region still announces it |
| Skeleton pulse | A static block (`motion-reduce:animate-none`) |
| Press scale | No scale (`motion-reduce:active:scale-100`); the colour change remains |
| "More details" disclosure | Opens at once, and the fields fade in (`motion-reduce:transition-opacity`) |

## What not to animate

- Infinite or ambient decoration: floating shapes, breathing gradients, parallax.
- Typing, and the text of quotes themselves: no typewriter effects, no word-by-word reveals. The words are the content and should be readable at once.
- Counters ticking up ("You have 24 Echoes" counting from 0).
- Every list item on every render.
- Scroll-jacking, scroll-triggered reveals on app screens, and anything that requires GSAP or a new animation library. Ask before adding a dependency.
- Layout properties, and `transition-all`, which also animates properties you didn't intend to.

## Implementation notes

- Prefer CSS (Tailwind `transition-*`, `animate-*` and `motion-reduce:` utilities). Use JS only to sequence a swap, by toggling a state that changes classes.
- Animate React mount and unmount for dialogs, sheets and toasts through the primitive (Radix's `data-state="open|closed"` with `data-[state=closed]:` utilities) instead of a hand-written timeout.
- With React 19, `useOptimistic` and `useTransition` give you pending states. Show the pending UI from the `isPending` flag; don't fake it with `setTimeout`.
- For an idea from `ui-ux-pro-max` (`--domain ux` "animation", or a `gsap` preset), translate it into these tokens and recipes. Don't import its values or libraries.
