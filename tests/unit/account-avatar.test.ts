import { describe, expect, it } from "vitest";
import { avatarInitial } from "@/components/shell/account-avatar";

describe("avatarInitial", () => {
  it("uses the first letter of the name", () => {
    expect(avatarInitial("ana Reyes", "ana@example.com")).toBe("A");
  });

  it("falls back to the email when the name is missing or blank", () => {
    expect(avatarInitial(null, "ruturaj@example.com")).toBe("R");
    expect(avatarInitial("   ", "z@example.com")).toBe("Z");
  });
});
