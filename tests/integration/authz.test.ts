import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CollectionDto, EchoDto, RevisitDto, TagDto } from "@/types/echo";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

// The spec §65 authorization suite. User A attacks every route with user B's IDs; B's rows must be
// byte-for-byte unchanged afterwards and B's data must never appear in A's responses.
//
// COVERAGE below is checked against the route files on disk, so a new route (or a new method on an
// existing one) fails this suite until it says how it is covered.

type Method = "GET" | "POST" | "PATCH" | "DELETE";
type Handler = (request: Request, context: unknown) => Promise<Response>;
type RouteModule = Partial<Record<Method, Handler>>;

const API_DIR = join(process.cwd(), "src", "app", "api");

/** Routes with no user data: public, or owned by Auth.js. */
const PUBLIC_ROUTES = new Set([
  "GET /api/health",
  "GET /api/auth/[...nextauth]",
  "POST /api/auth/[...nextauth]",
]);

type World = {
  a: TestUser;
  b: TestUser;
  aEcho: EchoDto;
  aCollection: CollectionDto;
  bEcho: EchoDto;
  bTag: TagDto;
  bCollection: CollectionDto;
  bRevisit: RevisitDto;
};

/** One attack: a request as A, and the status A must get. */
type Attack = {
  label: string;
  path: (w: World) => string;
  params?: (w: World) => Record<string, string>;
  body?: (w: World) => unknown;
  status: number;
};

/** How each route is covered: attacks with B's IDs, a leak check on A's reads, or elsewhere. */
type Coverage =
  | { kind: "attacks"; attacks: Attack[] }
  | { kind: "read"; path: (w: World) => string }
  | { kind: "self"; note: string };

