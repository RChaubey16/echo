import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { relativeDate } from "@/lib/dates";
import { dailyIndex, localDate } from "@/lib/daily";
import { db } from "@/server/db";
import { ECHO_INCLUDE, liveEchoes, serializeEcho } from "@/server/services/echoes";
import {
  olderThanCutoff,
  pastWindows,
  pickFromTiers,
  PREFER_OLDER_THRESHOLD,
  recentlySurfacedCutoff,
} from "@/server/services/discovery-rules";
import { countDueRevisits } from "@/server/services/revisits";
import type { EchoDto, TodaysEchoDto } from "@/types/echo";

/** Stable order for picking an Echo by position. */
const STABLE_ORDER: Prisma.EchoOrderByWithRelationInput[] = [{ savedAt: "asc" }, { id: "asc" }];

/**
 * Reads the user's time zone, falling back to UTC when none has been captured yet.
 *
 * @param userId - The user's ID.
 * @returns The IANA time zone name.
 */
export async function getUserTimeZone(userId: string): Promise<string> {
  // eslint-disable-next-line no-restricted-syntax -- the user's own row, by their own ID.
  const user = await db.user.findUnique({ where: { id: userId }, select: { timezone: true } });
  return user?.timezone ?? "UTC";
}

/**
 * Builds Today's Echo response from an Echo.
 *
 * @param echo - The day's Echo.
 * @param day - The local date as `YYYY-MM-DD`.
 * @param now - The current time.
 * @returns The Echo with its "Saved … ago" text and date.
 */
function todaysEcho(echo: EchoDto, day: string, now: Date): TodaysEchoDto {
  return { echo, savedAgo: `Saved ${relativeDate(new Date(echo.savedAt), now)}`, date: day };
}

/**
 * Returns the user's Echo for their local date (spec §32).
 *
 * The pick is deterministic per user and date, and is pinned in `daily_echoes` the first time it
 * is computed, so adding or deleting other Echoes during the day doesn't change it. When the user
 * has more than ten Echoes, it picks from those saved more than a week ago.
 *
 * @param userId - The owner's user ID.
 * @param options - The current time and time zone; injectable for tests.
 * @returns Today's Echo, or null when the user has no Echoes.
 */
export async function getTodaysEcho(
  userId: string,
  options: { now?: Date; timeZone?: string } = {},
): Promise<TodaysEchoDto | null> {
  const now = options.now ?? new Date();
  const day = localDate(options.timeZone ?? (await getUserTimeZone(userId)), now);
  const date = new Date(`${day}T00:00:00Z`);

  // eslint-disable-next-line no-restricted-syntax -- the unique key starts with userId.
  const pinned = await db.dailyEcho.findUnique({
    where: { userId_date: { userId, date } },
    select: { echo: { include: ECHO_INCLUDE } },
  });
  // The join is on the Echo's ID alone, so check ownership and soft delete on the row itself.
  if (pinned && pinned.echo.userId === userId && pinned.echo.deletedAt === null) {
    return todaysEcho(serializeEcho(pinned.echo), day, now);
  }

  const total = await db.echo.count({ where: liveEchoes(userId) });
  if (total === 0) return null;
  let where = liveEchoes(userId);
  let count = total;
  if (total > PREFER_OLDER_THRESHOLD) {
    const older = liveEchoes(userId, { savedAt: { lt: olderThanCutoff(now) } });
    const olderCount = await db.echo.count({ where: older });
    if (olderCount > 0) {
      where = older;
      count = olderCount;
    }
  }
  const echo = await db.echo.findFirst({
    where,
    orderBy: STABLE_ORDER,
    skip: dailyIndex(userId, day, count),
    include: ECHO_INCLUDE,
  });
  if (!echo) return null;

  await db.dailyEcho.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, echoId: echo.id },
    update: { echoId: echo.id },
  });
  return todaysEcho(serializeEcho(echo), day, now);
}

/**
 * Picks a random Echo for Echo Me Something (spec §31) and marks it as just surfaced.
 *
 * It skips the IDs the client recently showed and anything surfaced in the last 24 hours, then
 * relaxes those rules in turn when they would leave nothing to show.
 *
 * @param userId - The owner's user ID.
 * @param options - IDs to skip, plus the time and random source (injectable for tests).
 * @returns A random Echo, or null when the user has no Echoes.
 */
export async function getRandomEcho(
  userId: string,
  options: { exclude?: readonly string[]; now?: Date; random?: () => number } = {},
): Promise<EchoDto | null> {
  const now = options.now ?? new Date();
  const exclude = [...new Set(options.exclude ?? [])];
  const notExcluded: Prisma.EchoWhereInput = exclude.length ? { id: { notIn: exclude } } : {};
  const notRecent: Prisma.EchoWhereInput = {
    OR: [{ lastSurfacedAt: null }, { lastSurfacedAt: { lt: recentlySurfacedCutoff(now) } }],
  };
  const tiers = [
    liveEchoes(userId, { AND: [notExcluded, notRecent] }),
    liveEchoes(userId, notExcluded),
    liveEchoes(userId),
  ];
  const counts = await Promise.all(tiers.map((where) => db.echo.count({ where })));
  const pick = pickFromTiers(counts, options.random ?? Math.random);
  if (!pick) return null;

  const echo = await db.echo.findFirst({
    where: tiers[pick.tier],
    orderBy: STABLE_ORDER,
    skip: pick.skip,
    include: ECHO_INCLUDE,
  });
  if (!echo) return null;
  // updateMany so a concurrent delete can't make it throw; updatedAt is kept because surfacing an
  // Echo isn't an edit.
  await db.echo.updateMany({
    where: liveEchoes(userId, { id: echo.id }),
    data: { lastSurfacedAt: now, updatedAt: echo.updatedAt },
  });
  return serializeEcho(echo);
}

/**
 * Finds one Echo saved about a year, six months or a month ago (each plus or minus a week).
 *
 * There is no randomness: it takes the earliest-saved Echo in the first window that has one.
 *
 * @param userId - The owner's user ID.
 * @param now - The current time; injectable for tests.
 * @returns The Echo with a label such as "one year ago", or null when none matches.
 */
export async function getFromThePast(
  userId: string,
  now: Date = new Date(),
): Promise<{ echo: EchoDto; label: string } | null> {
  const windows = pastWindows(now);
  const rows = await Promise.all(
    windows.map(({ from, to }) =>
      db.echo.findFirst({
        where: liveEchoes(userId, { savedAt: { gte: from, lte: to } }),
        orderBy: STABLE_ORDER,
        include: ECHO_INCLUDE,
      }),
    ),
  );
  const index = rows.findIndex((row) => row !== null);
  if (index === -1) return null;
  return { echo: serializeEcho(rows[index]!), label: windows[index]!.label };
}

/** The four plain counts in the home page's "Your library" card. */
export type LibraryCounts = {
  echoes: number;
  favorites: number;
  collections: number;
  revisitsDue: number;
};

/**
 * Counts the user's Echoes, favorites, collections and due Revisits.
 *
 * @param userId - The owner's user ID.
 * @param now - The current time; injectable for tests.
 * @returns The counts.
 */
export async function getLibraryCounts(
  userId: string,
  now: Date = new Date(),
): Promise<LibraryCounts> {
  const [echoes, favorites, collections, revisitsDue] = await Promise.all([
    db.echo.count({ where: liveEchoes(userId) }),
    db.echo.count({ where: liveEchoes(userId, { isFavorite: true }) }),
    db.collection.count({ where: { userId } }),
    countDueRevisits(userId, now),
  ]);
  return { echoes, favorites, collections, revisitsDue };
}
