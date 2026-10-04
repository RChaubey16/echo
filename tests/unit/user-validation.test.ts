import { describe, expect, it } from "vitest";
import { USER_NAME_MAX, userUpdateSchema } from "@/server/validation/user";

describe("userUpdateSchema", () => {
  it("trims the name", () => {
    expect(userUpdateSchema.parse({ name: "  Ada Lovelace " }).name).toBe("Ada Lovelace");
  });

  it("rejects a blank name with friendly copy", () => {
    const result = userUpdateSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Add your name.");
  });

  it(`accepts ${USER_NAME_MAX} characters and rejects one more`, () => {
    expect(userUpdateSchema.safeParse({ name: "a".repeat(USER_NAME_MAX) }).success).toBe(true);
    expect(userUpdateSchema.safeParse({ name: "a".repeat(USER_NAME_MAX + 1) }).success).toBe(false);
  });

  it.each(["light", "dark", "system"])("accepts the %s theme", (theme) => {
    expect(userUpdateSchema.safeParse({ theme }).success).toBe(true);
  });

  it("rejects any other theme", () => {
    expect(userUpdateSchema.safeParse({ theme: "sepia" }).success).toBe(false);
  });

  it("still requires at least one field", () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(false);
  });
});
