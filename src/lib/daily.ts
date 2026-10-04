const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Hashes a string with 32-bit FNV-1a, a small, stable, non-cryptographic hash.
 *
 * @param input - The string to hash; it is hashed as UTF-8 bytes.
 * @returns An unsigned 32-bit integer.
 */
export function fnv1a32(input: string): number {
  let hash = FNV_OFFSET;
  for (const byte of new TextEncoder().encode(input)) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/**
 * Picks the deterministic position of a user's Echo for a given day.
 *
 * @param userId - The user's ID.
 * @param day - The local date as `YYYY-MM-DD`.
 * @param count - How many candidates there are; must be at least 1.
 * @returns An index from 0 to `count - 1`.
 */
export function dailyIndex(userId: string, day: string, count: number): number {
  return fnv1a32(`${userId}:${day}`) % count;
}

/**
 * Tells whether a string is an IANA time zone this runtime knows, such as "Asia/Kolkata".
 *
 * @param timeZone - The candidate time zone name.
 * @returns True when `Intl` accepts it.
 */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Works out the calendar date in a time zone, falling back to UTC for unknown zones.
 *
 * @param timeZone - The IANA time zone name.
 * @param now - The moment to convert.
 * @returns The local date as `YYYY-MM-DD`.
 */
export function localDate(timeZone: string, now: Date = new Date()): string {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Works out the hour of the day in a time zone, falling back to UTC for unknown zones.
 *
 * @param timeZone - The IANA time zone name.
 * @param now - The moment to convert.
 * @returns The hour, from 0 to 23.
 */
export function localHour(timeZone: string, now: Date = new Date()): number {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(now);
  return Number(hour);
}

/**
 * Chooses the home page greeting for an hour of the day.
 *
 * @param hour - The local hour, from 0 to 23.
 * @returns "Good morning", "Good afternoon" or "Good evening".
 */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}
