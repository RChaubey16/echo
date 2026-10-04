import "server-only";
import { db } from "@/server/db";
import { AppError } from "@/server/http";
import {
  assertUuid,
  isUniqueViolation,
  nameTakenError,
  type DbClient,
} from "@/server/services/service-utils";
import { normalizeTagName } from "@/server/validation/tag";
import type { TagDto } from "@/types/echo";

/** Counts only the Echoes that haven't been soft-deleted. */
const LIVE_ECHO_COUNT = {
  _count: { select: { echoes: { where: { echo: { deletedAt: null } } } } },
} as const;

type TagWithCount = {
  id: string;
  name: string;
  createdAt: Date;
  _count: { echoes: number };
};

/**
 * Converts a tag row with its live-Echo count into its API shape.
 *
 * @param tag - The tag row with `_count.echoes`.
 * @returns The tag DTO.
 */
function serializeTag(tag: TagWithCount): TagDto {
  return {
    id: tag.id,
    name: tag.name,
    echoCount: tag._count.echoes,
    createdAt: tag.createdAt.toISOString(),
  };
}

/**
 * Lists all of the user's tags, alphabetically, with how many live Echoes use each.
 *
 * @param userId - The owner's user ID.
 * @returns The user's tags.
 */
export async function listTags(userId: string): Promise<TagDto[]> {
  const tags = await db.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: LIVE_ECHO_COUNT,
  });
  return tags.map(serializeTag);
}

/**
 * Finds or creates the user's tags with the given names.
 *
 * Names are normalized first, so "Courage " and "courage" resolve to the same tag.
 *
 * @param userId - The owner's user ID.
 * @param names - The tag names as typed.
 * @param client - The Prisma client or transaction to run in.
 * @returns The matching tags, one per distinct normalized name.
 */
export async function upsertTagsByName(
  userId: string,
  names: readonly string[],
  client: DbClient = db,
): Promise<{ id: string; name: string }[]> {
  const normalized = [...new Set(names.map(normalizeTagName).filter((name) => name !== ""))];
  if (normalized.length === 0) return [];
  await client.tag.createMany({
    data: normalized.map((name) => ({ userId, name })),
    skipDuplicates: true,
  });
  return client.tag.findMany({
    where: { userId, name: { in: normalized } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Creates a tag for the user, or returns the existing one with the same normalized name.
 *
 * @param userId - The owner's user ID.
 * @param name - The validated, normalized tag name.
 * @returns The tag.
 */
export async function createTag(userId: string, name: string): Promise<TagDto> {
  const [tag] = await upsertTagsByName(userId, [name]);
  if (!tag) throw new AppError("VALIDATION_ERROR", "Add a tag name.");
  return getTag(userId, tag.id);
}

/**
 * Fetches one of the user's tags with its live-Echo count.
 *
 * @param userId - The owner's user ID.
 * @param id - The tag ID.
 * @returns The tag.
 * @throws AppError TAG_NOT_FOUND when the tag is missing or owned by someone else.
 */
export async function getTag(userId: string, id: string): Promise<TagDto> {
  assertUuid(id, "TAG_NOT_FOUND");
  const tag = await db.tag.findFirst({ where: { id, userId }, include: LIVE_ECHO_COUNT });
  if (!tag) throw new AppError("TAG_NOT_FOUND");
  return serializeTag(tag);
}

/**
 * Renames one of the user's tags; every Echo using it shows the new name.
 *
 * @param userId - The owner's user ID.
 * @param id - The tag ID.
 * @param name - The validated, normalized new name.
 * @returns The renamed tag.
 * @throws AppError TAG_NOT_FOUND when the tag is missing or owned by someone else.
 * @throws AppError VALIDATION_ERROR when the user already has a tag with that name.
 */
export async function renameTag(userId: string, id: string, name: string): Promise<TagDto> {
  assertUuid(id, "TAG_NOT_FOUND");
  try {
    const { count } = await db.tag.updateMany({ where: { id, userId }, data: { name } });
    if (count === 0) throw new AppError("TAG_NOT_FOUND");
  } catch (error) {
    if (isUniqueViolation(error)) throw nameTakenError("You already have a tag with that name.");
    throw error;
  }
  return getTag(userId, id);
}

/**
 * Deletes one of the user's tags; the Echoes that used it are kept and simply lose the tag.
 *
 * @param userId - The owner's user ID.
 * @param id - The tag ID.
 * @returns Nothing.
 * @throws AppError TAG_NOT_FOUND when the tag is missing or owned by someone else.
 */
export async function deleteTag(userId: string, id: string): Promise<void> {
  assertUuid(id, "TAG_NOT_FOUND");
  const { count } = await db.tag.deleteMany({ where: { id, userId } });
  if (count === 0) throw new AppError("TAG_NOT_FOUND");
}
