import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { containsPattern } from "@/lib/sql";
import { db } from "@/server/db";
import { ECHO_INCLUDE, liveEchoes, serializeEcho } from "@/server/services/echoes";
import type { SearchQuery } from "@/server/validation/echo";
import { normalizeTagName } from "@/server/validation/tag";
import type { SearchResultsDto } from "@/types/echo";

/** Added to the text rank when an Echo has a tag or collection named exactly like the query. */
const EXACT_NAME_BONUS = 1;

/**
 * Searches the user's live Echoes by quote, author, source, reflection, tag and collection.
 *
 * An Echo matches on full-text words (`websearch_to_tsquery`, so quotes and `-word` work), on a
 * partial word in its own text, or on a tag or collection whose name contains the query. Results
 * are ranked by `ts_rank` plus a bonus for an exact tag or collection name, then newest first.
 * Every branch is scoped to the user and to Echoes that aren't deleted.
 *
 * @param userId - The owner's user ID.
 * @param query - The validated query text, page and limit.
 * @returns One page of results with the full Echo DTO for each.
 */
export async function searchEchoes(userId: string, query: SearchQuery): Promise<SearchResultsDto> {
  const { q, page, limit } = query;
  const empty = { results: [], query: q, page, limit, total: 0, hasMore: false };
  if (q === "") return empty;

  const pattern = containsPattern(q);
  const exactTag = normalizeTagName(q);
  const exactCollection = q.toLowerCase();
  const offset = (page - 1) * limit;

  const rows: { id: string; total: bigint }[] = await db.$queryRaw<
    { id: string; total: bigint }[]
  >(Prisma.sql`
    WITH input AS (SELECT websearch_to_tsquery('simple', ${q}) AS tsq),
    matches AS (
      SELECT e.id FROM echoes e, input
       WHERE e.user_id = ${userId}::uuid AND e.deleted_at IS NULL
         AND e.search_vector @@ input.tsq
      UNION
      SELECT e.id FROM echoes e
       WHERE e.user_id = ${userId}::uuid AND e.deleted_at IS NULL
         AND (e.quote ILIKE ${pattern} OR e.author ILIKE ${pattern}
              OR e.source ILIKE ${pattern} OR e.reflection ILIKE ${pattern})
      UNION
      SELECT et.echo_id FROM echo_tags et JOIN tags t ON t.id = et.tag_id
       WHERE t.user_id = ${userId}::uuid AND t.name ILIKE ${pattern}
      UNION
      SELECT ec.echo_id FROM echo_collections ec JOIN collections c ON c.id = ec.collection_id
       WHERE c.user_id = ${userId}::uuid AND c.name ILIKE ${pattern}
    )
    SELECT e.id, count(*) OVER () AS total
      FROM matches m
      JOIN echoes e ON e.id = m.id AND e.user_id = ${userId}::uuid AND e.deleted_at IS NULL
      CROSS JOIN input
     ORDER BY
       ts_rank(e.search_vector, input.tsq)
       + CASE WHEN EXISTS (
           SELECT 1 FROM echo_tags et JOIN tags t ON t.id = et.tag_id
            WHERE et.echo_id = e.id AND t.name = ${exactTag}
         ) THEN ${EXACT_NAME_BONUS} ELSE 0 END
       + CASE WHEN EXISTS (
           SELECT 1 FROM echo_collections ec JOIN collections c ON c.id = ec.collection_id
            WHERE ec.echo_id = e.id AND lower(c.name) = ${exactCollection}
         ) THEN ${EXACT_NAME_BONUS} ELSE 0 END
       DESC,
       e.saved_at DESC,
       e.id
     LIMIT ${limit} OFFSET ${offset}
  `);
  const first = rows[0];
  if (!first) return empty;

  const ids = rows.map((row) => row.id);
  const echoes = await db.echo.findMany({
    where: liveEchoes(userId, { id: { in: ids } }),
    include: ECHO_INCLUDE,
  });
  const byId = new Map(echoes.map((echo) => [echo.id, echo]));
  const results = ids.flatMap((id) => {
    const echo = byId.get(id);
    return echo ? [serializeEcho(echo)] : [];
  });
  const total = Number(first.total);
  return { results, query: q, page, limit, total, hasMore: offset + rows.length < total };
}
