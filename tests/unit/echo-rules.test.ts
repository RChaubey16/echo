import { describe, expect, it } from "vitest";
import { definedFields, nextFavoritedAt } from "@/server/services/echo-rules";

const now = new Date("2026-10-02T12:00:00Z");
const earlier = new Date("2026-09-01T08:00:00Z");

describe("nextFavoritedAt", () => {
  it("stamps now when an Echo becomes a favorite", () => {
    expect(nextFavoritedAt({ isFavorite: false, favoritedAt: null }, true, now)).toBe(now);
  });

  it("clears the timestamp when an Echo is unfavorited", () => {
    expect(nextFavoritedAt({ isFavorite: true, favoritedAt: earlier }, false, now)).toBeNull();
  });

  it("leaves the timestamp alone when the flag doesn't change", () => {
    expect(nextFavoritedAt({ isFavorite: true, favoritedAt: earlier }, true, now)).toBeUndefined();
    expect(nextFavoritedAt({ isFavorite: false, favoritedAt: null }, false, now)).toBeUndefined();
  });

  it("leaves the timestamp alone when the patch doesn't touch the flag", () => {
    expect(
      nextFavoritedAt({ isFavorite: true, favoritedAt: earlier }, undefined, now),
    ).toBeUndefined();
  });
});

describe("definedFields", () => {
  it("drops undefined values but keeps null", () => {
    expect(definedFields({ quote: undefined, author: null, mood: "calm" })).toEqual({
      author: null,
      mood: "calm",
    });
  });
});
