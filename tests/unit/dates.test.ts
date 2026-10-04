import { describe, expect, it } from "vitest";
import { fullDate, inFromNow, relativeDate, savedLabel } from "@/lib/dates";

const now = new Date("2026-10-02T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

describe("relativeDate", () => {
  it.each([
    [0, "today"],
    [1, "yesterday"],
    [3, "3 days ago"],
    [7, "1 week ago"],
    [20, "2 weeks ago"],
    [35, "1 month ago"],
    [335, "11 months ago"],
  ])("%i days → %s", (days, expected) => {
    expect(relativeDate(ago(days), now)).toBe(expected);
  });

  it("switches to month and year after a year", () => {
    expect(relativeDate(new Date("2025-03-15T00:00:00Z"), now)).toBe("March 2025");
  });
});

describe("savedLabel and fullDate", () => {
  it("prefixes Saved", () => {
    expect(savedLabel(ago(3), now)).toBe("Saved 3 days ago");
  });

  it("formats the full date", () => {
    expect(fullDate(new Date("2025-11-02T10:00:00Z"))).toBe("November 2, 2025");
  });
});

describe("inFromNow", () => {
  const ahead = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  it.each([
    [0.5, "tomorrow"],
    [1, "tomorrow"],
    [3, "in 3 days"],
    [21, "in 3 weeks"],
    [150, "in 5 months"],
    [365, "in 1 year"],
    [800, "in 2 years"],
  ])("%d days ahead reads %s", (days, expected) => {
    expect(inFromNow(ahead(days), now)).toBe(expected);
  });
});
