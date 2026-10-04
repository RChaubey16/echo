import { describe, expect, it } from "vitest";
import { pageList } from "@/components/ui/pagination";

describe("pageList", () => {
  it("shows every page when there are only a few", () => {
    expect(pageList(1, 3)).toEqual([1, 2, 3]);
    expect(pageList(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collapses long runs into a gap on each side of the current page", () => {
    expect(pageList(1, 9)).toEqual([1, 2, null, 9]);
    expect(pageList(5, 9)).toEqual([1, null, 4, 5, 6, null, 9]);
    expect(pageList(9, 9)).toEqual([1, null, 8, 9]);
  });

  it("fills a gap of one page with the page instead of an ellipsis", () => {
    expect(pageList(4, 9)).toEqual([1, 2, 3, 4, 5, null, 9]);
  });
});
