import { describe, expect, it } from "vitest";
import { ApiError, failureMessage } from "@/lib/api";

const WHAT = "Couldn't update favorites.";

describe("failureMessage", () => {
  it.each([
    ["NETWORK_ERROR", 0, "Check your connection and try again."],
    ["RATE_LIMITED", 429, "Wait a moment and try again."],
    ["UNAUTHORIZED", 401, "Your session has ended. Sign in again to continue."],
    ["ECHO_NOT_FOUND", 404, "It may have been deleted. Refresh the page and try again."],
    ["FORBIDDEN", 403, "It may have been deleted. Refresh the page and try again."],
    ["INTERNAL_ERROR", 500, "Try again."],
  ] as const)("maps %s to friendly next steps", (code, status, hint) => {
    expect(failureMessage(new ApiError(status, code, "technical detail"), WHAT)).toBe(
      `${WHAT} ${hint}`,
    );
  });

  it("never shows the server's technical message", () => {
    const message = failureMessage(new ApiError(500, "INTERNAL_ERROR", "stack trace here"), WHAT);
    expect(message).not.toContain("stack trace");
  });

  it("falls back to a plain retry for anything that isn't an ApiError", () => {
    expect(failureMessage(new TypeError("x is undefined"), WHAT)).toBe(`${WHAT} Try again.`);
    expect(failureMessage("weird", WHAT)).toBe(`${WHAT} Try again.`);
  });
});
