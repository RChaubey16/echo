import "server-only";
import { notFound } from "next/navigation";
import { AppError } from "@/server/http";
import { getCollection, getCollectionSummary } from "@/server/services/collections";
import { getTag } from "@/server/services/tags";
import type { EchoListQuery } from "@/server/validation/echo";
import type { CollectionDetailDto, CollectionDto, TagDto } from "@/types/echo";

/**
 * Loads one of the user's collections with a page of its Echoes, showing the 404 page when it is
 * missing or owned by someone else.
 *
 * @param userId - The signed-in user's ID.
 * @param id - The collection ID from the URL.
 * @param query - The page, limit and sort for its Echoes.
 * @returns The collection and its Echoes.
 */
export async function getCollectionOrNotFound(
  userId: string,
  id: string,
  query: EchoListQuery,
): Promise<CollectionDetailDto> {
  try {
    return await getCollection(userId, id, query);
  } catch (error) {
    if (error instanceof AppError && error.code === "COLLECTION_NOT_FOUND") notFound();
    throw error;
  }
}

/**
 * Looks up the tag and collection a library filter names, treating unknown or not-owned IDs as
 * absent so the page can drop them.
 *
 * @param userId - The signed-in user's ID.
 * @param tagId - The `tag` query parameter, if any.
 * @param collectionId - The `collection` query parameter, if any.
 * @returns The tag and collection, each null when missing.
 */
export async function getLibraryFilters(
  userId: string,
  tagId: string | undefined,
  collectionId: string | undefined,
): Promise<{ tag: TagDto | null; collection: CollectionDto | null }> {
  const orNull = <T>(promise: Promise<T>) =>
    promise.catch((error: unknown) => {
      if (error instanceof AppError && error.status === 404) return null;
      throw error;
    });
  const [tag, collection] = await Promise.all([
    tagId ? orNull(getTag(userId, tagId)) : null,
    collectionId ? orNull(getCollectionSummary(userId, collectionId)) : null,
  ]);
  return { tag, collection };
}
