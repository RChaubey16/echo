/**
 * Joins class names, skipping falsy values.
 *
 * @param classes - Class names, or falsy values to skip.
 * @returns The joined class string.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
