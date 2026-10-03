import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuoteCard } from "@/components/echo/quote-card";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { SortSelect } from "@/components/echo/sort-select";
import { buttonClasses } from "@/components/ui/button-classes";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteMarksIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { requireUserPage } from "@/server/auth";
import { listEchoes } from "@/server/services/echoes";
import { ECHO_SORTS, type EchoSort } from "@/server/validation/echo";

export const metadata: Metadata = { title: "Library" };

// 18 fills 1, 2 and 3 columns evenly.
const PAGE_SIZE = 18;

/**
 * Reads a positive page number from the query string.
 *
 * @param value - The raw `page` parameter.
 * @returns The page number, or 1 when missing or invalid.
 */
function parsePage(value: string | string[] | undefined): number {
  const page = Number.parseInt(typeof value === "string" ? value : "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/**
 * Reads a known sort order from the query string.
 *
 * @param value - The raw `sort` parameter.
 * @returns The sort order, or "newest" when missing or unknown.
 */
function parseSort(value: string | string[] | undefined): EchoSort {
  return ECHO_SORTS.find((sort) => sort === value) ?? "newest";
}

/**
 * Builds a library URL for a page and sort, leaving defaults out of the query string.
 *
 * @param page - The page number.
 * @param sort - The sort order.
 * @returns The URL path with its query.
 */
function libraryHref(page: number, sort: EchoSort): string {
  const params = new URLSearchParams();
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/app/echoes?${query}` : "/app/echoes";
}

export default async function LibraryPage({ searchParams }: PageProps<"/app/echoes">) {
  const [user, params] = await Promise.all([requireUserPage(), searchParams]);
  const page = parsePage(params.page);
  const sort = parseSort(params.sort);
  const result = await listEchoes(user.id, { page, limit: PAGE_SIZE, sort });
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  if (result.total > 0 && page > pageCount) redirect(libraryHref(pageCount, sort));

  if (result.total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <EmptyState
          headingLevel="h1"
          icon={<QuoteMarksIcon className="h-12 w-12" />}
          title="Your library is empty."
          body="Save the words that make you stop and think."
          action={
            <AddEchoLink className={buttonClasses("primary")}>Add your first Echo</AddEchoLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 tablet:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg text-ink">Library</h1>
          <p className="mt-1 text-body-sm text-muted tabular-nums">
            {result.total === 1 ? "1 Echo" : `${result.total.toLocaleString("en-US")} Echoes`}
          </p>
        </div>
        <SortSelect value={sort} />
      </header>
      <ul className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {result.items.map((echo) => (
          <li key={echo.id} className="min-w-0">
            <QuoteCard echo={echo} showReflection />
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(target) => libraryHref(target, sort)}
      />
    </div>
  );
}
