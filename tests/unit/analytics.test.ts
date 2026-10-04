import { afterEach, describe, expect, it, vi } from "vitest";
import { allowedProps, capturePayload, daysSince, track } from "@/server/analytics";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("track props", () => {
  it("can't be given content fields (compile-time)", () => {
    // These lines are checked by `pnpm typecheck`: each must be a type error.
    const typeOnly = () => {
      const created = { hasAuthor: true, hasReflection: false, tagCount: 0, collectionCount: 0 };
      // @ts-expect-error quote is not an allowed prop
      track("u", "echo_created", { ...created, quote: "x" });
      // @ts-expect-error reflection is not an allowed prop
      track("u", "echo_opened", { daysSinceSaved: 1, reflection: "x" });
      // @ts-expect-error the search text is never sent
      track("u", "search_performed", { resultCount: 3, q: "grief" });
      // @ts-expect-error events without props take none
      track("u", "echo_updated", { quote: "x" });
    };
    expect(typeof typeOnly).toBe("function");
  });

  it("drops anything not on the allow-list at runtime too", () => {
    expect(
      allowedProps("search_performed", { resultCount: 3, q: "grief", quote: "x", reflection: "y" }),
    ).toEqual({ resultCount: 3 });
    expect(allowedProps("echo_updated", { quote: "x" })).toEqual({});
  });

  it("sends only the opaque user ID and the allowed props", () => {
    const payload = capturePayload("key", "user-1", "echo_opened", {
      daysSinceSaved: 4,
      quote: "secret",
    } as never);
    expect(payload).toMatchObject({
      api_key: "key",
      event: "echo_opened",
      distinct_id: "user-1",
      properties: { daysSinceSaved: 4, $process_person_profile: false },
    });
    expect(JSON.stringify(payload)).not.toContain("secret");
  });

  it("never sends from a test run, even when real keys are in .env", () => {
    expect(process.env.ANALYTICS_DISABLED).toBe("1");
    vi.stubEnv("POSTHOG_KEY", "phc_real_looking_key");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    track("u", "echo_deleted");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is a no-op without POSTHOG_KEY", () => {
    expect(() => track("u", "echo_deleted")).not.toThrow();
  });
});

describe("daysSince", () => {
  it("counts whole days and never goes negative", () => {
    const now = new Date("2026-10-04T12:00:00Z");
    expect(daysSince("2026-10-01T13:00:00Z", now)).toBe(2);
    expect(daysSince("2026-10-05T00:00:00Z", now)).toBe(0);
  });
});
