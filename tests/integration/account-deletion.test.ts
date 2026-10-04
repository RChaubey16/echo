import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETE as deleteAccount } from "@/app/api/account/route";
import { DELETE as deleteEcho } from "@/app/api/echoes/[id]/route";
import { POST as postEcho } from "@/app/api/echoes/route";
import { GET as today } from "@/app/api/echoes/today/route";
import { GET as getMe } from "@/app/api/me/route";
import { POST as postRevisit } from "@/app/api/revisits/route";
import type { EchoDto } from "@/types/echo";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

const ctx = {} as never;

/** Every table holding user data, and how to count one user's rows in it. */
const USER_TABLES: Record<string, string> = {
  users: "SELECT count(*) FROM users WHERE id = $1",
  accounts: "SELECT count(*) FROM accounts WHERE user_id = $1",
  sessions: "SELECT count(*) FROM sessions WHERE user_id = $1",
  echoes: "SELECT count(*) FROM echoes WHERE user_id = $1",
  tags: "SELECT count(*) FROM tags WHERE user_id = $1",
  collections: "SELECT count(*) FROM collections WHERE user_id = $1",
  revisits: "SELECT count(*) FROM revisits WHERE user_id = $1",
  daily_echoes: "SELECT count(*) FROM daily_echoes WHERE user_id = $1",
  echo_tags:
    "SELECT count(*) FROM echo_tags et JOIN tags t ON t.id = et.tag_id WHERE t.user_id = $1",
  echo_collections:
    "SELECT count(*) FROM echo_collections ec JOIN collections c ON c.id = ec.collection_id WHERE c.user_id = $1",
};

let pg: Client;
let doomed: TestUser;
let survivor: TestUser;

/**
 * Counts one user's rows in every user-data table.
 *
 * @param userId - The user's ID.
 * @returns The row count per table.
 */
async function countRows(userId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const [table, sql] of Object.entries(USER_TABLES)) {
    const { rows } = await pg.query<{ count: string }>(sql, [userId]);
    counts[table] = Number(rows[0]!.count);
  }
  return counts;
}

/**
 * Gives a user a full dataset: Echoes with tags and collections, a soft-deleted Echo, a Revisit,
 * a Today's Echo pin and a linked Google account.
 *
 * @param user - The user to fill.
 * @returns Nothing.
 */
async function fill(user: TestUser): Promise<void> {
  const send = (body: unknown) =>
    makeRequest("/api/echoes", {
      method: "POST",
      cookie: user.cookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const echo = (await (
    await postEcho(
      send({ quote: "Kept forever?", reflection: "No.", tagNames: ["gone"], isFavorite: true }),
      ctx,
    )
  ).json()) as EchoDto;
  await pg.query(
    `INSERT INTO collections (id, user_id, name, updated_at) VALUES (gen_random_uuid(), $1, 'Doomed', now())`,
    [user.user.id],
  );
  await pg.query(
    `INSERT INTO echo_collections (echo_id, collection_id)
       SELECT $1, id FROM collections WHERE user_id = $2`,
    [echo.id, user.user.id],
  );
  const deleted = (await (await postEcho(send({ quote: "Soft-deleted" }), ctx)).json()) as EchoDto;
  await deleteEcho(
    makeRequest(`/api/echoes/${deleted.id}`, { method: "DELETE", cookie: user.cookie }),
    { params: Promise.resolve({ id: deleted.id }) },
  );
  await postRevisit(
    makeRequest("/api/revisits", {
      method: "POST",
      cookie: user.cookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        echoId: echo.id,
        scheduledFor: new Date(Date.now() + 86_400_000 * 3).toISOString(),
      }),
    }),
    ctx,
  );
  await today(makeRequest("/api/echoes/today", { cookie: user.cookie }), ctx);
  await pg.query(
    `INSERT INTO accounts (user_id, type, provider, provider_account_id)
       VALUES ($1, 'oidc', 'google', $2)`,
    [user.user.id, `google-${user.user.id}`],
  );
}

/**
 * Sends DELETE /api/account with a confirmation.
 *
 * @param user - Who is signed in.
 * @param confirm - What the user typed.
 * @returns The response.
 */
function requestDeletion(user: TestUser, confirm: string): Promise<Response> {
  return deleteAccount(
    makeRequest("/api/account", {
      method: "DELETE",
      cookie: user.cookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm }),
    }),
    ctx,
  );
}

beforeAll(async () => {
  pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  doomed = await createTestUser(process.env.DATABASE_URL!, { name: "Doomed" });
  survivor = await createTestUser(process.env.DATABASE_URL!, { name: "Survivor" });
  await fill(doomed);
  await fill(survivor);
});

afterAll(async () => {
  await pg.end();
});

describe("DELETE /api/account", () => {
  it("refuses without the typed confirmation", async () => {
    const response = await requestDeletion(doomed, "delete please");
    expect(response.status).toBe(400);
    expect((await countRows(doomed.user.id)).users).toBe(1);
  });

  it("deletes every row the user owns and nothing of anyone else's", async () => {
    const before = await countRows(doomed.user.id);
    for (const table of Object.keys(USER_TABLES)) expect(before[table], table).toBeGreaterThan(0);
    const survivorBefore = await countRows(survivor.user.id);

    const response = await requestDeletion(doomed, "DELETE");
    expect(response.status).toBe(204);
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((cookie) => /^authjs\.session-token=;.*Max-Age=0/.test(cookie))).toBe(true);

    const after = await countRows(doomed.user.id);
    for (const table of Object.keys(USER_TABLES)) expect(after[table], table).toBe(0);
    expect(await countRows(survivor.user.id)).toEqual(survivorBefore);
  });

  it("ends the session: the old cookie no longer signs anyone in", async () => {
    const response = await getMe(makeRequest("/api/me", { cookie: doomed.cookie }), ctx);
    expect(response.status).toBe(401);
  });

  it("accepts the user's email as the confirmation", async () => {
    const response = await requestDeletion(survivor, survivor.user.email.toUpperCase());
    expect(response.status).toBe(204);
    expect((await countRows(survivor.user.id)).users).toBe(0);
  });
});