const COVERAGE: Record<string, Coverage> = {
  // Echoes
  "GET /api/echoes": { kind: "read", path: () => "/api/echoes?limit=100" },
  "POST /api/echoes": {
    kind: "attacks",
    attacks: [
      {
        label: "tagIds with B's tag",
        path: () => "/api/echoes",
        body: (w) => ({ quote: "a", tagIds: [w.bTag.id] }),
        status: 403,
      },
      {
        label: "collectionIds with B's collection",
        path: () => "/api/echoes",
        body: (w) => ({ quote: "a", collectionIds: [w.bCollection.id] }),
        status: 403,
      },
    ],
  },
  "GET /api/echoes/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's Echo",
        path: (w) => `/api/echoes/${w.bEcho.id}`,
        params: (w) => ({ id: w.bEcho.id }),
        status: 404,
      },
    ],
  },
  "PATCH /api/echoes/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's Echo",
        path: (w) => `/api/echoes/${w.bEcho.id}`,
        params: (w) => ({ id: w.bEcho.id }),
        body: () => ({ quote: "overwritten", isFavorite: true }),
        status: 404,
      },
      {
        label: "A's Echo with B's tag",
        path: (w) => `/api/echoes/${w.aEcho.id}`,
        params: (w) => ({ id: w.aEcho.id }),
        body: (w) => ({ tagIds: [w.bTag.id] }),
        status: 403,
      },
      {
        label: "A's Echo with B's collection",
        path: (w) => `/api/echoes/${w.aEcho.id}`,
        params: (w) => ({ id: w.aEcho.id }),
        body: (w) => ({ collectionIds: [w.bCollection.id] }),
        status: 403,
      },
    ],
  },
  "DELETE /api/echoes/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's Echo",
        path: (w) => `/api/echoes/${w.bEcho.id}`,
        params: (w) => ({ id: w.bEcho.id }),
        status: 404,
      },
    ],
  },
  "GET /api/echoes/today": { kind: "read", path: () => "/api/echoes/today" },
  "GET /api/echoes/random": { kind: "read", path: () => "/api/echoes/random" },
  "GET /api/search": { kind: "read", path: () => "/api/search?q=authz" },

  // Collections
  "GET /api/collections": { kind: "read", path: () => "/api/collections" },
  "POST /api/collections": {
    kind: "self",
    note: "creates A's own collection; covered by the B-unchanged check in the self test",
  },
  "GET /api/collections/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's collection",
        path: (w) => `/api/collections/${w.bCollection.id}`,
        params: (w) => ({ id: w.bCollection.id }),
        status: 404,
      },
    ],
  },
  "PATCH /api/collections/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's collection",
        path: (w) => `/api/collections/${w.bCollection.id}`,
        params: (w) => ({ id: w.bCollection.id }),
        body: () => ({ name: "taken over" }),
        status: 404,
      },
    ],
  },
  "DELETE /api/collections/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's collection",
        path: (w) => `/api/collections/${w.bCollection.id}`,
        params: (w) => ({ id: w.bCollection.id }),
        status: 404,
      },
    ],
  },
  "POST /api/collections/[id]/echoes": {
    kind: "attacks",
    attacks: [
      {
        label: "A's Echo into B's collection",
        path: (w) => `/api/collections/${w.bCollection.id}/echoes`,
        params: (w) => ({ id: w.bCollection.id }),
        body: (w) => ({ echoId: w.aEcho.id }),
        status: 404,
      },
      {
        label: "B's Echo into A's collection",
        path: (w) => `/api/collections/${w.aCollection.id}/echoes`,
        params: (w) => ({ id: w.aCollection.id }),
        body: (w) => ({ echoId: w.bEcho.id }),
        status: 404,
      },
    ],
  },
  "DELETE /api/collections/[id]/echoes/[echoId]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's Echo from B's collection",
        path: (w) => `/api/collections/${w.bCollection.id}/echoes/${w.bEcho.id}`,
        params: (w) => ({ id: w.bCollection.id, echoId: w.bEcho.id }),
        status: 404,
      },
      {
        label: "B's Echo from A's collection",
        path: (w) => `/api/collections/${w.aCollection.id}/echoes/${w.bEcho.id}`,
        params: (w) => ({ id: w.aCollection.id, echoId: w.bEcho.id }),
        status: 404,
      },
    ],
  },

  // Tags
  "GET /api/tags": { kind: "read", path: () => "/api/tags" },
  "POST /api/tags": { kind: "self", note: "creates A's own tag" },
  "PATCH /api/tags/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's tag",
        path: (w) => `/api/tags/${w.bTag.id}`,
        params: (w) => ({ id: w.bTag.id }),
        body: () => ({ name: "renamed" }),
        status: 404,
      },
    ],
  },
  "DELETE /api/tags/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's tag",
        path: (w) => `/api/tags/${w.bTag.id}`,
        params: (w) => ({ id: w.bTag.id }),
        status: 404,
      },
    ],
  },

  // Revisits
  "GET /api/revisits": { kind: "read", path: () => "/api/revisits?status=upcoming" },
  "POST /api/revisits": {
    kind: "attacks",
    attacks: [
      {
        label: "on B's Echo",
        path: () => "/api/revisits",
        body: (w) => ({ echoId: w.bEcho.id, scheduledFor: inDays(3) }),
        status: 404,
      },
    ],
  },
  "PATCH /api/revisits/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "complete B's Revisit",
        path: (w) => `/api/revisits/${w.bRevisit.id}`,
        params: (w) => ({ id: w.bRevisit.id }),
        body: () => ({ completed: true }),
        status: 404,
      },
      {
        label: "reschedule B's Revisit",
        path: (w) => `/api/revisits/${w.bRevisit.id}`,
        params: (w) => ({ id: w.bRevisit.id }),
        body: () => ({ scheduledFor: inDays(9) }),
        status: 404,
      },
    ],
  },
  "DELETE /api/revisits/[id]": {
    kind: "attacks",
    attacks: [
      {
        label: "B's Revisit",
        path: (w) => `/api/revisits/${w.bRevisit.id}`,
        params: (w) => ({ id: w.bRevisit.id }),
        status: 404,
      },
    ],
  },

  // Account and data
  "GET /api/me": { kind: "read", path: () => "/api/me" },
  "PATCH /api/me": { kind: "self", note: "changes only the signed-in user's row" },
  "GET /api/export": { kind: "read", path: () => "/api/export?format=json" },
  "DELETE /api/account": { kind: "self", note: "tests/integration/account-deletion.test.ts" },
};

const BODY_METHODS = new Set<Method>(["POST", "PATCH"]);

/**
 * Lists every route file under src/app/api with the HTTP methods it exports.
 *
 * @returns Keys like "PATCH /api/echoes/[id]", with each route's module.
 */
