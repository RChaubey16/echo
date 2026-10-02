import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Supabase exposes `public` through PostgREST as the anon/authenticated roles. Every table must
// stay unreadable to them even if the Data API is switched on.
const client = new Client({ connectionString: process.env.DATABASE_URL });

beforeAll(() => client.connect());
afterAll(() => client.end());

describe("Data API lockdown", () => {
  it("enables row-level security on every public table", async () => {
    const { rows } = await client.query<{ relname: string; relrowsecurity: boolean }>(
      `SELECT c.relname, c.relrowsecurity
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'`,
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((row) => !row.relrowsecurity).map((row) => row.relname)).toEqual([]);
  });

  it.each(["anon", "authenticated"])("gives %s no privileges on public tables", async (role) => {
    const { rows } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.role_table_grants
        WHERE table_schema = 'public' AND grantee = $1`,
      [role],
    );
    expect(rows.map((row) => row.table_name)).toEqual([]);
  });
});
