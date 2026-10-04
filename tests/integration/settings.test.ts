import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GET as getMe, PATCH as patchMe } from "@/app/api/me/route";
import { db } from "@/server/db";
import type { MeDto } from "@/types/user";
import { makeRequest } from "../helpers/request-context";
import { createTestUser, type TestUser } from "../helpers/session";

const ctx = {} as never;
let alice: TestUser;
let bob: TestUser;

/**
 * Sends PATCH /api/me as a user.
 *
 * @param user - The signed-in user, or null for no session.
 * @param body - The JSON body.
 * @returns The response.
 */
function patch(user: TestUser | null, body: unknown): Promise<Response> {
  return patchMe(
    makeRequest("/api/me", {
      method: "PATCH",
      cookie: user?.cookie,
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    }),
    ctx,
  );
}

beforeAll(async () => {
  for (const method of ["info", "warn", "error"] as const) {
    vi.spyOn(console, method).mockImplementation(() => {});
  }
  alice = await createTestUser(process.env.DATABASE_URL!, { name: "Alice" });
  bob = await createTestUser(process.env.DATABASE_URL!, { name: "Bob" });
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe("PATCH /api/me (Settings)", () => {
  it("renames the user, trimmed, and changes nobody else", async () => {
    const response = await patch(alice, { name: "  Alice Liddell " });
    expect(response.status).toBe(200);
    expect(((await response.json()) as MeDto).name).toBe("Alice Liddell");
    expect((await db.user.findUniqueOrThrow({ where: { id: bob.user.id } })).name).toBe("Bob");
  });

  it("rejects a blank name inline and keeps the old one", async () => {
    const response = await patch(alice, { name: "   " });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { fields: Record<string, string[]> } };
    expect(body.error.fields.name).toEqual(["Add your name."]);
    expect((await db.user.findUniqueOrThrow({ where: { id: alice.user.id } })).name).toBe(
      "Alice Liddell",
    );
  });

  it("stores Light and Dark, and System as null", async () => {
    let response = await patch(alice, { theme: "dark" });
    expect(((await response.json()) as MeDto).theme).toBe("dark");
    expect((await db.user.findUniqueOrThrow({ where: { id: alice.user.id } })).theme).toBe("dark");

    response = await patch(alice, { theme: "system" });
    expect(((await response.json()) as MeDto).theme).toBeNull();
    expect((await db.user.findUniqueOrThrow({ where: { id: alice.user.id } })).theme).toBeNull();
  });

  it("rejects an unknown theme", async () => {
    expect((await patch(alice, { theme: "sepia" })).status).toBe(400);
  });

  it("the database refuses an unknown theme even past validation", async () => {
    await expect(
      db.user.update({ where: { id: bob.user.id }, data: { theme: "sepia" } }),
    ).rejects.toThrow();
  });

  it("returns 401 without a session", async () => {
    expect((await patch(null, { theme: "dark" })).status).toBe(401);
  });

  it("the session carries the saved theme, so the app can sync the cookie", async () => {
    await patch(bob, { theme: "light" });
    const response = await getMe(makeRequest("/api/me", { cookie: bob.cookie }), ctx);
    expect(((await response.json()) as { user: { theme: string | null } }).user.theme).toBe(
      "light",
    );
  });

  it("marks /api/me responses private and uncacheable", async () => {
    const response = await getMe(makeRequest("/api/me", { cookie: alice.cookie }), ctx);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
