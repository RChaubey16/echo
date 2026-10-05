import { z } from "zod";

// Shared by the route handlers and the RevisitPicker, so this module must stay free of server-only
// imports.

export const REVISIT_MAX_YEARS = 10;
const REVISIT_STATUSES = ["due", "upcoming", "completed"] as const;
export type RevisitStatus = (typeof REVISIT_STATUSES)[number];

/**
 * Works out the latest moment a Revisit may be scheduled for.
 *
 * @param now - The current time.
 * @returns The moment `REVISIT_MAX_YEARS` years from now.
 */
function revisitLimit(now: Date): Date {
  const limit = new Date(now);
  limit.setUTCFullYear(limit.getUTCFullYear() + REVISIT_MAX_YEARS);
  return limit;
}

/**
 * Checks a Revisit date: it must be in the future and at most ten years away.
 *
 * @param scheduledFor - The requested date.
 * @param now - The current time.
 * @returns An error message, or null when the date is allowed.
 */
export function revisitDateError(scheduledFor: Date, now: Date): string | null {
  if (scheduledFor.getTime() <= now.getTime()) return "Pick a date in the future.";
  if (scheduledFor.getTime() > revisitLimit(now).getTime()) {
    return `Pick a date within ${REVISIT_MAX_YEARS} years.`;
  }
  return null;
}

const scheduledForSchema = z.iso
  .datetime({ offset: true, error: "Pick a valid date." })
  .transform((value) => new Date(value));

export const revisitCreateSchema = z.object({
  echoId: z.string({ error: "Choose an Echo." }),
  scheduledFor: scheduledForSchema,
});

export const revisitUpdateSchema = z.union(
  [z.object({ completed: z.literal(true) }), z.object({ scheduledFor: scheduledForSchema })],
  { error: "Send either completed: true or a new scheduledFor." },
);

export const revisitListQuerySchema = z.object({
  status: z.enum(REVISIT_STATUSES).default("due"),
});

export type RevisitCreate = z.output<typeof revisitCreateSchema>;
export type RevisitUpdate = z.output<typeof revisitUpdateSchema>;