async function discoverRoutes(): Promise<Map<string, { module: RouteModule; method: Method }>> {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "route.ts") files.push(full);
    }
  };
  walk(API_DIR);
  const routes = new Map<string, { module: RouteModule; method: Method }>();
  for (const file of files) {
    const path = `/api/${relative(API_DIR, file).split(sep).slice(0, -1).join("/")}`.replace(
      /\/$/,
      "",
    );
    const mod = (await import(/* @vite-ignore */ file)) as RouteModule;
    for (const method of ["GET", "POST", "PATCH", "DELETE"] as const) {
      if (typeof mod[method] === "function")
        routes.set(`${method} ${path}`, { module: mod, method });
    }
  }
  return routes;
}

/**
 * Builds an ISO date some days from now, for Revisit dates.
 *
 * @param days - How many days ahead.
 * @returns The ISO date-time string.
 */
function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

/**
 * Sends a request to a route handler as the given user.
 *
 * @param handler - The route handler.
 * @param user - Who is signed in.
 * @param method - The HTTP method.
 * @param path - The request path.
 * @param params - Dynamic route params.
 * @param body - A JSON body, if any.
 * @returns The response.
 */
async function send(
  handler: Handler,
  user: TestUser,
  method: Method,
  path: string,
  params: Record<string, string> = {},
  body?: unknown,
): Promise<Response> {
  const request = makeRequest(path, {
    method,
    cookie: user.cookie,
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body), headers: { "content-type": "application/json" } }),
  });
  return handler(request, { params: Promise.resolve(params) });
}

let routes: Map<string, { module: RouteModule; method: Method }>;
let world: World;
let pg: Client;

/**
 * Reads every row that belongs to B, across every table, as text.
 *
 * @param userId - B's user ID.
 * @returns One string that changes if any of B's rows change at all.
 */
async function snapshotUser(userId: string): Promise<string> {
  const queries = [
    `SELECT row_to_json(t)::text AS r FROM users t WHERE id = $1`,
    `SELECT row_to_json(t)::text AS r FROM accounts t WHERE user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM sessions t WHERE user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM echoes t WHERE user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM tags t WHERE user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM collections t WHERE user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM revisits t WHERE user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM daily_echoes t WHERE user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM echo_tags t JOIN echoes e ON e.id = t.echo_id WHERE e.user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM echo_collections t JOIN echoes e ON e.id = t.echo_id WHERE e.user_id = $1`,
    `SELECT row_to_json(t)::text AS r FROM echo_collections t JOIN collections c ON c.id = t.collection_id WHERE c.user_id = $1`,
  ];
  const parts: string[] = [];
  for (const sql of queries) {
    const { rows } = await pg.query<{ r: string }>(`${sql} ORDER BY 1`, [userId]);
    parts.push(rows.map((row) => row.r).join("\n"));
  }
  return parts.join("\n--\n");
}

/** Text that only B's data contains; it must never show up in anything A reads. */
const B_SECRET = "authz bob-only words 7f3e";

beforeAll(async () => {
  pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  routes = await discoverRoutes();

  const a = await createTestUser(process.env.DATABASE_URL!, { name: "Authz A" });
  const b = await createTestUser(process.env.DATABASE_URL!, { name: "Authz B" });
  const call = async <T>(
    user: TestUser,
    key: string,
    path: string,
    body?: unknown,
    status = 201,
  ) => {
    const route = routes.get(key)!;
    const response = await send(route.module[route.method]!, user, route.method, path, {}, body);
    expect(response.status, key).toBe(status);
    return (await response.json()) as T;
  };

  const bTag = await call<TagDto>(b, "POST /api/tags", "/api/tags", { name: "authz-b-tag" });
  const bCollection = await call<CollectionDto>(b, "POST /api/collections", "/api/collections", {
    name: "Authz B collection",
    description: B_SECRET,
  });
  const bEcho = await call<EchoDto>(b, "POST /api/echoes", "/api/echoes", {
    quote: `${B_SECRET} — authz`,
    author: "Authz Bob",
    reflection: B_SECRET,
    tagIds: [bTag.id],
    collectionIds: [bCollection.id],
    isFavorite: true,
  });
  const bRevisit = await call<RevisitDto>(b, "POST /api/revisits", "/api/revisits", {
    echoId: bEcho.id,
    scheduledFor: inDays(5),
  });
  // A soft-deleted Echo of B's must not leak either.
  const bDeleted = await call<EchoDto>(b, "POST /api/echoes", "/api/echoes", {
    quote: `${B_SECRET} deleted authz`,
  });
  const del = routes.get("DELETE /api/echoes/[id]")!;
  expect(
    (await send(del.module.DELETE!, b, "DELETE", `/api/echoes/${bDeleted.id}`, { id: bDeleted.id }))
      .status,
  ).toBe(204);

  const aCollection = await call<CollectionDto>(a, "POST /api/collections", "/api/collections", {
    name: "Authz A collection",
  });
  const aEcho = await call<EchoDto>(a, "POST /api/echoes", "/api/echoes", {
    quote: "A's own authz quote",
  });
  await call<RevisitDto>(a, "POST /api/revisits", "/api/revisits", {
    echoId: aEcho.id,
    scheduledFor: inDays(4),
  });

  world = { a, b, aEcho, aCollection, bEcho, bTag, bCollection, bRevisit };
});

