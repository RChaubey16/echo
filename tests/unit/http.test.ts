import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError, apiHandler, type ErrorBody } from "@/server/http";

const request = () => new Request("http://localhost:3000/api/test", { method: "POST" });

async function body(response: Response): Promise<ErrorBody> {
  return (await response.json()) as ErrorBody;
}

describe("apiHandler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes successful responses through with a request id", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const handler = apiHandler(async () => Response.json({ ok: true }));
    const response = await handler(request(), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("marks every response private and uncacheable, errors included", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ok = await apiHandler(async () => Response.json({ ok: true }))(request(), {});
    const failed = await apiHandler(async () => {
      throw new Error("boom");
    })(request(), {});
    expect(ok.headers.get("cache-control")).toBe("private, no-store");
    expect(failed.headers.get("cache-control")).toBe("private, no-store");
  });

  it("maps AppError to the spec §39 shape with its status", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const handler = apiHandler(async () => {
      throw new AppError("ECHO_NOT_FOUND");
    });
    const response = await handler(request(), {});
    expect(response.status).toBe(404);
    expect(await body(response)).toEqual({
      error: { code: "ECHO_NOT_FOUND", message: "Echo not found." },
    });
  });

  it.each([
    ["UNAUTHORIZED", 401],
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
    ["RATE_LIMITED", 429],
  ] as const)("maps %s to %i", async (code, status) => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const handler = apiHandler(async () => {
      throw new AppError(code);
    });
    const response = await handler(request(), {});
    expect(response.status).toBe(status);
    expect((await body(response)).error.code).toBe(code);
  });

  it("maps Zod errors to VALIDATION_ERROR with field messages", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const handler = apiHandler(async () => {
      z.object({ quote: z.string().min(1, "Quote is required.") }).parse({ quote: "" });
      return Response.json({});
    });
    const response = await handler(request(), {});
    expect(response.status).toBe(400);
    expect(await body(response)).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Some fields are invalid.",
        fields: { quote: ["Quote is required."] },
      },
    });
  });

  it("maps unknown errors to INTERNAL_ERROR and logs only an error id", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = apiHandler(async () => {
      throw new Error("secret quote text");
    });
    const response = await handler(request(), {});
    const json = await body(response);
    expect(response.status).toBe(500);
    expect(json.error.code).toBe("INTERNAL_ERROR");
    expect(json.error.message).toBe("Something went wrong.");
    expect(json.error.errorId).toMatch(/^[0-9a-f-]{36}$/);
    const logged = errorLog.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain(json.error.errorId);
    expect(logged).not.toContain("secret quote text");
  });
});
