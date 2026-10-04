// One collator for every name sort: `localeCompare` with options builds a new one per comparison.
const nameCollator = new Intl.Collator("en", { sensitivity: "base" });

/**
 * Compares two names alphabetically, ignoring case and accents.
 *
 * @param a - The first name.
 * @param b - The second name.
 * @returns A negative number, zero or a positive number, as for `Array.prototype.sort`.
 */
export function compareNames(a: string, b: string): number {
  return nameCollator.compare(a, b);
}
