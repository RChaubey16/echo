import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DELETE as deleteCollection,
  GET as getCollection,
  PATCH as patchCollection,
} from "@/app/api/collections/[id]/route";
import { DELETE as removeFromCollection } from "@/app/api/collections/[id]/echoes/[echoId]/route";
import { POST as addToCollection } from "@/app/api/collections/[id]/echoes/route";
import { GET as listCollections, POST as postCollection } from "@/app/api/collections/route";
import {
  GET as getEcho,
  PATCH as patchEcho,
  DELETE as deleteEcho,
} from "@/app/api/echoes/[id]/route";
import { GET as listEchoes, POST as postEcho } from "@/app/api/echoes/route";
import { GET as search } from "@/app/api/search/route";
import { DELETE as deleteTag, PATCH as patchTag } from "@/app/api/tags/[id]/route";
import { GET as listTags, POST as postTag } from "@/app/api/tags/route";
import { db } from "@/server/db";
import { listSidebarCollections } from "@/server/services/collections";
import type {
  CollectionDetailDto,
  CollectionDto,
  EchoDto,
  EchoListDto,
  SearchResultsDto,
  TagDto,
} from "@/types/echo";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

const SECRET_REFLECTION = "a reflection only this test should see, c41d";

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

async function errorCode(response: Response): Promise<string> {
  return ((await response.json()) as { error: { code: string } }).error.code;
}

async function createEcho(user: TestUser, body: Record<string, unknown>): Promise<EchoDto> {
  const response = await postEcho(makeRequest("/api/echoes", json(body, user.cookie)), ctx);
  expect(response.status).toBe(201);
  return (await response.json()) as EchoDto;
}

async function readEcho(user: TestUser, id: string): Promise<Response> {
  return getEcho(makeRequest(`/api/echoes/${id}`, { cookie: user.cookie }), idCtx(id));
}

async function patch(user: TestUser, id: string, body: Record<string, unknown>): Promise<Response> {
  return patchEcho(makeRequest(`/api/echoes/${id}`, json(body, user.cookie, "PATCH")), idCtx(id));
}

async function createCollection(
  user: TestUser,
  body: Record<string, unknown>,
): Promise<CollectionDto> {
  const response = await postCollection(
    makeRequest("/api/collections", json(body, user.cookie)),
    ctx,
  );
  expect(response.status).toBe(201);
  return (await response.json()) as CollectionDto;
}

async function readCollection(user: TestUser, id: string): Promise<Response> {
  return getCollection(makeRequest(`/api/collections/${id}`, { cookie: user.cookie }), idCtx(id));
}

