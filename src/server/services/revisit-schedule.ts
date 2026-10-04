import "server-only";
import { AppError } from "@/server/http";
import type { DbClient } from "@/server/services/service-utils";
import { revisitDateError } from "@/server/validation/revisit";

/**
 * Throws a validation error when a Revisit date is in the past or too far away.
 *
 * @param scheduledFor - The requested date.
 * @param now - The current time.
 * @param field - The form field to attach the message to.
 * @returns Nothing.
 * @throws AppError VALIDATION_ERROR when the date isn't allowed.
 */
export function assertRevisitDate(scheduledFor: Date, now: Date, field = "scheduledFor"): void {
  const message = revisitDateError(scheduledFor, now);
  if (message) throw new AppError("VALIDATION_ERROR", message, undefined, { [field]: [message] });
}

/**
 * Removes an Echo's pending Revisits, so a new schedule replaces the old one.
 *
 * @param client - The transaction to run in.
 * @param userId - The owner's user ID.
 * @param echoId - The Echo whose pending Revisits to remove.
 * @param keepId - A Revisit to leave in place, if any.
 * @returns Nothing.
 */
export async function clearPendingRevisits(
  client: DbClient,
  userId: string,
  echoId: string,
  keepId?: string,
): Promise<void> {
  await client.revisit.deleteMany({
    where: { userId, echoId, completedAt: null, ...(keepId ? { id: { not: keepId } } : {}) },
  });
}

/**
 * Sets an owned Echo's pending Revisit from an Echo form: a date replaces it, null cancels it.
 *
 * The caller must already have checked that the Echo belongs to the user.
 *
 * @param client - The transaction to run in.
 * @param userId - The owner's user ID.
 * @param echoId - The Echo ID.
 * @param revisitAt - The new date, or null to cancel.
 * @param now - The current time.
 * @returns Nothing.
 * @throws AppError VALIDATION_ERROR (on `revisitAt`) when the date isn't allowed.
 */
export async function setPendingRevisit(
  client: DbClient,
  userId: string,
  echoId: string,
  revisitAt: Date | null,
  now: Date,
): Promise<void> {
  if (revisitAt) assertRevisitDate(revisitAt, now, "revisitAt");
  await clearPendingRevisits(client, userId, echoId);
  if (revisitAt) {
    await client.revisit.create({ data: { userId, echoId, scheduledFor: revisitAt } });
  }
}
