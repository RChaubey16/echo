import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  GET as getEcho,
  PATCH as patchEcho,
  DELETE as deleteEcho,
} from "@/app/api/echoes/[id]/route";
import { GET as listEchoes, POST as postEcho } from "@/app/api/echoes/route";
import { db } from "@/server/db";
import type { EchoDto, EchoListDto } from "@/types/echo";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

const SECRET_QUOTE = "a line only this test should ever see, 7f3c";

const logLines: string[] = [];
const ctx = {} as never;
const idCtx = (id: string) => ({ params: Promise.resolve({ id }) });

function json(body: unknown, cookie: string, method = "POST"): RequestInit & { cookie: string } {
  return {
    method,
    cookie,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  };
}

async function create(user: TestUser, body: Record<string, unknown>): Promise<EchoDto> {
  const response = await postEcho(makeRequest("/api/echoes", json(body, user.cookie)), ctx);
  expect(response.status).toBe(201);
  return (await response.json()) as EchoDto;
}

async function list(user: TestUser, query = ""): Promise<EchoListDto> {
  const response = await listEchoes(
    makeRequest(`/api/echoes${query}`, { cookie: user.cookie }),
    ctx,
  );
  expect(response.status).toBe(200);
  return (await response.json()) as EchoListDto;
}

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  for (const method of ["info", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      logLines.push(args.map(String).join(" "));
    });
  }
  alice = await createTestUser(process.env.DATABASE_URL!, { name: "Alice" });
  bob = await createTestUser(process.env.DATABASE_URL!, { name: "Bob" });
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("Echo lifecycle", () => {
  it("creates, reads, updates, soft-deletes and then hides an Echo", async () => {
    const created = await create(alice, { quote: `  ${SECRET_QUOTE}  `, author: "", mood: "calm" });
    expect(created).toMatchObject({
      quote: SECRET_QUOTE,
      author: null,
      mood: "calm",
      isFavorite: false,
      favoritedAt: null,
    });
    expect(created).not.toHaveProperty("userId");
    expect(created).not.toHaveProperty("deletedAt");

    const got = await getEcho(
      makeRequest(`/api/echoes/${created.id}`, { cookie: alice.cookie }),
      idCtx(created.id),
    );
    expect(got.status).toBe(200);
    expect(await got.json()).toEqual(created);

    await new Promise((resolve) => setTimeout(resolve, 10));
    const patched = await patchEcho(
      makeRequest(
        `/api/echoes/${created.id}`,
        json({ author: "Someone", isFavorite: true }, alice.cookie, "PATCH"),
      ),
      idCtx(created.id),
    );
    expect(patched.status).toBe(200);
    const updated = (await patched.json()) as EchoDto;
    expect(updated.author).toBe("Someone");
    expect(updated.isFavorite).toBe(true);
    expect(updated.favoritedAt).not.toBeNull();
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(created.updatedAt).getTime(),
    );

    const unfavorited = await patchEcho(
      makeRequest(`/api/echoes/${created.id}`, json({ isFavorite: false }, alice.cookie, "PATCH")),
      idCtx(created.id),
    );
    expect(((await unfavorited.json()) as EchoDto).favoritedAt).toBeNull();

    const deleted = await deleteEcho(
      makeRequest(`/api/echoes/${created.id}`, { method: "DELETE", cookie: alice.cookie }),
      idCtx(created.id),
    );
    expect(deleted.status).toBe(204);

    const gone = await getEcho(
      makeRequest(`/api/echoes/${created.id}`, { cookie: alice.cookie }),
      idCtx(created.id),
    );
    expect(gone.status).toBe(404);
    expect(await gone.json()).toEqual({
      error: { code: "ECHO_NOT_FOUND", message: "Echo not found." },
    });

    const page = await list(alice);
    expect(page.items.map((echo) => echo.id)).not.toContain(created.id);

    const row = await db.echo.findUnique({ where: { id: created.id } });
    expect(row?.deletedAt).not.toBeNull();
  });

  it("rejects an empty quote with VALIDATION_ERROR", async () => {
    const response = await postEcho(
      makeRequest("/api/echoes", json({ quote: " " }, alice.cookie)),
      ctx,
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { code: string; fields: Record<string, string[]> };
    };
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.fields.quote).toEqual(["Add the quote you want to save."]);
  });

  it("rejects malformed JSON and an empty patch", async () => {
    const bad = await postEcho(
      makeRequest("/api/echoes", { method: "POST", cookie: alice.cookie, body: "{nope" }),
      ctx,
    );
    expect(bad.status).toBe(400);
    const echo = await create(alice, { quote: "Patch target" });
    const empty = await patchEcho(
      makeRequest(`/api/echoes/${echo.id}`, json({}, alice.cookie, "PATCH")),
      idCtx(echo.id),
    );
    expect(empty.status).toBe(400);
  });

  it("returns 404, not 500, for a malformed id", async () => {
    const response = await getEcho(
      makeRequest("/api/echoes/not-a-uuid", { cookie: alice.cookie }),
      idCtx("not-a-uuid"),
    );
    expect(response.status).toBe(404);
  });

  it("requires a session", async () => {
    expect((await listEchoes(makeRequest("/api/echoes"), ctx)).status).toBe(401);
    expect(
      (await postEcho(makeRequest("/api/echoes", { method: "POST", body: "{}" }), ctx)).status,
    ).toBe(401);
  });
});