async function searchFor(user: TestUser, q: string): Promise<SearchResultsDto> {
  const response = await search(
    makeRequest(`/api/search?q=${encodeURIComponent(q)}`, { cookie: user.cookie }),
    ctx,
  );
  expect(response.status).toBe(200);
  return (await response.json()) as SearchResultsDto;
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

describe("tags", () => {
  it("creates tags from names, shows renames on the Echo, and keeps the Echo when a tag is deleted", async () => {
    const echo = await createEcho(alice, {
      quote: "Courage is grace under pressure.",
      tagNames: ["Courage", " courage ", "Work Life"],
    });
    expect(echo.tags.map((tag) => tag.name)).toEqual(["courage", "work life"]);

    const tags = (await (
      await listTags(makeRequest("/api/tags", { cookie: alice.cookie }), ctx)
    ).json()) as { items: TagDto[] };
    const courage = tags.items.find((tag) => tag.name === "courage")!;
    expect(courage.echoCount).toBe(1);

    // Creating an existing tag by name returns it instead of a duplicate.
    const again = await postTag(
      makeRequest("/api/tags", json({ name: "COURAGE" }, alice.cookie)),
      ctx,
    );
    expect(((await again.json()) as TagDto).id).toBe(courage.id);

    const renamed = await patchTag(
      makeRequest(`/api/tags/${courage.id}`, json({ name: "Bravery" }, alice.cookie, "PATCH")),
      idCtx(courage.id),
    );
    expect(renamed.status).toBe(200);
    const afterRename = (await (await readEcho(alice, echo.id)).json()) as EchoDto;
    expect(afterRename.tags.map((tag) => tag.name)).toEqual(["bravery", "work life"]);

    const clash = await patchTag(
      makeRequest(`/api/tags/${courage.id}`, json({ name: "work life" }, alice.cookie, "PATCH")),
      idCtx(courage.id),
    );
    expect(clash.status).toBe(400);
    expect(await clash.json()).toMatchObject({ error: { fields: { name: [expect.any(String)] } } });

    const removed = await deleteTag(
      makeRequest(`/api/tags/${courage.id}`, { method: "DELETE", cookie: alice.cookie }),
      idCtx(courage.id),
    );
    expect(removed.status).toBe(204);
    const afterDelete = await readEcho(alice, echo.id);
    expect(afterDelete.status).toBe(200);
    expect(((await afterDelete.json()) as EchoDto).tags.map((tag) => tag.name)).toEqual([
      "work life",
    ]);
  });

  it("replaces the whole tag set on update and filters the list by tag", async () => {
    const echo = await createEcho(alice, { quote: "Tag set target", tagNames: ["one", "two"] });
    const two = echo.tags.find((tag) => tag.name === "two")!;
    await new Promise((resolve) => setTimeout(resolve, 10));

    const response = await patch(alice, echo.id, { tagIds: [two.id], tagNames: ["three"] });
    expect(response.status).toBe(200);
    const updated = (await response.json()) as EchoDto;
    expect(updated.tags.map((tag) => tag.name)).toEqual(["three", "two"]);
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
      new Date(echo.updatedAt).getTime(),
    );

    const filtered = (await (
      await listEchoes(makeRequest(`/api/echoes?tag=${two.id}`, { cookie: alice.cookie }), ctx)
    ).json()) as EchoListDto;
    expect(filtered.items.map((item) => item.id)).toEqual([echo.id]);

    const cleared = (await (await patch(alice, echo.id, { tagIds: [] })).json()) as EchoDto;
    expect(cleared.tags).toEqual([]);
  });
});

describe("collections", () => {
  it("cycles accents, rejects a duplicate name in any case, and renames", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!, { name: "Collector" });
    const first = await createCollection(user, { name: "Books" });
    const second = await createCollection(user, { name: "Courage", description: "Brave lines" });
    expect(first.accent).toBe("lagoon");
    expect(second.accent).toBe("bronze");

    const duplicate = await postCollection(
      makeRequest("/api/collections", json({ name: "BOOKS" }, user.cookie)),
      ctx,
    );
    expect(duplicate.status).toBe(400);
    expect(await duplicate.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR", fields: { name: [expect.any(String)] } },
    });

    const renamed = await patchCollection(
      makeRequest(`/api/collections/${first.id}`, json({ name: "Novels" }, user.cookie, "PATCH")),
      idCtx(first.id),
    );
    expect(((await renamed.json()) as CollectionDto).name).toBe("Novels");

    const list = (await (
      await listCollections(makeRequest("/api/collections", { cookie: user.cookie }), ctx)
    ).json()) as { items: CollectionDto[] };
    expect(list.items.map((collection) => collection.name)).toEqual(["Courage", "Novels"]);
  });

  it("counts only live Echoes and keeps the Echoes when the collection is deleted", async () => {
    const collection = await createCollection(alice, { name: "For Difficult Days" });
    const kept = await createEcho(alice, {
      quote: "This too shall pass.",
      collectionIds: [collection.id],
    });
    const added = await createEcho(alice, { quote: "Rest is resistance." });
    const doomed = await createEcho(alice, {
      quote: "Soon deleted",
      collectionIds: [collection.id],
    });

    const addResponse = await addToCollection(
      makeRequest(
        `/api/collections/${collection.id}/echoes`,
        json({ echoId: added.id }, alice.cookie),
      ),
      idCtx(collection.id),
    );
    expect(addResponse.status).toBe(200);
    expect(((await addResponse.json()) as CollectionDto).echoCount).toBe(3);

    await deleteEcho(
      makeRequest(`/api/echoes/${doomed.id}`, { method: "DELETE", cookie: alice.cookie }),
      idCtx(doomed.id),
    );
    const detail = (await (
      await readCollection(alice, collection.id)
    ).json()) as CollectionDetailDto;
    expect(detail.echoCount).toBe(2);
    expect(detail.echoes.items.map((echo) => echo.id).sort()).toEqual([kept.id, added.id].sort());
    expect(detail.echoes.items.find((echo) => echo.id === kept.id)?.collections).toEqual([
      { id: collection.id, name: "For Difficult Days", accent: collection.accent },
    ]);

    const removed = await removeFromCollection(
      makeRequest(`/api/collections/${collection.id}/echoes/${added.id}`, {
        method: "DELETE",
        cookie: alice.cookie,
      }),
      { params: Promise.resolve({ id: collection.id, echoId: added.id }) },
    );
    expect(((await removed.json()) as CollectionDto).echoCount).toBe(1);

    const deleted = await deleteCollection(
      makeRequest(`/api/collections/${collection.id}`, { method: "DELETE", cookie: alice.cookie }),
      idCtx(collection.id),
    );
    expect(deleted.status).toBe(204);
    expect((await readCollection(alice, collection.id)).status).toBe(404);
    for (const echo of [kept, added]) {
      const response = await readEcho(alice, echo.id);
      expect(response.status).toBe(200);
      expect(((await response.json()) as EchoDto).collections).toEqual([]);
    }
  });
});

