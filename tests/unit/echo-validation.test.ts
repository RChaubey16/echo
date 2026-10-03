import { describe, expect, it } from "vitest";
import { echoCreateSchema, echoListQuerySchema, echoUpdateSchema } from "@/server/validation/echo";

describe("echoCreateSchema", () => {
  it("rejects an empty quote with the capture copy", () => {
    const result = echoCreateSchema.safeParse({ quote: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Add the quote you want to save.");
  });

  it("rejects a whitespace-only quote", () => {
    expect(echoCreateSchema.safeParse({ quote: "   \n\t " }).success).toBe(false);
  });

  it("rejects a missing quote", () => {
    expect(echoCreateSchema.safeParse({}).success).toBe(false);
  });

  it("accepts 10,000 characters and rejects 10,001", () => {
    expect(echoCreateSchema.safeParse({ quote: "a".repeat(10_000) }).success).toBe(true);
    expect(echoCreateSchema.safeParse({ quote: "a".repeat(10_001) }).success).toBe(false);
  });

  it("trims the quote but keeps inner line breaks", () => {
    expect(echoCreateSchema.parse({ quote: "  Begin\nanywhere.  " }).quote).toBe(
      "Begin\nanywhere.",
    );
  });

  it("turns empty optional strings into null", () => {
    const parsed = echoCreateSchema.parse({
      quote: "Begin anywhere.",
      author: "",
      source: "   ",
      reflection: "",
      mood: "",
    });
    expect(parsed).toMatchObject({ author: null, source: null, reflection: null, mood: null });
  });

  it.each([
    ["author", 500],
    ["source", 1_000],
    ["reflection", 10_000],
    ["mood", 100],
  ])("caps %s at %i characters", (field, max) => {
    expect(echoCreateSchema.safeParse({ quote: "q", [field]: "a".repeat(max) }).success).toBe(true);
    expect(echoCreateSchema.safeParse({ quote: "q", [field]: "a".repeat(max + 1) }).success).toBe(
      false,
    );
  });
});

describe("echoUpdateSchema", () => {
  it("rejects a patch with no fields", () => {
    expect(echoUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a single field", () => {
    expect(echoUpdateSchema.parse({ isFavorite: true })).toEqual({ isFavorite: true });
  });

  it("still rejects an empty quote", () => {
    expect(echoUpdateSchema.safeParse({ quote: " " }).success).toBe(false);
  });

  it("allows clearing an optional field", () => {
    expect(echoUpdateSchema.parse({ author: "" })).toEqual({ author: null });
  });
});

describe("echoListQuerySchema", () => {
  it("applies defaults", () => {
    expect(echoListQuerySchema.parse({})).toEqual({ page: 1, limit: 20, sort: "newest" });
  });

  it("caps limit at 100", () => {
    expect(echoListQuerySchema.parse({ limit: "500" }).limit).toBe(100);
  });

  it("parses favorite as a boolean", () => {
    expect(echoListQuerySchema.parse({ favorite: "true" }).favorite).toBe(true);
    expect(echoListQuerySchema.parse({ favorite: "false" }).favorite).toBe(false);
  });

  it("rejects an unknown sort and a page below 1", () => {
    expect(echoListQuerySchema.safeParse({ sort: "random" }).success).toBe(false);
    expect(echoListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
