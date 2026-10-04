import { describe, expect, it } from "vitest";
import {
  olderThanCutoff,
  pastWindows,
  pickFromTiers,
  recentlySurfacedCutoff,
} from "@/server/services/discovery-rules";
import { randomQuerySchema } from "@/server/validation/echo";
import {
  revisitCreateSchema,
  revisitDateError,
  revisitUpdateSchema,
} from "@/server/validation/revisit";

const now = new Date("2026-10-04T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("pickFromTiers", () => {
  it("picks inside the strictest non-empty set", () => {
    expect(pickFromTiers([4, 9, 10], () => 0.5)).toEqual({ tier: 0, skip: 2 });
  });

  it("drops the exclusions when they leave nothing", () => {
    expect(pickFromTiers([0, 3, 10], () => 0)).toEqual({ tier: 1, skip: 0 });
    expect(pickFromTiers([0, 0, 2], () => 0.99)).toEqual({ tier: 2, skip: 1 });
  });

  it("returns null when there is nothing at all", () => {
    expect(pickFromTiers([0, 0, 0], () => 0.3)).toBeNull();
  });

  it("never skips past the last row", () => {
    expect(pickFromTiers([3], () => 0.9999999)).toEqual({ tier: 0, skip: 2 });
  });
});

describe("cutoffs", () => {
  it("works out the week and day boundaries", () => {
    expect(olderThanCutoff(now).getTime()).toBe(now.getTime() - 7 * DAY);
    expect(recentlySurfacedCutoff(now).getTime()).toBe(now.getTime() - DAY);
  });

  it("looks a year, six months and a month back, a week either side", () => {
    const windows = pastWindows(now);
    expect(windows.map((window) => window.label)).toEqual([
      "one year ago",
      "six months ago",
      "one month ago",
    ]);
    const [year] = windows;
    expect(year!.from.toISOString()).toBe("2025-09-27T12:00:00.000Z");
    expect(year!.to.toISOString()).toBe("2025-10-11T12:00:00.000Z");
  });
});

describe("randomQuerySchema", () => {
  const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

  it("keeps the last five valid IDs", () => {
    const exclude = [1, 2, 3, 4, 5, 6].map(id).join(",");
    expect(randomQuerySchema.parse({ exclude }).exclude).toEqual([2, 3, 4, 5, 6].map(id));
  });

  it("ignores junk and missing values", () => {
    expect(randomQuerySchema.parse({ exclude: `nope,${id(1)},` }).exclude).toEqual([id(1)]);
    expect(randomQuerySchema.parse({}).exclude).toEqual([]);
  });
});

describe("Revisit dates", () => {
  it("must be in the future", () => {
    expect(revisitDateError(now, now)).toBe("Pick a date in the future.");
    expect(revisitDateError(new Date(now.getTime() - 1), now)).toBe("Pick a date in the future.");
    expect(revisitDateError(new Date(now.getTime() + DAY), now)).toBeNull();
  });

  it("must be at most ten years away", () => {
    expect(revisitDateError(new Date("2036-10-04T12:00:00Z"), now)).toBeNull();
    expect(revisitDateError(new Date("2036-10-04T12:00:01Z"), now)).toBe(
      "Pick a date within 10 years.",
    );
  });

  it("parses ISO date-times with an offset", () => {
    const parsed = revisitCreateSchema.parse({
      echoId: "x",
      scheduledFor: "2027-04-01T09:00:00Z",
    });
    expect(parsed.scheduledFor.toISOString()).toBe("2027-04-01T09:00:00.000Z");
    expect(revisitCreateSchema.safeParse({ echoId: "x", scheduledFor: "April" }).success).toBe(
      false,
    );
  });

  it("updates either by completing or by moving the date", () => {
    expect(revisitUpdateSchema.safeParse({ completed: true }).success).toBe(true);
    expect(revisitUpdateSchema.safeParse({ scheduledFor: "2027-04-01T09:00:00Z" }).success).toBe(
      true,
    );
    expect(revisitUpdateSchema.safeParse({ completed: false }).success).toBe(false);
    expect(revisitUpdateSchema.safeParse({}).success).toBe(false);
  });
});
