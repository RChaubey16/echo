import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { compareNames } from "@/lib/sort";
import { db } from "@/server/db";
import { AppError } from "@/server/http";
import { definedFields, diffIds, nextFavoritedAt } from "@/server/services/echo-rules";
import { assertUuid, type DbClient } from "@/server/services/service-utils";
import { upsertTagsByName } from "@/server/services/tags";
import {
  type EchoCreate,
  type EchoListQuery,
  type EchoSort,
  type EchoUpdate,
} from "@/server/validation/echo";
import { TAGS_PER_ECHO_MAX } from "@/server/validation/tag";
import type { EchoDto, EchoListDto } from "@/types/echo";

/** The relations every Echo DTO carries. */
export const ECHO_INCLUDE = {
  tags: { select: { tag: { select: { id: true, name: true } } } },
  collections: { select: { collection: { select: { id: true, name: true, accent: true } } } },
} as const satisfies Prisma.EchoInclude;

export type EchoWithRelations = Prisma.EchoGetPayload<{ include: typeof ECHO_INCLUDE }>;

const ORDER_BY: Record<EchoSort, Prisma.EchoOrderByWithRelationInput[]> = {
  newest: [{ savedAt: "desc" }, { id: "asc" }],
  oldest: [{ savedAt: "asc" }, { id: "asc" }],
  recently_updated: [{ updatedAt: "desc" }, { id: "asc" }],
  recently_favorited: [
    { favoritedAt: { sort: "desc", nulls: "last" } },
    { savedAt: "desc" },
    { id: "asc" },
  ],
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
  assertUuid(id, "ECHO_NOT_FOUND");
  return liveEchoes(userId, { id });
}

/**
 * Builds the where clause every Echo read uses: owned by the user and not soft-deleted.
 *
 * @param userId - The owner's user ID.
 * @param extra - Additional filters to combine with the ownership filter.
 * @returns The Prisma where clause.
 */
export function liveEchoes(
  userId: string,
  extra: Prisma.EchoWhereInput = {},
): Prisma.EchoWhereInput {
  return { ...extra, userId, deletedAt: null };
}

/**
 * Sorts a list of named records by name, ignoring case.
 *
 * @param items - The records to sort.
 * @returns A new, sorted array.
 */
function byName<T extends { name: string }>(items: T[]): T[] {
  return items.toSorted((a, b) => compareNames(a.name, b.name));
}

/**
 * Converts an Echo row into its API shape, leaving out `userId`, `deletedAt` and internal fields.
 *
 * @param echo - The Echo row with its tags and collections.
 * @returns The Echo DTO.
 */
export function serializeEcho(echo: EchoWithRelations): EchoDto {
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
    tags: byName(echo.tags.map(({ tag }) => tag)),
    collections: byName(echo.collections.map(({ collection }) => collection)),
  };
}

/**
 * Checks that every tag and collection ID in a request belongs to the user (spec §65 case 4).
 *
 * @param client - The Prisma client or transaction to run in.
 * @param userId - The owner's user ID.
 * @param tagIds - Tag IDs from the request, if any.
 * @param collectionIds - Collection IDs from the request, if any.
 * @returns Nothing.
 * @throws AppError FORBIDDEN when any ID is missing or owned by someone else.
 */
export async function assertOwnedIds(
  client: DbClient,
  userId: string,
  tagIds: readonly string[] = [],
  collectionIds: readonly string[] = [],
): Promise<void> {
  const tags = [...new Set(tagIds)];
  const collections = [...new Set(collectionIds)];
  const [tagCount, collectionCount] = await Promise.all([
    tags.length === 0 ? 0 : client.tag.count({ where: { userId, id: { in: tags } } }),
    collections.length === 0
      ? 0
      : client.collection.count({ where: { userId, id: { in: collections } } }),
  ]);
  if (tagCount !== tags.length || collectionCount !== collections.length) {
    throw new AppError("FORBIDDEN");
  }
}

/**
 * Works out the full tag and collection sets a create or update asks for.
 *
 * Checks ownership of the IDs sent, then creates any new tags named in `tagNames`. A set is
 * undefined when the request doesn't mention it, so an update leaves it alone.
 *
 * @param client - The transaction to run in.
 * @param userId - The owner's user ID.
 * @param input - The validated request.
 * @returns The tag and collection IDs to link, or undefined for sets the request doesn't touch.
 * @throws AppError FORBIDDEN when any ID is not the user's.
 * @throws AppError VALIDATION_ERROR when the tags add up to more than the limit.
 */
