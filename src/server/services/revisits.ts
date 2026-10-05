import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { AppError } from "@/server/http";
import { ECHO_INCLUDE, liveEchoes, serializeEcho } from "@/server/services/echoes";
import { assertRevisitDate, clearPendingRevisits } from "@/server/services/revisit-schedule";
import { assertUuid } from "@/server/services/service-utils";
import {
  type RevisitCreate,
  type RevisitStatus,
  type RevisitUpdate,
} from "@/server/validation/revisit";
import { echoIdSchema } from "@/server/validation/echo";
import type { RevisitDto, RevisitWithEchoDto } from "@/types/echo";

/** The most Revisits one list request returns; the page has no pagination. */
const REVISIT_LIST_MAX = 100;

type RevisitRow = Prisma.RevisitGetPayload<object>;

/**
 * Converts a Revisit row into its API shape, leaving out `userId`.
 *
 * @param revisit - The Revisit row.
 * @returns The Revisit DTO.
 */
function serializeRevisit(revisit: RevisitRow): RevisitDto {
  return {
    id: revisit.id,
    echoId: revisit.echoId,
    scheduledFor: revisit.scheduledFor.toISOString(),
    completedAt: revisit.completedAt?.toISOString() ?? null,
    createdAt: revisit.createdAt.toISOString(),
  };
}

/**
 * Builds the where clause for the user's Revisits whose Echo still exists.
 *
 * @param userId - The owner's user ID.
 * @param extra - Additional filters to combine with the ownership filter.
 * @returns The Prisma where clause.
 */
function liveRevisits(
  userId: string,
  extra: Prisma.RevisitWhereInput = {},
): Prisma.RevisitWhereInput {
  return { ...extra, userId, echo: { userId, deletedAt: null } };
}

/**
 * Builds the where clause for one status of the user's Revisits.
 *
 * @param userId - The owner's user ID.
 * @param status - Due (pending, date reached), upcoming (pending, in the future) or completed.
 * @param now - The current time.
 * @returns The Prisma where clause.
 */
function statusWhere(userId: string, status: RevisitStatus, now: Date): Prisma.RevisitWhereInput {
  if (status === "completed") return liveRevisits(userId, { completedAt: { not: null } });
  return liveRevisits(userId, {
    completedAt: null,
    scheduledFor: status === "due" ? { lte: now } : { gt: now },
  });
}

/**
 * Schedules a Revisit for one of the user's Echoes, replacing its pending Revisit if it has one.
 *
 * @param userId - The owner's user ID.
 * @param input - The validated Echo ID and date.
 * @param now - The current time; injectable for tests.
 * @returns The new Revisit.
 * @throws AppError ECHO_NOT_FOUND when the Echo is missing, deleted or owned by someone else.
 * @throws AppError VALIDATION_ERROR when the date is in the past or more than ten years away.
 */
export async function createRevisit(
  userId: string,
  input: RevisitCreate,
  now: Date = new Date(),
): Promise<RevisitDto> {
  assertUuid(input.echoId, "ECHO_NOT_FOUND");
  const revisit = await db.$transaction(async (tx) => {
    const echo = await tx.echo.findFirst({
      where: liveEchoes(userId, { id: input.echoId }),
      select: { id: true },
    });
    if (!echo) throw new AppError("ECHO_NOT_FOUND");
    assertRevisitDate(input.scheduledFor, now);
    await clearPendingRevisits(tx, userId, echo.id);
    return tx.revisit.create({
      data: { userId, echoId: echo.id, scheduledFor: input.scheduledFor },
    });
  });
  return serializeRevisit(revisit);
}

/**
 * Lists one status of the user's Revisits with their Echoes.
 *
 * Due and upcoming are ordered by date, soonest first; completed by when they were reflected on,
 * most recent first.
 *
 * @param userId - The owner's user ID.
 * @param status - Which Revisits to list.
 * @param options - The current time (injectable for tests) and an optional row limit.
 * @returns The Revisits.
 */
