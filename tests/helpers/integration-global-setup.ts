import { execSync } from "node:child_process";
import { Client } from "pg";
import { testDatabaseUrl } from "./test-db.mts";

/**
 * Applies migrations to the local test database and empties every app table before the run.
 *
 * @returns Nothing.
 */
export default async function setup(): Promise<void> {
  const url = testDatabaseUrl();
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'",
    );
    if (rows.length > 0) {
      const tables = rows.map((row) => `"public"."${row.tablename}"`).join(", ");
      await client.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
    }
  } finally {
    await client.end();
  }
}
