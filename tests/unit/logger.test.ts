import { describe, expect, it } from "vitest";
import { formatLogLine, type LogFields } from "@/lib/logger";

describe("formatLogLine", () => {
  it("keeps allow-listed fields", () => {
    const line = JSON.parse(formatLogLine("info", "request", { requestId: "r1", status: 200 }));
    expect(line).toMatchObject({ level: "info", message: "request", requestId: "r1", status: 200 });
  });

  it("drops fields that are not on the allow-list", () => {
    const fields = { requestId: "r1", body: "my quote", token: "abc" } as unknown as LogFields;
    const line = formatLogLine("info", "request", fields);
    expect(line).not.toContain("my quote");
    expect(line).not.toContain("abc");
  });
});
