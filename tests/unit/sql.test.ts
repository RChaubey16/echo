import { describe, expect, it } from "vitest";
import { containsPattern, escapeLike } from "@/lib/sql";

describe("escapeLike", () => {
  it("escapes LIKE wildcards so they match literally", () => {
    expect(escapeLike("100%")).toBe("100\\%");
    expect(escapeLike("snake_case")).toBe("snake\\_case");
  });

  it("escapes the escape character first", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
    expect(escapeLike("\\%")).toBe("\\\\\\%");
  });

  it("leaves ordinary text alone", () => {
    expect(escapeLike("begin anywhere")).toBe("begin anywhere");
  });
});

describe("containsPattern", () => {
  it("wraps the escaped text in wildcards", () => {
    expect(containsPattern("50%_off")).toBe("%50\\%\\_off%");
  });
});