describe("sidebar collections", () => {
  it("returns the first few collections alphabetically, the user's total, and live counts only", async () => {
    const user = await createTestUser(process.env.DATABASE_URL!, { name: "Sidebar" });
    const names = ["Delta", "alpha", "Charlie", "bravo"];
    const created = [];
    for (const name of names) created.push(await createCollection(user, { name }));
    const alpha = created[1]!;
    await createEcho(user, { quote: "Kept", collectionIds: [alpha.id] });
    const doomed = await createEcho(user, { quote: "Gone", collectionIds: [alpha.id] });
    await deleteEcho(
      makeRequest(`/api/echoes/${doomed.id}`, { method: "DELETE", cookie: user.cookie }),
      idCtx(doomed.id),
    );

    const sidebar = await listSidebarCollections(user.user.id, 3);
    expect(sidebar.total).toBe(4);
    expect(sidebar.items.map((collection) => collection.name)).toEqual([
      "alpha",
      "bravo",
      "Charlie",
    ]);
    expect(sidebar.items[0]).toEqual({
      id: alpha.id,
      name: "alpha",
      accent: alpha.accent,
      echoCount: 1,
    });
    expect((await listSidebarCollections(alice.user.id, 5)).items.map((c) => c.id)).not.toContain(
      alpha.id,
    );
  });
});

