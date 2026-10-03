import { describe, expect, it } from "vitest";
import { definedFields, diffIds, nextFavoritedAt } from "@/server/services/echo-rules";

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

  it("leaves out tag and collection fields, which are written through join tables", () => {
    expect(
      definedFields({ mood: "calm", tagIds: [], tagNames: ["x"], collectionIds: ["c"] }),
    ).toEqual({ mood: "calm" });
  });
});

describe("diffIds", () => {
  it("adds the missing IDs and removes the ones no longer wanted", () => {
    expect(diffIds(["a", "b", "c"], ["b", "d"])).toEqual({ toAdd: ["d"], toRemove: ["a", "c"] });
  });

  it("does nothing when the sets match, in any order", () => {
    expect(diffIds(["a", "b"], ["b", "a"])).toEqual({ toAdd: [], toRemove: [] });
  });

  it("clears every link for an empty set and ignores duplicates", () => {
    expect(diffIds(["a", "b"], [])).toEqual({ toAdd: [], toRemove: ["a", "b"] });
    expect(diffIds([], ["a", "a"])).toEqual({ toAdd: ["a"], toRemove: [] });
  });
});
