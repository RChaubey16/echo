import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { searchEchoes } from "@/server/services/search";
import { createTestUser, type TestUser } from "../helpers/session";

// Spec §44: search stays under 500 ms p95 for a 5,000-Echo library.
const ECHO_COUNT = 5_000;
const P95_BUDGET_MS = 500;

const WORDS = (
  "begin anywhere courage river silence lantern orchard morning patience harbor quiet ember " +
  "journey kindness thunder meadow letter window garden promise shadow balance wonder"
).split(" ");

/**
 * Builds deterministic filler text from the word list.
 *
 * @param seed - The row number.
 * @param length - The number of words.
 * @returns A sentence of words chosen from the seed.
 */
function sentence(seed: number, length: number): string {
  return Array.from({ length }, (_, i) => WORDS[(seed * 7 + i * 13) % WORDS.length]).join(" ");
}

let user: TestUser;
const client = new Client({ connectionString: process.env.DATABASE_URL });

beforeAll(async () => {
  user = await createTestUser(process.env.DATABASE_URL!, { name: "Heavy reader" });
  const rows = Array.from({ length: ECHO_COUNT }, (_, i) => ({
    userId: user.user.id,
    quote: `${sentence(i, 18)} number${i}`,
    author: i % 3 === 0 ? `Author ${i % 97}` : null,
    source: i % 5 === 0 ? `Source ${i % 41}` : null,
    reflection: i % 2 === 0 ? sentence(i + 1, 30) : null,
  }));
  for (let i = 0; i < rows.length; i += 1_000) {
    await db.echo.createMany({ data: rows.slice(i, i + 1_000) });
  }
  await client.connect();
  await client.query("ANALYZE echoes");
}, 120_000);

afterAll(() => client.end());

describe("search performance", () => {
  it(`keeps p95 under ${P95_BUDGET_MS} ms on ${ECHO_COUNT.toLocaleString("en-US")} Echoes`, async () => {
    const queries = [
      "courage",
      "begin anywhere",
      "lantern harbor",
      "number4242",
      "orch",
      "Author 12",
    ];
    await searchEchoes(user.user.id, { q: "warmup", page: 1, limit: 20 });
    const timings: number[] = [];
    for (let round = 0; round < 5; round++) {
      for (const q of queries) {
        const started = performance.now();
        const page = await searchEchoes(user.user.id, { q, page: 1, limit: 20 });
        timings.push(performance.now() - started);
        expect(page.results.length).toBeGreaterThan(0);
      }
    }
    timings.sort((a, b) => a - b);
    const p95 = timings[Math.ceil(timings.length * 0.95) - 1]!;
    process.stdout.write(`search p95 ${p95.toFixed(1)} ms over ${timings.length} queries\n`);
    expect(p95).toBeLessThan(P95_BUDGET_MS);
  });

  // At 5,000 rows (all one user's) the table is ~500 pages and Postgres rightly prefers a ~1 ms
  // sequential scan, or the user_id btree. So this checks that the GIN index *can* serve the
  // full-text predicate, i.e. that it matches the query's column and text-search config.
  it("can serve the full-text match from the GIN index", async () => {
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL enable_seqscan = off");
      const { rows } = await client.query<{ "QUERY PLAN": string }>(
        `EXPLAIN ANALYZE SELECT id FROM echoes
          WHERE search_vector @@ websearch_to_tsquery('simple', 'number4242')`,
      );
      const plan = rows.map((row) => row["QUERY PLAN"]).join("\n");
      expect(plan).toContain("echoes_search_idx");
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
