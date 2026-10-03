import Link from "next/link";
import { buttonClasses } from "./button-classes";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Builds the URL for a page number, keeping the other query parameters. */
  hrefFor: (page: number) => string;
};

/** Previous / "Page 2 of 7" / Next. Finite pages, never infinite scroll. */
export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;
  const disabled = "pointer-events-none border-hairline text-muted-soft";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={buttonClasses("secondary", undefined, "sm")}
        >
          Previous
        </Link>
      ) : (
        <span aria-disabled className={buttonClasses("secondary", disabled, "sm")}>
          Previous
        </span>
      )}
      <p className="text-body-sm text-muted tabular-nums" aria-current="page">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={buttonClasses("secondary", undefined, "sm")}
        >
          Next
        </Link>
      ) : (
        <span aria-disabled className={buttonClasses("secondary", disabled, "sm")}>
          Next
        </span>
      )}
    </nav>
  );
}
