import { describe, expect, it } from "vitest";
import { collectionCreateSchema, collectionUpdateSchema } from "@/server/validation/collection";
import { echoCreateSchema, echoListQuerySchema, searchQuerySchema } from "@/server/validation/echo";
import { normalizeTagName, tagCreateSchema } from "@/server/validation/tag";

const uuid = "4b7c2a8e-1f6d-4c3b-9a2e-5d8f0e1c2b3a";

describe("normalizeTagName", () => {
  it("trims, collapses inner whitespace and lowercases", () => {
    expect(normalizeTagName("  Starting   Over ")).toBe("starting over");
    expect(normalizeTagName("Courage")).toBe(normalizeTagName("courage"));
  });

  it("keeps non-English letters", () => {
    expect(normalizeTagName("Ça Va")).toBe("ça va");
  });
});

describe("tagCreateSchema", () => {
  it("stores the normalized name", () => {
    expect(tagCreateSchema.parse({ name: " Grief " })).toEqual({ name: "grief" });
  });

  it("rejects a blank name and names over 50 characters", () => {
    expect(tagCreateSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(tagCreateSchema.safeParse({ name: "a".repeat(50) }).success).toBe(true);
    expect(tagCreateSchema.safeParse({ name: "a".repeat(51) }).success).toBe(false);
  });
});

describe("echoCreateSchema relations", () => {
  it("accepts tag IDs, tag names and collection IDs", () => {
    const parsed = echoCreateSchema.parse({
      quote: "Begin anywhere.",
      tagIds: [uuid],
      tagNames: [" New Tag "],
      collectionIds: [uuid],
    });
    expect(parsed.tagNames).toEqual(["new tag"]);
  });

  it("rejects non-UUID IDs and more than 50 of anything", () => {
    expect(echoCreateSchema.safeParse({ quote: "q", tagIds: ["nope"] }).success).toBe(false);
    expect(
      echoCreateSchema.safeParse({ quote: "q", collectionIds: Array(51).fill(uuid) }).success,
    ).toBe(false);
    expect(echoCreateSchema.safeParse({ quote: "q", tagNames: Array(51).fill("x") }).success).toBe(
      false,
    );
  });
});

describe("collection schemas", () => {
  it("trims the name, keeps its casing and nulls an empty description", () => {
    expect(
      collectionCreateSchema.parse({ name: "  For Difficult Days ", description: "" }),
    ).toEqual({ name: "For Difficult Days", description: null });
  });

  it("enforces name and description lengths and the accent list", () => {
    expect(collectionCreateSchema.safeParse({ name: "" }).success).toBe(false);
    expect(collectionCreateSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
    expect(
      collectionCreateSchema.safeParse({ name: "n", description: "d".repeat(1001) }).success,
    ).toBe(false);
    expect(collectionCreateSchema.safeParse({ name: "n", accent: "red" }).success).toBe(false);
    expect(collectionCreateSchema.safeParse({ name: "n", accent: "plum" }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(collectionUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("list and search queries", () => {
  it("accepts tag, collection and search filters", () => {
    expect(
      echoListQuerySchema.parse({
        tag: uuid,
        collection: uuid,
        search: " hope ",
        sort: "recently_favorited",
      }),
    ).toMatchObject({ tag: uuid, collection: uuid, search: "hope", sort: "recently_favorited" });
  });

  it("drops a blank search and rejects one over 200 characters", () => {
    expect(echoListQuerySchema.parse({ search: "  " }).search).toBeUndefined();
    expect(searchQuerySchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
    expect(searchQuerySchema.parse({}).q).toBe("");
  });
});
