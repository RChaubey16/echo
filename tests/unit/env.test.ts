import { describe, expect, it, vi } from "vitest";

vi.stubEnv("DATABASE_URL", "postgresql://echo:echo@localhost:5432/echo");
const { parseEnv } = await import("@/env");

const valid = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://echo:echo@localhost:5432/echo",
  AUTH_SECRET: "x".repeat(32),
  AUTH_GOOGLE_ID: "id",
  AUTH_GOOGLE_SECRET: "secret",
} as NodeJS.ProcessEnv;

describe("parseEnv", () => {
  it("accepts a complete environment", () => {
    expect(parseEnv(valid).AUTH_GOOGLE_ID).toBe("id");
  });

  it("names every missing variable without printing values", () => {
    const partial = { ...valid };
    delete partial.AUTH_GOOGLE_SECRET;
    delete partial.AUTH_SECRET;
    expect(() => parseEnv(partial)).toThrowError(
      "Invalid environment variables: AUTH_SECRET, AUTH_GOOGLE_SECRET",
    );
  });
});