describe("listing", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser(process.env.DATABASE_URL!, { name: "Lister" });
    const base = new Date("2026-01-01T00:00:00Z").getTime();
    const authors = ["Cage", null, "Angelou", "Basho", null];
    await db.echo.createMany({
      data: authors.map((author, index) => ({
        userId: user.user.id,
        quote: `Quote ${index}`,
        author,
        isFavorite: index % 2 === 0,
        savedAt: new Date(base + index * 60_000),
        updatedAt: new Date(base + (10 - index) * 60_000),
      })),
    });
  });

  it("paginates with hasMore and caps limit at 100", async () => {
    const first = await list(user, "?limit=2&page=1");
    expect(first).toMatchObject({ page: 1, limit: 2, total: 5, hasMore: true });
    expect(first.items).toHaveLength(2);
    const last = await list(user, "?limit=2&page=3");
    expect(last.items).toHaveLength(1);
    expect(last.hasMore).toBe(false);
    expect((await list(user, "?limit=1000")).limit).toBe(100);
  });

  it.each([
    ["newest", ["Quote 4", "Quote 3", "Quote 2", "Quote 1", "Quote 0"]],
    ["oldest", ["Quote 0", "Quote 1", "Quote 2", "Quote 3", "Quote 4"]],
    ["recently_updated", ["Quote 0", "Quote 1", "Quote 2", "Quote 3", "Quote 4"]],
    // Authors A→Z, then nulls last ordered by savedAt desc.
    ["author", ["Quote 2", "Quote 3", "Quote 0", "Quote 4", "Quote 1"]],
  ])("sorts by %s", async (sort, expected) => {
    const page = await list(user, `?sort=${sort}`);
    expect(page.items.map((echo) => echo.quote)).toEqual(expected);
  });

  it("filters favorites", async () => {
    const page = await list(user, "?favorite=true");
    expect(page.total).toBe(3);
    expect(page.items.every((echo) => echo.isFavorite)).toBe(true);
  });

  it("never includes another user's Echoes", async () => {
    const page = await list(user, "?limit=100");
    const ids = new Set(page.items.map((echo) => echo.id));
    const others = await db.echo.findMany({
      where: { userId: { not: user.user.id } },
      select: { id: true },
    });
    expect(others.some((echo) => ids.has(echo.id))).toBe(false);
  });
});

describe("authorization (spec §65 cases 1–3)", () => {
  it("returns 404 when user A reads, edits or deletes user B's Echo, and leaves B's row unchanged", async () => {
    const bobsEcho = await create(bob, { quote: "Bob's private line", author: "Bob" });
    const before = await db.echo.findUniqueOrThrow({ where: { id: bobsEcho.id } });
    const path = `/api/echoes/${bobsEcho.id}`;

    const read = await getEcho(makeRequest(path, { cookie: alice.cookie }), idCtx(bobsEcho.id));
    const edit = await patchEcho(
      makeRequest(path, json({ quote: "hijacked", isFavorite: true }, alice.cookie, "PATCH")),
      idCtx(bobsEcho.id),
    );
    const remove = await deleteEcho(
      makeRequest(path, { method: "DELETE", cookie: alice.cookie }),
      idCtx(bobsEcho.id),
    );

    for (const response of [read, edit, remove]) {
      expect(response.status).toBe(404);
      expect(((await response.json()) as { error: { code: string } }).error.code).toBe(
        "ECHO_NOT_FOUND",
      );
    }

    const after = await db.echo.findUniqueOrThrow({ where: { id: bobsEcho.id } });
    expect(after).toEqual(before);
  });
});

describe("logging", () => {
  it("never writes Echo content to the logs", () => {
    expect(logLines.length).toBeGreaterThan(0);
    const all = logLines.join("\n");
    expect(all).not.toContain(SECRET_QUOTE);
    expect(all).not.toContain("Bob's private line");
    expect(all).not.toContain("hijacked");
  });
});
