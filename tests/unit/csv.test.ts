import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves plain values alone and empties null", () => {
    expect(csvCell("Begin anywhere.")).toBe("Begin anywhere.");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes and line breaks (RFC 4180)", () => {
    expect(csvCell("a, b")).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("one\ntwo")).toBe('"one\ntwo"');
    expect(csvCell("one\r\ntwo")).toBe('"one\r\ntwo"');
  });

  it.each(["=1+1", "+1", "-1", "@SUM(A1)", "\tx", "\rx"])(
    "guards %j against formula injection",
    (value) => {
      expect(csvCell(value).replace(/^"/, "")).toMatch(/^'/);
    },
  );

  it("doesn't guard numbers, which can't be formulas", () => {
    expect(csvCell(-3)).toBe("-3");
  });
});

describe("csvRow", () => {
  it("joins cells and ends with CRLF", () => {
    expect(csvRow(["a", null, "b,c"])).toBe('a,,"b,c"\r\n');
  });
});
