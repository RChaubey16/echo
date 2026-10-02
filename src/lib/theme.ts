export const THEME_COOKIE = "echo-theme";

export type Theme = "light" | "dark";

/**
 * Reads a saved theme choice; anything else means "follow the system setting".
 *
 * @param value - The raw cookie value, if any.
 * @returns The saved theme, or undefined for System.
 */
export function parseTheme(value: string | undefined): Theme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}