afterAll(async () => {
  await pg.end();
});

describe("route manifest", () => {
  it("covers every API route and method", () => {
    const onDisk = [...routes.keys()].filter((key) => !PUBLIC_ROUTES.has(key)).sort();
    expect(onDisk).toEqual(Object.keys(COVERAGE).sort());
  });
});

describe("A against B's resources", () => {
  const attacks = Object.entries(COVERAGE).flatMap(([key, coverage]) =>
    coverage.kind === "attacks" ? coverage.attacks.map((attack) => ({ key, attack })) : [],
  );

  it.each(attacks)("$key: $attack.label → $attack.status", async ({ key, attack }) => {
    const route = routes.get(key)!;
    const before = await snapshotUser(world.b.user.id);
    const response = await send(
      route.module[route.method]!,
      world.a,
      route.method,
      attack.path(world),
      attack.params?.(world),
      BODY_METHODS.has(route.method) ? (attack.body?.(world) ?? {}) : undefined,
    );
    expect(response.status).toBe(attack.status);
    expect(await response.text()).not.toContain(B_SECRET);
    expect(await snapshotUser(world.b.user.id)).toBe(before);
  });
});

describe("A's reads never contain B's data", () => {
  const reads = Object.entries(COVERAGE).flatMap(([key, coverage]) =>
    coverage.kind === "read" ? [{ key, path: coverage.path }] : [],
  );

  it.each(reads)("$key", async ({ key, path }) => {
    const route = routes.get(key)!;
    // Run twice so a picked-and-pinned Echo (today, random) is also checked.
    for (let i = 0; i < 2; i += 1) {
      const response = await send(route.module[route.method]!, world.a, route.method, path(world));
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).not.toContain(B_SECRET);
      for (const id of [
        world.bEcho.id,
        world.bTag.id,
        world.bCollection.id,
        world.bRevisit.id,
        world.b.user.id,
      ]) {
        expect(text).not.toContain(id);
      }
      expect(text).not.toContain(world.b.user.email);
    }
  });

  it("the CSV export contains only A's data", async () => {
    const route = routes.get("GET /api/export")!;
    const response = await send(route.module.GET!, world.a, "GET", "/api/export?format=csv");
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("A's own authz quote");
    expect(text).not.toContain(B_SECRET);
    expect(text).not.toContain(world.bEcho.id);
  });
});

describe("A's self-scoped writes leave B alone", () => {
  it("POST /api/tags, POST /api/collections and PATCH /api/me", async () => {
    const before = await snapshotUser(world.b.user.id);
    const tag = routes.get("POST /api/tags")!;
    expect(
      (await send(tag.module.POST!, world.a, "POST", "/api/tags", {}, { name: "authz-b-tag" }))
        .status,
    ).toBe(201);
    const collection = routes.get("POST /api/collections")!;
    expect(
      (
        await send(
          collection.module.POST!,
          world.a,
          "POST",
          "/api/collections",
          {},
          {
            name: "Authz B collection",
          },
        )
      ).status,
    ).toBe(201);
    const me = routes.get("PATCH /api/me")!;
    expect(
      (await send(me.module.PATCH!, world.a, "PATCH", "/api/me", {}, { name: "Renamed A" })).status,
    ).toBe(200);
    expect(await snapshotUser(world.b.user.id)).toBe(before);
  });
});
