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

/**
 * Removes keys whose value is undefined so Prisma only writes fields the patch actually set.
 *
 * @param patch - The parsed update patch.
 * @returns The patch without undefined values.
 */
export function definedFields(patch: EchoUpdate): Partial<EchoUpdate> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<EchoUpdate>;
}
