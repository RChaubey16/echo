/**
 * Escapes LIKE/ILIKE wildcards so user input matches literally.
 *
 * Backslash is Postgres's default LIKE escape character, so it is escaped first.
 *
 * @param input - The raw text to search for.
 * @returns The text with `\`, `%` and `_` escaped.
 */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Builds an ILIKE pattern that matches the input anywhere in a value.
 *
 * @param input - The raw text to search for.
 * @returns The escaped pattern wrapped in `%`.
 */
export function containsPattern(input: string): string {
  return `%${escapeLike(input)}%`;
}
