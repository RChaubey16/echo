import { describe, expect, it } from "vitest";
import { AppError, assertSameOrigin, readJson } from "@/server/http";

/**
 * Builds a request to the app's own host with the given method and headers.
 *
 * @param method - The HTTP method.
 * @param headers - Extra headers.
 * @returns The request.
 */
function req(method: string, headers: Record<string, string> = {}, body?: string): Request {
  return new Request("http://localhost:3000/api/echoes", {
    method,
    headers: { host: "localhost:3000", ...headers },
    body,
  });
}

/**
 * Runs a check and returns the AppError code it threw, or null.
 *
 * @param fn - The check.
 * @returns The error code, or null when nothing was thrown.
 */
async function codeOf(fn: () => unknown): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error instanceof AppError ? error.code : "other";
  }
}

describe("assertSameOrigin", () => {
  it("lets reads through from anywhere", async () => {
    expect(
      await codeOf(() => assertSameOrigin(req("GET", { origin: "https://evil.example" }))),
    ).toBeNull();
  });

  it("accepts same-origin mutations and clients that send no Origin", async () => {
    expect(
      await codeOf(() => assertSameOrigin(req("POST", { origin: "http://localhost:3000" }))),
    ).toBeNull();
    expect(
      await codeOf(() => assertSameOrigin(req("DELETE", { "sec-fetch-site": "same-origin" }))),
    ).toBeNull();
    expect(await codeOf(() => assertSameOrigin(req("PATCH")))).toBeNull();
  });

  it("rejects cross-site mutations", async () => {
    expect(
      await codeOf(() => assertSameOrigin(req("POST", { origin: "https://evil.example" }))),
    ).toBe("FORBIDDEN");
    expect(
      await codeOf(() => assertSameOrigin(req("PATCH", { "sec-fetch-site": "cross-site" }))),
    ).toBe("FORBIDDEN");
    expect(
      await codeOf(() => assertSameOrigin(req("DELETE", { "sec-fetch-site": "same-site" }))),
    ).toBe("FORBIDDEN");
    expect(await codeOf(() => assertSameOrigin(req("POST", { origin: "null" })))).toBe("FORBIDDEN");
  });

  it("compares against the forwarded host behind a proxy", async () => {
    const request = req("POST", { origin: "https://echo.app", "x-forwarded-host": "echo.app" });
    expect(await codeOf(() => assertSameOrigin(request))).toBeNull();
  });
});

describe("readJson", () => {
  it("accepts only application/json bodies", async () => {
    expect(
      await codeOf(() => readJson(req("POST", { "content-type": "text/plain" }, '{"quote":"x"}'))),
    ).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(
      await codeOf(() =>
        readJson(req("POST", { "content-type": "application/x-www-form-urlencoded" }, "quote=x")),
      ),
    ).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(
      await readJson(req("POST", { "content-type": "application/json; charset=utf-8" }, '{"a":1}')),
    ).toEqual({ a: 1 });
  });
});
