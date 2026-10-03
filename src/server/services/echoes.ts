import "server-only";
import type { Echo, Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { AppError } from "@/server/http";
import { definedFields, nextFavoritedAt } from "@/server/services/echo-rules";
import {
  echoIdSchema,
  type EchoCreate,
  type EchoListQuery,
  type EchoSort,
  type EchoUpdate,
} from "@/server/validation/echo";
import type { EchoDto, EchoListDto } from "@/types/echo";

const ORDER_BY: Record<EchoSort, Prisma.EchoOrderByWithRelationInput[]> = {
  newest: [{ savedAt: "desc" }, { id: "asc" }],
  oldest: [{ savedAt: "asc" }, { id: "asc" }],
  recently_updated: [{ updatedAt: "desc" }, { id: "asc" }],
  author: [{ author: { sort: "asc", nulls: "last" } }, { savedAt: "desc" }, { id: "asc" }],
};

/**
 * Builds the where clause for one of the user's live Echoes, rejecting IDs that aren't UUIDs.
 *
 * A malformed ID can't match any row, so it gets the same 404 as a missing Echo instead of a
 * database error.
 *
 * @param userId - The owner's user ID.
 * @param id - The Echo ID from the URL.
 * @returns The Prisma where clause.
 * @throws AppError ECHO_NOT_FOUND when the ID is not a UUID.
 */
function ownedEcho(userId: string, id: string): Prisma.EchoWhereInput {
  if (!echoIdSchema.safeParse(id).success) throw new AppError("ECHO_NOT_FOUND");
  return liveEchoes(userId, { id });
}

/**
 * Builds the where clause every Echo read uses: owned by the user and not soft-deleted.
 *
 * @param userId - The owner's user ID.
 * @param extra - Additional filters to combine with the ownership filter.
 * @returns The Prisma where clause.
 */
function liveEchoes(userId: string, extra: Prisma.EchoWhereInput = {}): Prisma.EchoWhereInput {
  return { ...extra, userId, deletedAt: null };
}

/**
 * Converts an Echo row into its API shape, leaving out `userId`, `deletedAt` and internal fields.
 *
 * @param echo - The Echo row.
 * @returns The Echo DTO.
 */
export function serializeEcho(echo: Echo): EchoDto {
  return {
    id: echo.id,
    quote: echo.quote,
    author: echo.author,
    source: echo.source,
    reflection: echo.reflection,
    mood: echo.mood,
    isFavorite: echo.isFavorite,
    favoritedAt: echo.favoritedAt?.toISOString() ?? null,
    savedAt: echo.savedAt.toISOString(),
    updatedAt: echo.updatedAt.toISOString(),
  };
}

/**
 * Saves a new Echo for the user.
 *
 * @param userId - The owner's user ID.
 * @param input - The validated Echo fields.
 * @returns The created Echo.
 */
export async function createEcho(userId: string, input: EchoCreate): Promise<EchoDto> {
  const isFavorite = input.isFavorite ?? false;
  const echo = await db.echo.create({
    data: {
      userId,
      quote: input.quote,
      author: input.author ?? null,
      source: input.source ?? null,
      reflection: input.reflection ?? null,
      mood: input.mood ?? null,
      isFavorite,
      favoritedAt: isFavorite ? new Date() : null,
    },
  });
  return serializeEcho(echo);
}

/**
 * Fetches one of the user's Echoes.
 *
 * @param userId - The owner's user ID.
 * @param id - The Echo ID.
 * @returns The Echo.
 * @throws AppError ECHO_NOT_FOUND when the Echo is missing, deleted or owned by someone else.
 */
export async function getEcho(userId: string, id: string): Promise<EchoDto> {
  const echo = await db.echo.findFirst({ where: ownedEcho(userId, id) });
  if (!echo) throw new AppError("ECHO_NOT_FOUND");
  return serializeEcho(echo);
}

/**
 * Lists the user's Echoes, one page at a time.
 *
 * @param userId - The owner's user ID.
 * @param query - The validated page, limit, sort and filters.
 * @returns The page of Echoes with pagination metadata.
 */
export async function listEchoes(userId: string, query: EchoListQuery): Promise<EchoListDto> {
  const where = liveEchoes(
    userId,
    query.favorite === undefined ? {} : { isFavorite: query.favorite },
  );
  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    db.echo.findMany({ where, orderBy: ORDER_BY[query.sort], skip, take: query.limit }),
    db.echo.count({ where }),
  ]);
  return {
    items: rows.map(serializeEcho),
    page: query.page,
    limit: query.limit,
    total,
    hasMore: skip + rows.length < total,
  };
}

/**
 * Applies a partial update to one of the user's Echoes.
 *
 * @param userId - The owner's user ID.
 * @param id - The Echo ID.
 * @param patch - The validated fields to change.
 * @returns The updated Echo.
 * @throws AppError ECHO_NOT_FOUND when the Echo is missing, deleted or owned by someone else.
 */
export async function updateEcho(userId: string, id: string, patch: EchoUpdate): Promise<EchoDto> {
  const where = ownedEcho(userId, id);
  const echo = await db.$transaction(async (tx) => {
    const current = await tx.echo.findFirst({
      where,
      select: { isFavorite: true, favoritedAt: true },
    });
    if (!current) throw new AppError("ECHO_NOT_FOUND");

    const favoritedAt = nextFavoritedAt(current, patch.isFavorite, new Date());
    const { count } = await tx.echo.updateMany({
      where,
      data: { ...definedFields(patch), ...(favoritedAt === undefined ? {} : { favoritedAt }) },
    });
    if (count === 0) throw new AppError("ECHO_NOT_FOUND");

    return tx.echo.findFirstOrThrow({ where });
  });
  return serializeEcho(echo);
}

/**
 * Marks or unmarks one of the user's Echoes as a favorite.
 *
 * @param userId - The owner's user ID.
 * @param id - The Echo ID.
 * @param value - True to favorite, false to unfavorite.
 * @returns The updated Echo.
 * @throws AppError ECHO_NOT_FOUND when the Echo is missing, deleted or owned by someone else.
 */
export async function setFavorite(userId: string, id: string, value: boolean): Promise<EchoDto> {
  return updateEcho(userId, id, { isFavorite: value });
}

/**
 * Soft-deletes one of the user's Echoes so it disappears from every read.
 *
 * @param userId - The owner's user ID.
 * @param id - The Echo ID.
 * @returns Nothing.
 * @throws AppError ECHO_NOT_FOUND when the Echo is missing, already deleted or owned by someone else.
 */
export async function softDeleteEcho(userId: string, id: string): Promise<void> {
  const { count } = await db.echo.updateMany({
    where: ownedEcho(userId, id),
    data: { deletedAt: new Date() },
  });
  if (count === 0) throw new AppError("ECHO_NOT_FOUND");
}
