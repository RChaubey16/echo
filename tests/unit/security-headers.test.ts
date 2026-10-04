import { describe, expect, it } from "vitest";
import { buildPageCsp, sentryOrigin } from "@/lib/security-headers";
import { isDeleteConfirmed } from "@/server/validation/user";

describe("buildPageCsp", () => {
  it("locks scripts to the nonce and forbids framing", () => {
    const csp = buildPageCsp("abc123");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self';");
  });

  it("allows the Sentry ingest host when a DSN is set, and eval only in dev", () => {
    const csp = buildPageCsp("n", {
      dev: true,
      sentryDsn: "https://key@o1.ingest.de.sentry.io/123",
    });
    expect(csp).toContain("connect-src 'self' https://o1.ingest.de.sentry.io");
    expect(csp).toContain("'unsafe-eval'");
    expect(sentryOrigin("not a url")).toBeNull();
  });
});

describe("isDeleteConfirmed", () => {
  it("accepts DELETE or the user's email, nothing else", () => {
    expect(isDeleteConfirmed("DELETE", "me@example.com")).toBe(true);
    expect(isDeleteConfirmed(" Me@Example.com ", "me@example.com")).toBe(true);
    expect(isDeleteConfirmed("delete", "me@example.com")).toBe(false);
    expect(isDeleteConfirmed("", "me@example.com")).toBe(false);
  });
});