async function resolveLinks(
  client: DbClient,
  userId: string,
  input: Pick<EchoUpdate, "tagIds" | "tagNames" | "collectionIds">,
): Promise<{ tagIds?: string[]; collectionIds?: string[] }> {
  await assertOwnedIds(client, userId, input.tagIds, input.collectionIds);

  let tagIds: string[] | undefined;
  if (input.tagIds !== undefined || input.tagNames !== undefined) {
    const named = await upsertTagsByName(userId, input.tagNames ?? [], client);
    tagIds = [...new Set([...(input.tagIds ?? []), ...named.map((tag) => tag.id)])];
    if (tagIds.length > TAGS_PER_ECHO_MAX) {
      const message = `An Echo can have up to ${TAGS_PER_ECHO_MAX} tags.`;
      throw new AppError("VALIDATION_ERROR", message, undefined, { tagNames: [message] });
    }
  }
  const collectionIds =
    input.collectionIds === undefined ? undefined : [...new Set(input.collectionIds)];
  return { tagIds, collectionIds };
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
  const echo = await db.$transaction(async (tx) => {
    const { tagIds = [], collectionIds = [] } = await resolveLinks(tx, userId, input);
    return tx.echo.create({
      data: {
        userId,
        quote: input.quote,
        author: input.author ?? null,
        source: input.source ?? null,
        reflection: input.reflection ?? null,
        mood: input.mood ?? null,
        isFavorite,
        favoritedAt: isFavorite ? new Date() : null,
        tags: { createMany: { data: tagIds.map((tagId) => ({ tagId })) } },
        collections: {
          createMany: { data: collectionIds.map((collectionId) => ({ collectionId })) },
        },
      },
      include: ECHO_INCLUDE,
    });
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
  const echo = await db.echo.findFirst({ where: ownedEcho(userId, id), include: ECHO_INCLUDE });
  if (!echo) throw new AppError("ECHO_NOT_FOUND");
  return serializeEcho(echo);
}

/**
 * Builds the optional list filters: favorite, tag, collection and a plain substring search.
 *
 * The substring search keeps the list's own sort order; ranked full-text search lives in
 * `services/search.ts`.
 *
 * @param query - The validated list query.
 * @returns The extra where conditions.
 */
function listFilters(query: EchoListQuery): Prisma.EchoWhereInput {
  const and: Prisma.EchoWhereInput[] = [];
  if (query.favorite !== undefined) and.push({ isFavorite: query.favorite });
  if (query.tag) and.push({ tags: { some: { tagId: query.tag } } });
  if (query.collection) and.push({ collections: { some: { collectionId: query.collection } } });
  if (query.search) {
    const contains = { contains: query.search, mode: "insensitive" } as const;
    and.push({
      OR: [
        { quote: contains },
        { author: contains },
        { source: contains },
        { reflection: contains },
        { tags: { some: { tag: { name: contains } } } },
        { collections: { some: { collection: { name: contains } } } },
      ],
    });
  }
  return and.length === 0 ? {} : { AND: and };
}

/**
 * Lists the user's Echoes, one page at a time.
 *
 * @param userId - The owner's user ID.
 * @param query - The validated page, limit, sort and filters.
 * @returns The page of Echoes with pagination metadata.
 */
export async function listEchoes(userId: string, query: EchoListQuery): Promise<EchoListDto> {
  const where = liveEchoes(userId, listFilters(query));
  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    db.echo.findMany({
      where,
      orderBy: ORDER_BY[query.sort],
      skip,
      take: query.limit,
      include: ECHO_INCLUDE,
    }),
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
      select: {
        id: true,
        isFavorite: true,
        favoritedAt: true,
        tags: { select: { tagId: true } },
        collections: { select: { collectionId: true } },
      },
    });
    if (!current) throw new AppError("ECHO_NOT_FOUND");

    const links = await resolveLinks(tx, userId, patch);
    const favoritedAt = nextFavoritedAt(current, patch.isFavorite, new Date());
    // updatedAt is set explicitly so changing only tags or collections still counts as an edit.
    const { count } = await tx.echo.updateMany({
      where,
      data: {
        ...definedFields(patch),
        ...(favoritedAt === undefined ? {} : { favoritedAt }),
        updatedAt: new Date(),
      },
    });
    if (count === 0) throw new AppError("ECHO_NOT_FOUND");

    if (links.tagIds) {
      const { toAdd, toRemove } = diffIds(
        current.tags.map((link) => link.tagId),
        links.tagIds,
      );
      await tx.echoTag.deleteMany({ where: { echoId: current.id, tagId: { in: toRemove } } });
      await tx.echoTag.createMany({
        data: toAdd.map((tagId) => ({ echoId: current.id, tagId })),
        skipDuplicates: true,
      });
    }
    if (links.collectionIds) {
      const { toAdd, toRemove } = diffIds(
        current.collections.map((link) => link.collectionId),
        links.collectionIds,
      );
      await tx.echoCollection.deleteMany({
        where: { echoId: current.id, collectionId: { in: toRemove } },
      });
      await tx.echoCollection.createMany({
        data: toAdd.map((collectionId) => ({ echoId: current.id, collectionId })),
        skipDuplicates: true,
      });
    }

    return tx.echo.findFirstOrThrow({ where, include: ECHO_INCLUDE });
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