export async function listRevisits(
  userId: string,
  status: RevisitStatus,
  options: { now?: Date; limit?: number } = {},
): Promise<RevisitWithEchoDto[]> {
  const now = options.now ?? new Date();
  const rows = await db.revisit.findMany({
    where: statusWhere(userId, status, now),
    orderBy:
      status === "completed"
        ? [{ completedAt: "desc" }, { id: "asc" }]
        : [{ scheduledFor: "asc" }, { id: "asc" }],
    take: Math.min(options.limit ?? REVISIT_LIST_MAX, REVISIT_LIST_MAX),
    include: { echo: { include: ECHO_INCLUDE } },
  });
  return rows.map(({ echo, ...revisit }) => ({
    ...serializeRevisit(revisit),
    echo: serializeEcho(echo),
  }));
}

/**
 * Counts the user's due Revisits: pending, with their date reached.
 *
 * @param userId - The owner's user ID.
 * @param now - The current time; injectable for tests.
 * @returns The number of due Revisits.
 */
export async function countDueRevisits(userId: string, now: Date = new Date()): Promise<number> {
  return db.revisit.count({ where: statusWhere(userId, "due", now) });
}

/**
 * Fetches the pending Revisit for one of the user's Echoes, if any.
 *
 * @param userId - The owner's user ID.
 * @param echoId - The Echo ID.
 * @returns The pending Revisit, or null when none is scheduled or the ID is malformed.
 */
export async function getPendingRevisit(
  userId: string,
  echoId: string,
): Promise<RevisitDto | null> {
  // A malformed ID can't have a Revisit; the page's own Echo lookup shows the 404.
  if (!echoIdSchema.safeParse(echoId).success) return null;
  const revisit = await db.revisit.findFirst({
    where: liveRevisits(userId, { echoId, completedAt: null }),
  });
  return revisit ? serializeRevisit(revisit) : null;
}

/**
 * Marks one of the user's Revisits as reflected on, or moves it to a new date.
 *
 * Moving a completed Revisit makes it pending again and replaces any other pending Revisit for
 * the same Echo.
 *
 * @param userId - The owner's user ID.
 * @param id - The Revisit ID.
 * @param patch - `{ completed: true }` or `{ scheduledFor }`.
 * @param now - The current time; injectable for tests.
 * @returns The updated Revisit.
 * @throws AppError REVISIT_NOT_FOUND when the Revisit is missing, its Echo is deleted, or it is
 * owned by someone else.
 * @throws AppError VALIDATION_ERROR when a new date is in the past or more than ten years away.
 */
export async function updateRevisit(
  userId: string,
  id: string,
  patch: RevisitUpdate,
  now: Date = new Date(),
): Promise<RevisitDto> {
  assertUuid(id, "REVISIT_NOT_FOUND");
  const revisit = await db.$transaction(async (tx) => {
    const current = await tx.revisit.findFirst({ where: liveRevisits(userId, { id }) });
    if (!current) throw new AppError("REVISIT_NOT_FOUND");
    if ("completed" in patch) {
      if (current.completedAt) return current;
      return tx.revisit.update({ where: { id: current.id }, data: { completedAt: now } });
    }
    assertRevisitDate(patch.scheduledFor, now);
    await clearPendingRevisits(tx, userId, current.echoId, current.id);
    return tx.revisit.update({
      where: { id: current.id },
      data: { scheduledFor: patch.scheduledFor, completedAt: null },
    });
  });
  return serializeRevisit(revisit);
}

/**
 * Cancels one of the user's Revisits.
 *
 * @param userId - The owner's user ID.
 * @param id - The Revisit ID.
 * @returns Nothing.
 * @throws AppError REVISIT_NOT_FOUND when the Revisit is missing, its Echo is deleted, or it is
 * owned by someone else.
 */
export async function deleteRevisit(userId: string, id: string): Promise<void> {
  assertUuid(id, "REVISIT_NOT_FOUND");
  const { count } = await db.revisit.deleteMany({ where: liveRevisits(userId, { id }) });
  if (count === 0) throw new AppError("REVISIT_NOT_FOUND");
}
