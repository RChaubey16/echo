import { describe, expect, it } from "vitest";
import {
  dailyIndex,
  fnv1a32,
  greetingFor,
  isValidTimeZone,
  localDate,
  localHour,
} from "@/lib/daily";

const userId = "0b6f8f3e-5a0c-4d6e-9f7a-2b1c3d4e5f60";

describe("fnv1a32", () => {
  it("matches the published FNV-1a test vectors", () => {
    expect(fnv1a32("")).toBe(0x811c9dc5);
    expect(fnv1a32("a")).toBe(0xe40c292c);
    expect(fnv1a32("foobar")).toBe(0xbf9cf968);
  });

  it("always returns an unsigned 32-bit integer", () => {
    for (const input of ["x", "hello world", "日本語", userId]) {
      const hash = fnv1a32(input);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    }
  });
});

describe("dailyIndex", () => {
  it("is stable for a fixed user and date", () => {
    const first = dailyIndex(userId, "2026-10-01", 37);
    for (let i = 0; i < 5; i++) expect(dailyIndex(userId, "2026-10-01", 37)).toBe(first);
  });

  it("stays within range", () => {
    for (let n = 1; n < 50; n++) {
      const index = dailyIndex(userId, "2026-10-01", n);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(n);
    }
  });

  it("varies across dates", () => {
    const days = Array.from({ length: 30 }, (_, i) => `2026-10-${String(i + 1).padStart(2, "0")}`);
    const picks = new Set(days.map((day) => dailyIndex(userId, day, 100)));
    expect(picks.size).toBeGreaterThan(10);
  });
});

describe("localDate", () => {
  it("crosses midnight ahead of UTC", () => {
    const lateUtc = new Date("2026-10-01T23:30:00Z");
    expect(localDate("UTC", lateUtc)).toBe("2026-10-01");
    expect(localDate("Asia/Kolkata", lateUtc)).toBe("2026-10-02");
  });

  it("stays on the previous day behind UTC", () => {
    const earlyUtc = new Date("2026-10-02T03:00:00Z");
    expect(localDate("America/Los_Angeles", earlyUtc)).toBe("2026-10-01");
  });

  it("falls back to UTC for unknown zones", () => {
    expect(localDate("Not/AZone", new Date("2026-10-01T23:30:00Z"))).toBe("2026-10-01");
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA names and rejects junk", () => {
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});

describe("greeting", () => {
  it("follows the local hour", () => {
    const at = new Date("2026-10-01T03:30:00Z"); // 09:00 in Kolkata
    expect(localHour("Asia/Kolkata", at)).toBe(9);
    expect(greetingFor(9)).toBe("Good morning");
    expect(greetingFor(13)).toBe("Good afternoon");
    expect(greetingFor(20)).toBe("Good evening");
    expect(greetingFor(2)).toBe("Good evening");
  });
});
