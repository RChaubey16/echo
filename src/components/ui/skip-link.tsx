/** The first focusable element on every page: jumps keyboard users past the navigation. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-3 focus:text-canvas"
    >
      Skip to content
    </a>
  );
}
