import { REVISIT_MAX_YEARS } from "@/server/validation/revisit";

/** A calendar day as `YYYY-MM-DD`, in the viewer's own calendar. */
export type DayKey = string;

export const REVISIT_PRESETS = [
  { id: "1m", label: "In 1 month", months: 1 },
  { id: "6m", label: "In 6 months", months: 6 },
  { id: "1y", label: "In 1 year", months: 12 },
] as const;

/** Revisits land at 9:00 in the morning, local time, on the chosen day. */
const REVISIT_HOUR = 9;

/**
 * Builds the day key for a local date.
 *
 * @param date - A date in local time.
 * @returns The day as `YYYY-MM-DD`.
 */
export function dayKey(date: Date): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Turns a day key back into a local date at midnight.
 *
 * @param key - The day as `YYYY-MM-DD`.
 * @returns The local date.
 */
export function fromDayKey(key: DayKey): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

/**
 * Adds days to a local date, keeping it at midnight.
 *
 * @param date - The starting date.
 * @param days - How many days to add; negative moves back.
 * @returns The new date.
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Adds calendar months to a local date, clamping to the end of shorter months (Jan 31 + 1 month is
 * Feb 28 or 29).
 *
 * @param date - The starting date.
 * @param months - How many months to add; negative moves back.
 * @returns The new date at midnight.
 */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

/**
 * Converts a chosen day into the moment the Revisit is due: 9:00 local time.
 *
 * @param key - The day as `YYYY-MM-DD`.
 * @returns The ISO date-time to send to the API.
 */
export function revisitIso(key: DayKey): string {
  const date = fromDayKey(key);
  date.setHours(REVISIT_HOUR);
  return date.toISOString();
}

/**
 * Works out the range of days the picker allows: tomorrow up to ten years from today.
 *
 * @param now - The current time.
 * @returns The first and last allowed days.
 */
export function revisitRange(now: Date): { min: DayKey; max: DayKey } {
  return {
    min: dayKey(addDays(now, 1)),
    max: dayKey(addDays(addMonths(now, REVISIT_MAX_YEARS * 12), -1)),
  };
}

/**
 * Works out the day a preset lands on.
 *
 * @param months - The preset's number of months.
 * @param now - The current time.
 * @returns The day as `YYYY-MM-DD`.
 */
export function presetDay(months: number, now: Date): DayKey {
  return dayKey(addMonths(now, months));
}

/**
 * Formats a Revisit date for display, e.g. "Apr 1, 2027".
 *
 * @param iso - The Revisit's ISO date-time.
 * @param timeZone - The time zone to show it in; the viewer's own when omitted.
 * @returns The short date.
 */
export function shortRevisitDate(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
}

/**
 * Lays out a month as weeks starting on Sunday, padding with nulls outside the month.
 *
 * @param year - The full year.
 * @param month - The month, 0 for January.
 * @returns The weeks, each seven day keys or nulls.
 */
export function monthGrid(year: number, month: number): Array<Array<DayKey | null>> {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<DayKey | null> = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= days; day++) cells.push(dayKey(new Date(year, month, day)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<DayKey | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