describe("search", () => {
  let searcher: TestUser;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    searcher = await createTestUser(process.env.DATABASE_URL!, { name: "Searcher" });
    const collection = await createCollection(searcher, { name: "Lighthouse" });
    ids.quote = (await createEcho(searcher, { quote: "Begin anywhere, said the composer." })).id;
    ids.author = (await createEcho(searcher, { quote: "Silence", author: "Zanzibar Quill" })).id;
    ids.source = (await createEcho(searcher, { quote: "Line", source: "Orchard Notebook" })).id;
    ids.reflection = (
      await createEcho(searcher, {
        quote: "Plain",
        reflection: `Maybe tomorrow. ${SECRET_REFLECTION}`,
      })
    ).id;
    ids.tag = (await createEcho(searcher, { quote: "Tagged", tagNames: ["serendipity"] })).id;
    ids.collection = (
      await createEcho(searcher, { quote: "Kept", collectionIds: [collection.id] })
    ).id;
    ids.partial = (await createEcho(searcher, { quote: "Extraordinarily patient rivers" })).id;
    ids.deleted = (await createEcho(searcher, { quote: "Begin anywhere, but deleted" })).id;
    await deleteEcho(
      makeRequest(`/api/echoes/${ids.deleted}`, { method: "DELETE", cookie: searcher.cookie }),
      idCtx(ids.deleted),
    );
  });

  it.each([
    ["a quote word", "composer", "quote"],
    ["author", "zanzibar", "author"],
    ["source", "orchard", "source"],
    ["a word in the reflection", "tomorrow", "reflection"],
    ["tag name", "serendipity", "tag"],
    ["collection name", "lighthouse", "collection"],
    ["a partial word", "ordinar", "partial"],
  ])("finds by %s", async (_label, q, key) => {
    const page = await searchFor(searcher, q);
    expect(page.results.map((echo) => echo.id)).toContain(ids[key]);
  });

  it("returns the full Echo DTO with pagination", async () => {
    const page = await searchFor(searcher, "serendipity");
    expect(page).toMatchObject({ query: "serendipity", page: 1, total: 1, hasMore: false });
    expect(page.results[0]?.tags).toEqual([{ id: expect.any(String), name: "serendipity" }]);
  });

  it("never returns deleted Echoes", async () => {
    const page = await searchFor(searcher, "begin anywhere");
    expect(page.results.map((echo) => echo.id)).toEqual([ids.quote]);
  });

  it("treats % and _ literally and handles an empty query", async () => {
    expect((await searchFor(searcher, "%")).results).toEqual([]);
    expect((await searchFor(searcher, "_")).results).toEqual([]);
    expect(await searchFor(searcher, "   ")).toMatchObject({ results: [], total: 0 });
  });

  it("ranks an exact tag match above a passing mention", async () => {
    const mention = await createEcho(searcher, { quote: "A note about serendipity in passing" });
    const page = await searchFor(searcher, "serendipity");
    expect(page.results.map((echo) => echo.id)).toEqual([ids.tag, mention.id]);
  });

  it("also filters the list with ?search=", async () => {
    const page = (await (
      await listEchoes(makeRequest("/api/echoes?search=ORCHARD", { cookie: searcher.cookie }), ctx)
    ).json()) as EchoListDto;
    expect(page.items.map((echo) => echo.id)).toEqual([ids.source]);
  });
});

