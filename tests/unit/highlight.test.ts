import { isValidElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { highlight, highlightTerms } from "@/lib/highlight";

/**
 * Flattens highlight() output into a string with [brackets] around marked parts.
 *
 * @param node - The highlight() result.
 * @returns The flattened text.
 */
function flatten(node: ReturnType<typeof highlight>): string {
  if (typeof node === "string") return node;
  return (node as Array<string | ReactElement<{ children: string }>>)
    .map((part) => (isValidElement(part) ? `[${part.props.children}]` : part))
    .join("");
}

describe("highlightTerms", () => {
  it("keeps words of two or more characters, unique, longest first", () => {
    expect(highlightTerms("  Starting over, a START ")).toEqual(["starting", "start", "over"]);
  });
});

describe("highlight", () => {
  it("returns the text unchanged without a query", () => {
    expect(highlight("Begin anywhere.", "")).toBe("Begin anywhere.");
    expect(highlight("Begin anywhere.", undefined)).toBe("Begin anywhere.");
  });

  it("marks every match, ignoring case, and keeps the original casing", () => {
    expect(flatten(highlight("Starting over is starting.", "starting"))).toBe(
      "[Starting] over is [starting].",
    );
  });

  it("treats regex characters in the query as text", () => {
    expect(flatten(highlight("x a+b y aab", "a+b"))).toBe("x [a+b] y aab");
  });
});
