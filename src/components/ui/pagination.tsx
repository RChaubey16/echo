import Link from "next/link";
import { cn } from "@/lib/cn";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Builds the URL for a page number, keeping the other query parameters. */
  hrefFor: (page: number) => string;
};

const STEP =
  "inline-flex h-11 items-center gap-1 rounded-md px-3 text-body-md transition-colors duration-fast ease-standard";
const NUMBER =
  "inline-flex h-11 w-11 items-center justify-center rounded-md text-body-md tabular-nums transition-colors duration-fast ease-standard";

/**
 * Lists the page numbers to show: the first, the last, and the current page with its neighbours,
 * with null marking a gap.
 *
 * @param page - The current page (1-based).
 * @param pageCount - The number of pages.
 * @returns Page numbers in order, with null for each ellipsis.
 */
export function pageList(page: number, pageCount: number): Array<number | null> {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const list: Array<number | null> = [];
  for (const n of pages) {
    const previous = list[list.length - 1];
    if (typeof previous === "number" && n - previous === 2) list.push(previous + 1);
    else if (typeof previous === "number" && n - previous > 2) list.push(null);
    list.push(n);
  }
  return list;
}

/** Previous, numbered pages and Next. Finite pages, never infinite scroll. */
export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={cn(STEP, "font-medium text-ink hover:bg-surface-strong")}
        >
          <ChevronLeftIcon className="h-5 w-5" />
          Previous
        </Link>
      ) : (
        <span aria-disabled className={cn(STEP, "text-muted-soft")}>
          <ChevronLeftIcon className="h-5 w-5" />
          Previous
        </span>
      )}
      <ul className="contents">
        {pageList(page, pageCount).map((n, index) =>
          n === null ? (
            <li key={`gap-${index}`} aria-hidden className={cn(NUMBER, "w-7 text-muted")}>
              …
            </li>
          ) : (
            <li key={n} className="contents">
              <Link
                href={hrefFor(n)}
                aria-label={`Page ${n} of ${pageCount}`}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  NUMBER,
                  n === page
                    ? "bg-ink font-semibold text-canvas"
                    : "text-ink hover:bg-surface-strong",
                )}
              >
                {n}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={cn(STEP, "font-medium text-ink hover:bg-surface-strong")}
        >
          Next
          <ChevronRightIcon className="h-5 w-5" />
        </Link>
      ) : (
        <span aria-disabled className={cn(STEP, "text-muted-soft")}>
          Next
          <ChevronRightIcon className="h-5 w-5" />
        </span>
      )}
    </nav>
  );
}
