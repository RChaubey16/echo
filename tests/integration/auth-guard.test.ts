import { describe, expect, it } from "vitest";
import { GET as getMe } from "@/app/api/me/route";
import { GET as getHealth } from "@/app/api/health/route";
import { makeRequest } from "../helpers/request-context";
import { createTestUser } from "../helpers/session";

const ctx = {} as never;

describe("protected route handler", () => {
  it("returns 401 UNAUTHORIZED without a session", async () => {
    const response = await getMe(makeRequest("/api/me"), ctx);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "You need to sign in." },
    });
  });

  it("returns 401 for an unknown session token", async () => {
    const response = await getMe(
      makeRequest("/api/me", { cookie: "authjs.session-token=not-a-real-token" }),
      ctx,
    );
    expect(response.status).toBe(401);
  });

  it("returns 200 with the user for a valid seeded session", async () => {
    const { user, cookie } = await createTestUser(process.env.DATABASE_URL!);
    const response = await getMe(makeRequest("/api/me", { cookie }), ctx);
    expect(response.status).toBe(200);
    const json = (await response.json()) as { user: { id: string; email: string } };
    expect(json.user).toMatchObject({ id: user.id, email: user.email });
  });
});

describe("GET /api/health", () => {
  it("pings the database", async () => {
    const response = await getHealth(makeRequest("/api/health"), ctx);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
