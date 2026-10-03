import "server-only";
import type { Collection } from "@/generated/prisma/client";
import { compareNames } from "@/lib/sort";
import { db } from "@/server/db";
import { AppError } from "@/server/http";
import { listEchoes, liveEchoes } from "@/server/services/echoes";
import { assertUuid, isUniqueViolation, nameTakenError } from "@/server/services/service-utils";
import {
  ACCENT_CYCLE,
  type CollectionCreate,
  type CollectionUpdate,
} from "@/server/validation/collection";
import type { EchoListQuery } from "@/server/validation/echo";
import type { CollectionDetailDto, CollectionDto, SidebarCollectionsDto } from "@/types/echo";

const NAME_TAKEN = "You already have a collection with that name.";

/** Counts only the Echoes that haven't been soft-deleted. */
const LIVE_ECHO_COUNT = {
  _count: { select: { echoes: { where: { echo: { deletedAt: null } } } } },
} as const;

/**
 * Converts a collection row with its live-Echo count into its API shape.
 *
 * @param collection - The collection row with `_count.echoes`.
 * @returns The collection DTO.
 */
function serializeCollection(
  collection: Collection & { _count: { echoes: number } },
): CollectionDto {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    accent: collection.accent,
    echoCount: collection._count.echoes,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

/**
 * Fetches one of the user's collections with its live-Echo count.
 *
 * @param userId - The owner's user ID.
 * @param id - The collection ID.
 * @returns The collection.
 * @throws AppError COLLECTION_NOT_FOUND when the collection is missing or owned by someone else.
 */
export async function getCollectionSummary(userId: string, id: string): Promise<CollectionDto> {
  assertUuid(id, "COLLECTION_NOT_FOUND");
  const collection = await db.collection.findFirst({
    where: { id, userId },
    include: LIVE_ECHO_COUNT,
  });
  if (!collection) throw new AppError("COLLECTION_NOT_FOUND");
  return serializeCollection(collection);
}

/**
 * Lists all of the user's collections alphabetically, with how many live Echoes each holds.
 *
 * @param userId - The owner's user ID.
 * @returns The user's collections.
 */
export async function listCollections(userId: string): Promise<CollectionDto[]> {
  const collections = await db.collection.findMany({
    where: { userId },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    include: LIVE_ECHO_COUNT,
  });
  return collections.map(serializeCollection).toSorted((a, b) => compareNames(a.name, b.name));
}

/**
 * Lists the first few of the user's collections, alphabetically, with only the fields the sidebar
 * shows, plus the total so it knows whether to link to the rest.
 *
 * @param userId - The owner's user ID.
 * @param limit - How many collections to return.
 * @returns The collections and the user's total number of collections.
 */
export async function listSidebarCollections(
  userId: string,
  limit: number,
): Promise<SidebarCollectionsDto> {
  // Sorted here, not in SQL, so the order matches the Collections page whatever the database's
  // collation. A user has dozens of collections at most, and only these four fields are read.
  const rows = await db.collection.findMany({
    where: { userId },
    select: { id: true, name: true, accent: true, ...LIVE_ECHO_COUNT },
  });
  return {
    items: rows
      .toSorted((a, b) => compareNames(a.name, b.name) || a.id.localeCompare(b.id))
      .slice(0, limit)
      .map(({ _count, ...collection }) => ({ ...collection, echoCount: _count.echoes })),
    total: rows.length,
  };
}

/**
 * Fetches one of the user's collections with a page of its Echoes.
 *
 * @param userId - The owner's user ID.
 * @param id - The collection ID.
 * @param query - The page, limit and sort for the collection's Echoes.
 * @returns The collection and its Echoes.
 * @throws AppError COLLECTION_NOT_FOUND when the collection is missing or owned by someone else.
 */
export async function getCollection(
  userId: string,
  id: string,
  query: EchoListQuery,
): Promise<CollectionDetailDto> {
  // Checked up front so the two queries below can run together on a valid ID.
  assertUuid(id, "COLLECTION_NOT_FOUND");
  const [collection, echoes] = await Promise.all([
    getCollectionSummary(userId, id),
    listEchoes(userId, { ...query, collection: id }),
  ]);
  return { ...collection, echoes };
}

/**
 * Creates a collection; without an accent it takes the next one in the cycle so neighbours differ.
 *
 * @param userId - The owner's user ID.
 * @param input - The validated name, description and optional accent.
 * @returns The new collection.
 * @throws AppError VALIDATION_ERROR when the user already has a collection with that name.
 */
export async function createCollection(
  userId: string,
  input: CollectionCreate,
): Promise<CollectionDto> {
  const accent =
    input.accent ??
    ACCENT_CYCLE[(await db.collection.count({ where: { userId } })) % ACCENT_CYCLE.length];
  try {
    const collection = await db.collection.create({
      data: { userId, name: input.name, description: input.description ?? null, accent },
      include: LIVE_ECHO_COUNT,
    });
    return serializeCollection(collection);
  } catch (error) {
    if (isUniqueViolation(error)) throw nameTakenError(NAME_TAKEN);
    throw error;
  }
}

/**
 * Renames a collection or changes its description or accent.
 *
 * @param userId - The owner's user ID.
 * @param id - The collection ID.
 * @param patch - The validated fields to change.
 * @returns The updated collection.
 * @throws AppError COLLECTION_NOT_FOUND when the collection is missing or owned by someone else.
 * @throws AppError VALIDATION_ERROR when the new name is already taken.
 */
export async function updateCollection(
  userId: string,
  id: string,
  patch: CollectionUpdate,
): Promise<CollectionDto> {
  assertUuid(id, "COLLECTION_NOT_FOUND");
  const data = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as CollectionUpdate;
  try {
    const { count } = await db.collection.updateMany({ where: { id, userId }, data });
    if (count === 0) throw new AppError("COLLECTION_NOT_FOUND");
  } catch (error) {
    if (isUniqueViolation(error)) throw nameTakenError(NAME_TAKEN);
    throw error;
  }
  return getCollectionSummary(userId, id);
}

/**
 * Deletes a collection. Only its links go with it; the Echoes themselves are kept (spec §27).
 *
 * @param userId - The owner's user ID.
 * @param id - The collection ID.
 * @returns Nothing.
 * @throws AppError COLLECTION_NOT_FOUND when the collection is missing or owned by someone else.
 */
export async function deleteCollection(userId: string, id: string): Promise<void> {
  assertUuid(id, "COLLECTION_NOT_FOUND");
  const { count } = await db.collection.deleteMany({ where: { id, userId } });
  if (count === 0) throw new AppError("COLLECTION_NOT_FOUND");
}

/**
 * Adds one of the user's Echoes to one of the user's collections; adding it twice is a no-op.
 *
 * @param userId - The owner's user ID.
 * @param collectionId - The collection ID.
 * @param echoId - The Echo ID.
 * @returns The collection with its updated count.
 * @throws AppError COLLECTION_NOT_FOUND when the collection is missing or owned by someone else.
 * @throws AppError ECHO_NOT_FOUND when the Echo is missing, deleted or owned by someone else.
 */
export async function addEchoToCollection(
  userId: string,
  collectionId: string,
  echoId: string,
): Promise<CollectionDto> {
  assertUuid(collectionId, "COLLECTION_NOT_FOUND");
  assertUuid(echoId, "ECHO_NOT_FOUND");
  const [collection, echo] = await Promise.all([
    db.collection.findFirst({ where: { id: collectionId, userId }, select: { id: true } }),
    db.echo.findFirst({ where: liveEchoes(userId, { id: echoId }), select: { id: true } }),
  ]);
  if (!collection) throw new AppError("COLLECTION_NOT_FOUND");
  if (!echo) throw new AppError("ECHO_NOT_FOUND");
  await db.echoCollection.createMany({ data: [{ echoId, collectionId }], skipDuplicates: true });
  return getCollectionSummary(userId, collectionId);
}

/**
 * Removes an Echo from one of the user's collections; the Echo itself is kept.
 *
 * @param userId - The owner's user ID.
 * @param collectionId - The collection ID.
 * @param echoId - The Echo ID.
 * @returns The collection with its updated count.
 * @throws AppError COLLECTION_NOT_FOUND when the collection is missing or owned by someone else.
 * @throws AppError ECHO_NOT_FOUND when the Echo isn't in the collection.
 */
export async function removeEchoFromCollection(
  userId: string,
  collectionId: string,
  echoId: string,
): Promise<CollectionDto> {
  assertUuid(collectionId, "COLLECTION_NOT_FOUND");
  assertUuid(echoId, "ECHO_NOT_FOUND");
  const collection = await db.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });
  if (!collection) throw new AppError("COLLECTION_NOT_FOUND");
  const { count } = await db.echoCollection.deleteMany({
    where: { collectionId, echoId, echo: { userId } },
  });
  if (count === 0) throw new AppError("ECHO_NOT_FOUND");
  return getCollectionSummary(userId, collectionId);
}