describe("authorization (spec §65 case 4 and join-table ownership)", () => {
  let bobsTag: TagDto;
  let bobsCollection: CollectionDto;
  let alicesEcho: EchoDto;

  beforeAll(async () => {
    const tagResponse = await postTag(
      makeRequest("/api/tags", json({ name: "bob-only" }, bob.cookie)),
      ctx,
    );
    bobsTag = (await tagResponse.json()) as TagDto;
    bobsCollection = await createCollection(bob, { name: "Bob's shelf" });
    alicesEcho = await createEcho(alice, { quote: "Alice's own line" });
  });

  it("returns 403 when A attaches B's tag or collection on create or update", async () => {
    for (const body of [{ tagIds: [bobsTag.id] }, { collectionIds: [bobsCollection.id] }]) {
      const created = await postEcho(
        makeRequest("/api/echoes", json({ quote: "Sneaky", ...body }, alice.cookie)),
        ctx,
      );
      expect(created.status).toBe(403);
      expect(await errorCode(created)).toBe("FORBIDDEN");

      const updated = await patch(alice, alicesEcho.id, body);
      expect(updated.status).toBe(403);
    }
    expect(await db.echoTag.count({ where: { tagId: bobsTag.id } })).toBe(0);
    expect(await db.echoCollection.count({ where: { collectionId: bobsCollection.id } })).toBe(0);
    expect(await db.echo.count({ where: { userId: alice.user.id, quote: "Sneaky" } })).toBe(0);
  });

  it("returns 404 when A adds A's Echo to B's collection, or removes from it", async () => {
    const added = await addToCollection(
      makeRequest(
        `/api/collections/${bobsCollection.id}/echoes`,
        json({ echoId: alicesEcho.id }, alice.cookie),
      ),
      idCtx(bobsCollection.id),
    );
    expect(added.status).toBe(404);
    expect(await errorCode(added)).toBe("COLLECTION_NOT_FOUND");

    const removed = await removeFromCollection(
      makeRequest(`/api/collections/${bobsCollection.id}/echoes/${alicesEcho.id}`, {
        method: "DELETE",
        cookie: alice.cookie,
      }),
      { params: Promise.resolve({ id: bobsCollection.id, echoId: alicesEcho.id }) },
    );
    expect(removed.status).toBe(404);
    expect(await db.echoCollection.count({ where: { collectionId: bobsCollection.id } })).toBe(0);
  });

  it("returns 404 when A adds B's Echo to A's collection", async () => {
    const alicesCollection = await createCollection(alice, { name: "Alice's shelf" });
    const bobsEcho = await createEcho(bob, { quote: "Bob's line" });
    const response = await addToCollection(
      makeRequest(
        `/api/collections/${alicesCollection.id}/echoes`,
        json({ echoId: bobsEcho.id }, alice.cookie),
      ),
      idCtx(alicesCollection.id),
    );
    expect(response.status).toBe(404);
    expect(await errorCode(response)).toBe("ECHO_NOT_FOUND");
  });

  it("returns 404 when A reads, renames or deletes B's collection or tag", async () => {
    const id = bobsCollection.id;
    const responses = [
      await readCollection(alice, id),
      await patchCollection(
        makeRequest(`/api/collections/${id}`, json({ name: "Mine now" }, alice.cookie, "PATCH")),
        idCtx(id),
      ),
      await deleteCollection(
        makeRequest(`/api/collections/${id}`, { method: "DELETE", cookie: alice.cookie }),
        idCtx(id),
      ),
      await patchTag(
        makeRequest(`/api/tags/${bobsTag.id}`, json({ name: "mine" }, alice.cookie, "PATCH")),
        idCtx(bobsTag.id),
      ),
      await deleteTag(
        makeRequest(`/api/tags/${bobsTag.id}`, { method: "DELETE", cookie: alice.cookie }),
        idCtx(bobsTag.id),
      ),
    ];
    for (const response of responses) expect(response.status).toBe(404);
    expect(await db.collection.findUnique({ where: { id } })).toMatchObject({
      name: "Bob's shelf",
    });
    expect(await db.tag.findUnique({ where: { id: bobsTag.id } })).toMatchObject({
      name: "bob-only",
    });
  });

  it("returns 404 for malformed collection and tag IDs", async () => {
    expect((await readCollection(alice, "not-a-uuid")).status).toBe(404);
    const response = await deleteTag(
      makeRequest("/api/tags/not-a-uuid", { method: "DELETE", cookie: alice.cookie }),
      idCtx("not-a-uuid"),
    );
    expect(response.status).toBe(404);
  });

  it("never shows B's tags or collections in A's lists, or B's Echoes in A's search", async () => {
    await createEcho(bob, {
      quote: "Exactmatchword only Bob has",
      tagNames: ["exactmatchword"],
      collectionIds: [bobsCollection.id],
    });
    const tags = (await (
      await listTags(makeRequest("/api/tags", { cookie: alice.cookie }), ctx)
    ).json()) as { items: TagDto[] };
    expect(tags.items.map((tag) => tag.id)).not.toContain(bobsTag.id);
    const collections = (await (
      await listCollections(makeRequest("/api/collections", { cookie: alice.cookie }), ctx)
    ).json()) as { items: CollectionDto[] };
    expect(collections.items.map((collection) => collection.id)).not.toContain(bobsCollection.id);

    for (const q of ["Exactmatchword", "exactmatch", "Bob's shelf", "bob-only"]) {
      expect((await searchFor(alice, q)).results).toEqual([]);
    }
    expect((await searchFor(bob, "Exactmatchword")).total).toBe(1);
  });

  it("returns nothing when A filters the list by B's tag or collection", async () => {
    for (const query of [`tag=${bobsTag.id}`, `collection=${bobsCollection.id}`]) {
      const page = (await (
        await listEchoes(makeRequest(`/api/echoes?${query}`, { cookie: alice.cookie }), ctx)
      ).json()) as EchoListDto;
      expect(page.items).toEqual([]);
    }
  });
});

describe("logging", () => {
  it("never writes Echo or reflection content to the logs", () => {
    const all = logLines.join("\n");
    expect(all).not.toContain(SECRET_REFLECTION);
    expect(all).not.toContain("Exactmatchword");
  });
});
