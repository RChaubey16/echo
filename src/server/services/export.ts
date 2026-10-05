import "server-only";
import { csvRow } from "@/lib/csv";
import { db } from "@/server/db";
import { liveEchoes } from "@/server/services/echoes";

export const EXPORT_FORMATS = ["json", "csv"] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Echoes are read in pages of this size, so a large library never sits in memory at once. */
const EXPORT_BATCH_SIZE = 500;

/** One exported Echo (spec §54), with names instead of IDs so the file stands on its own. */
type ExportedEcho = {
  id: string;
  quote: string;
  author: string | null;
  source: string | null;
  reflection: string | null;
  mood: string | null;
  isFavorite: boolean;
  favoritedAt: string | null;
  tags: string[];
  collections: string[];
  revisits: Array<{ scheduledFor: string; completedAt: string | null }>;
  savedAt: string;
  updatedAt: string;
};

export const CSV_COLUMNS = [
  "id",
  "quote",
  "author",
  "source",
  "reflection",
  "mood",
  "is_favorite",
  "favorited_at",
  "tags",
  "collections",
  "next_revisit",
  "saved_at",
  "updated_at",
] as const;

/**
 * Reads the user's live Echoes oldest first, one batch at a time, using a keyset cursor.
 *
 * @param userId - The owner's user ID.
 * @param batchSize - How many Echoes to read per query.
 * @returns An async iterator of exported Echoes.
 */
export async function* exportedEchoes(
  userId: string,
  batchSize: number = EXPORT_BATCH_SIZE,
): AsyncGenerator<ExportedEcho> {
  let cursor: { id: string } | undefined;
  for (;;) {
    const rows = await db.echo.findMany({
      where: liveEchoes(userId),
      orderBy: [{ savedAt: "asc" }, { id: "asc" }],
      take: batchSize,
      ...(cursor ? { cursor, skip: 1 } : {}),
      select: {
        id: true,
        quote: true,
        author: true,
        source: true,
        reflection: true,
        mood: true,
        isFavorite: true,
        favoritedAt: true,
        savedAt: true,
        updatedAt: true,
        tags: { select: { tag: { select: { name: true } } } },
        collections: { select: { collection: { select: { name: true } } } },
        revisits: {
          where: { userId },
          orderBy: { scheduledFor: "asc" },
          select: { scheduledFor: true, completedAt: true },
        },
      },
    });
    for (const row of rows) {
      yield {
        id: row.id,
        quote: row.quote,
        author: row.author,
        source: row.source,
        reflection: row.reflection,
        mood: row.mood,
        isFavorite: row.isFavorite,
        favoritedAt: row.favoritedAt?.toISOString() ?? null,
        tags: row.tags.map(({ tag }) => tag.name).sort(),
        collections: row.collections
          .map(({ collection }) => collection.name)
          .sort((a, b) => a.localeCompare(b)),
        revisits: row.revisits.map((revisit) => ({
          scheduledFor: revisit.scheduledFor.toISOString(),
          completedAt: revisit.completedAt?.toISOString() ?? null,
        })),
        savedAt: row.savedAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
    const last = rows.at(-1);
    if (!last || rows.length < batchSize) return;
    cursor = { id: last.id };
  }
}

/**
 * Builds the export file name, dated in UTC.
 *
 * @param format - "json" or "csv".
 * @param now - The export time.
 * @returns A name like "echo-export-2026-10-04.json".
 */
function exportFileName(format: ExportFormat, now: Date = new Date()): string {
  return `echo-export-${now.toISOString().slice(0, 10)}.${format}`;
}

/**
 * Formats one Echo as a CSV line; tags and collections are joined with "; ".
 *
 * @param echo - The exported Echo.
 * @returns The CSV line.
 */
function echoCsvRow(echo: ExportedEcho): string {
  const nextRevisit = echo.revisits.find((revisit) => revisit.completedAt === null);
  return csvRow([
    echo.id,
    echo.quote,
    echo.author,
    echo.source,
    echo.reflection,
    echo.mood,
    echo.isFavorite,
    echo.favoritedAt,
    echo.tags.join("; "),
    echo.collections.join("; "),
    nextRevisit?.scheduledFor ?? null,
    echo.savedAt,
    echo.updatedAt,
  ]);
}

/**
 * Yields the JSON export in pieces: the account, collections and tags first, then each Echo.
 *
 * The pieces concatenate to one JSON document in the spec §54 shape, extended with the account,
 * the full collection and tag lists (including empty ones) and each Echo's Revisits.
 *
 * @param userId - The owner's user ID.
 * @param now - The export time.
 * @returns An async iterator of JSON text chunks.
 */
async function* jsonChunks(userId: string, now: Date): AsyncGenerator<string> {
  const [user, collections, tags] = await Promise.all([
    db.user.findFirst({
      where: { id: userId },
      select: { email: true, name: true, createdAt: true },
    }),
    db.collection.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { name: true, description: true, accent: true, createdAt: true },
    }),
    db.tag.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  const head = {
    exportedAt: now.toISOString(),
    account: {
      email: user?.email ?? null,
      name: user?.name ?? null,
      createdAt: user?.createdAt.toISOString() ?? null,
    },
    collections: collections.map((collection) => ({
      ...collection,
      createdAt: collection.createdAt.toISOString(),
    })),
    tags: tags.map((tag) => tag.name),
  };
  // Open the document, leaving the echoes array for the stream to fill.
  yield `${JSON.stringify(head).slice(0, -1)},"echoes":[`;
  let first = true;
  for await (const echo of exportedEchoes(userId)) {
    yield `${first ? "" : ","}${JSON.stringify(echo)}`;
    first = false;
  }
  yield "]}";
}

/**
 * Yields the CSV export in pieces: a UTF-8 byte-order mark and header, then one row per Echo.
 *
 * @param userId - The owner's user ID.
 * @returns An async iterator of CSV text chunks.
 */
async function* csvChunks(userId: string): AsyncGenerator<string> {
  // The BOM makes Excel read the file as UTF-8, so quotes in any language survive.
  yield `﻿${csvRow([...CSV_COLUMNS])}`;
  for await (const echo of exportedEchoes(userId)) yield echoCsvRow(echo);
}

/**
 * Streams the user's whole library as a JSON or CSV download (spec §54).
 *
 * @param userId - The owner's user ID.
 * @param format - "json" or "csv".
 * @param now - The export time, used in the file and its name.
 * @returns A streaming attachment response.
 */
export function exportResponse(
  userId: string,
  format: ExportFormat,
  now: Date = new Date(),
): Response {
  const chunks = format === "json" ? jsonChunks(userId, now) : csvChunks(userId);
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await chunks.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await chunks.return(undefined);
    },
  });
  return new Response(body, {
    headers: {
      "content-type":
        format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFileName(format, now)}"`,
    },
  });
}
