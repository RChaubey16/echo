const DAY = 24 * 60 * 60 * 1000;

/**
 * Describes how long ago something happened: relative within a year, month and year after that.
 *
 * @param date - The moment to describe.
 * @param now - The current time.
 * @returns Text such as "today", "3 days ago", "11 months ago" or "March 2025".
 */
export function relativeDate(date: Date, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - date.getTime()) / DAY);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  const months = Math.floor(days / 30.44);
  if (months < 12) return months <= 1 ? "1 month ago" : `${months} months ago`;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Formats a full date for a `<time>` title and screen readers.
 *
 * @param date - The date to format.
 * @returns Text such as "November 2, 2025".
 */
export function fullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Builds the "Saved …" line for an Echo, phrased for relative and absolute dates alike.
 *
 * @param date - When the Echo was saved.
 * @param now - The current time.
 * @returns Text such as "Saved 3 days ago", "Saved today" or "Saved March 2025".
 */
export function savedLabel(date: Date, now: Date = new Date()): string {
  return `Saved ${relativeDate(date, now)}`;
}

/**
 * Describes how far away a future date is.
 *
 * @param date - The upcoming date.
 * @param now - The current time.
 * @returns Text such as "in 3 days", "in 2 weeks" or "in 5 months".
 */
export function inFromNow(date: Date, now: Date = new Date()): string {
  const days = Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY));
  if (days <= 1) return "tomorrow";
  if (days < 14) return `in ${days} days`;
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  if (days < 365) return `in ${Math.round(days / 30.44)} months`;
  const years = Math.round(days / 365.25);
  return years === 1 ? "in 1 year" : `in ${years} years`;
}
