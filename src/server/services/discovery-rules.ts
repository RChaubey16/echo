/** Above this many Echoes, Today's Echo prefers ones saved more than a week ago. */
export const PREFER_OLDER_THRESHOLD = 10;
/** How old an Echo must be to count as "older" for Today's Echo. */
export const PREFER_OLDER_DAYS = 7;
/** How long Echo Me Something avoids an Echo it has just shown. */
export const RECENTLY_SURFACED_HOURS = 24;
/** The most IDs the client may ask Echo Me Something to skip. */
export const RANDOM_EXCLUDE_MAX = 5;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Picks a random row from the first candidate set that isn't empty.
 *
 * Echo Me Something counts several candidate sets, from the strictest to the loosest, so it can
 * drop its exclusions when they would leave nothing to show.
 *
 * @param counts - The size of each candidate set, strictest first.
 * @param random - A source of numbers in [0, 1), such as Math.random.
 * @returns The chosen set and the row to skip to within it, or null when every set is empty.
 */
export function pickFromTiers(
  counts: readonly number[],
  random: () => number,
): { tier: number; skip: number } | null {
  const tier = counts.findIndex((count) => count > 0);
  if (tier === -1) return null;
  const count = counts[tier]!;
  return { tier, skip: Math.min(Math.floor(random() * count), count - 1) };
}

/**
 * Works out the date before which an Echo counts as "older" for Today's Echo.
 *
 * @param now - The current time.
 * @returns The cutoff date.
 */
export function olderThanCutoff(now: Date): Date {
  return new Date(now.getTime() - PREFER_OLDER_DAYS * DAY);
}

/**
 * Works out the time after which Echo Me Something treats an Echo as recently shown.
 *
 * @param now - The current time.
 * @returns The cutoff time.
 */
export function recentlySurfacedCutoff(now: Date): Date {
  return new Date(now.getTime() - RECENTLY_SURFACED_HOURS * 60 * 60 * 1000);
}

/**
 * Lists the windows the "From the past" card looks in: about a year, six months and a month
 * ago, each plus or minus a week, oldest first.
 *
 * @param now - The current time.
 * @returns The windows as `[from, to]` pairs.
 */
export function pastWindows(now: Date): Array<{ label: string; from: Date; to: Date }> {
  const back = (months: number) => {
    const date = new Date(now);
    date.setUTCMonth(date.getUTCMonth() - months);
    return date;
  };
  return [
    { label: "one year ago", months: 12 },
    { label: "six months ago", months: 6 },
    { label: "one month ago", months: 1 },
  ].map(({ label, months }) => {
    const center = back(months).getTime();
    return { label, from: new Date(center - 7 * DAY), to: new Date(center + 7 * DAY) };
  });
}
