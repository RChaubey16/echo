import type { EchoUpdate } from "@/server/validation/echo";

/**
 * Works out the new `favoritedAt` when a patch may change an Echo's favorite flag.
 *
 * Favoriting stamps the current time, unfavoriting clears it, and re-sending the current value keeps
 * the original timestamp so "recently favorited" ordering stays stable.
 *
 * @param current - The Echo's favorite flag and timestamp before the patch.
 * @param next - The favorite flag from the patch, or undefined when the patch doesn't touch it.
 * @param now - The time to stamp when the Echo becomes a favorite.
 * @returns The `favoritedAt` value to write, or undefined to leave it unchanged.
 */
export function nextFavoritedAt(
  current: { isFavorite: boolean; favoritedAt: Date | null },
  next: boolean | undefined,
  now: Date,
): Date | null | undefined {
  if (next === undefined || next === current.isFavorite) return undefined;
  return next ? now : null;
}

const RELATION_FIELDS = new Set(["tagIds", "tagNames", "collectionIds", "revisitAt"]);

/**
 * The Echo's own columns that a patch can change; tags, collections and the Revisit are written
 * separately.
 */
type EchoColumnPatch = Partial<
  Omit<EchoUpdate, "tagIds" | "tagNames" | "collectionIds" | "revisitAt">
>;

/**
 * Picks the Echo columns a patch actually set, so Prisma only writes those.
 *
 * Undefined values and the tag, collection and Revisit fields are left out; those relations are
 * written through their own tables.
 *
 * @param patch - The parsed update patch.
 * @returns The column values to write.
 */
export function definedFields(patch: EchoUpdate): EchoColumnPatch {
  return Object.fromEntries(
    Object.entries(patch).filter(
      ([key, value]) => value !== undefined && !RELATION_FIELDS.has(key),
    ),
  ) as EchoColumnPatch;
}

/**
 * Works out how to turn the current set of linked IDs into the requested one.
 *
 * @param current - The IDs linked now.
 * @param next - The IDs that should be linked afterwards; duplicates are ignored.
 * @returns The IDs to link and the IDs to unlink.
 */
export function diffIds(
  current: readonly string[],
  next: readonly string[],
): { toAdd: string[]; toRemove: string[] } {
  const have = new Set(current);
  const want = new Set(next);
  return {
    toAdd: [...want].filter((id) => !have.has(id)),
    toRemove: [...have].filter((id) => !want.has(id)),
  };
}
