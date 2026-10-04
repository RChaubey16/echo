export const THEME_COOKIE = "echo-theme";

export type Theme = "light" | "dark";

/**
 * Reads a saved theme choice; anything else means "follow the system setting".
 *
 * @param value - The raw cookie or column value, if any.
 * @returns The saved theme, or undefined for System.
 */
export function parseTheme(value: string | null | undefined): Theme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}

/**
 * Builds the `document.cookie` string that remembers a theme choice in this browser.
 *
 * The root layout reads this cookie on the server, so the next page renders in the right theme
 * without a flash. System clears the cookie.
 *
 * @param theme - The saved theme, or undefined for System.
 * @returns A cookie assignment string for `document.cookie`.
 */
export function themeCookie(theme: Theme | undefined): string {
  return theme
    ? `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`
    : `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

/**
 * Switches this page to a theme straight away and remembers it in the theme cookie. Browser only.
 *
 * @param theme - The saved theme, or undefined to follow the system setting.
 * @returns Nothing.
 */
export function applyTheme(theme: Theme | undefined): void {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  document.cookie = themeCookie(theme);
}

/**
 * Reads the theme saved in this browser's cookie. Browser only.
 *
 * @returns The saved theme, or undefined for System.
 */
export function readThemeCookie(): Theme | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=([^;]*)`));
  return parseTheme(match?.[1]);
}
