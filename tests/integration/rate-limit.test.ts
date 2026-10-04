import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as authPost } from "@/app/api/auth/[...nextauth]/route";
import { GET as exportData } from "@/app/api/export/route";
import { GET as getMe, PATCH as patchMe } from "@/app/api/me/route";
import { GET as search } from "@/app/api/search/route";
import { resetRateLimitersForTests } from "@/server/rate-limit";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

// A fake Upstash: a fixed-window counter per prefix and key, so tests can hit each limit quickly.
const counts = new Map<string, number>();
vi.mock("@upstash/redis", () => ({ Redis: class {} }));
vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow(tokens: number) {
      return { tokens };
    }
    private readonly tokens: number;
    private readonly prefix: string;
    constructor(options: { limiter: { tokens: number }; prefix: string }) {
      this.tokens = options.limiter.tokens;
      this.prefix = options.prefix;
    }
    async limit(key: string) {
      const id = `${this.prefix}:${key}`;
      const used = (counts.get(id) ?? 0) + 1;
      counts.set(id, used);
      return { success: used <= this.tokens, limit: this.tokens, remaining: 0, reset: 0 };
    }
  }
  return { Ratelimit };
});

const ctx = {} as never;
let user: TestUser;
let other: TestUser;

/**
 * Sends PATCH /api/me as a user.
 *
 * @param who - The signed-in user.
 * @returns The response.
 */
function rename(who: TestUser): Promise<Response> {
  return patchMe(
    makeRequest("/api/me", {
      method: "PATCH",
      cookie: who.cookie,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Rate Limited" }),
    }),
    ctx,
  );
}

beforeAll(async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  resetRateLimitersForTests();
  user = await createTestUser(process.env.DATABASE_URL!);
  other = await createTestUser(process.env.DATABASE_URL!);
});

beforeEach(() => counts.clear());

afterAll(() => {
  vi.unstubAllEnvs();
  resetRateLimitersForTests();
});

describe("rate limits (spec §41)", () => {
  it("allows 60 mutations a minute per user, then returns 429 RATE_LIMITED", async () => {
    for (let i = 0; i < 60; i += 1) expect((await rename(user)).status).toBe(200);
    const limited = await rename(user);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({ error: { code: "RATE_LIMITED" } });
    // Limits are per user, and reads aren't counted as mutations.
    expect((await rename(other)).status).toBe(200);
    expect((await getMe(makeRequest("/api/me", { cookie: user.cookie }), ctx)).status).toBe(200);
  });

  it("allows 30 searches a minute per user", async () => {
    const run = () =>
      search(makeRequest("/api/search?q=limit", { cookie: user.cookie }), ctx).then(
        (r) => r.status,
      );
    for (let i = 0; i < 30; i += 1) expect(await run()).toBe(200);
    expect(await run()).toBe(429);
  });

  it("allows 5 exports an hour per user", async () => {
    const run = () =>
      exportData(makeRequest("/api/export?format=csv", { cookie: user.cookie }), ctx).then(
        (r) => r.status,
      );
    for (let i = 0; i < 5; i += 1) expect(await run()).toBe(200);
    expect(await run()).toBe(429);
  });

  it("allows 20 auth requests a minute per IP", async () => {
    const run = (ip: string) =>
      authPost(
        makeRequest("/api/auth/signout", {
          method: "POST",
          headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
        }) as never,
      ).then((r) => r.status);
    for (let i = 0; i < 20; i += 1) expect(await run("203.0.113.7")).not.toBe(429);
    expect(await run("203.0.113.7")).toBe(429);
    expect(await run("203.0.113.8")).not.toBe(429);
  });

  it("doesn't count unauthenticated requests against anyone", async () => {
    const response = await patchMe(
      makeRequest("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "x" }),
      }),
      ctx,
    );
    expect(response.status).toBe(401);
    expect(counts.size).toBe(0);
  });
});
