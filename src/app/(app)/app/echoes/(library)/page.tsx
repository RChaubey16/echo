import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccentDot } from "@/components/echo/accent-dot";
import { QuoteCard } from "@/components/echo/quote-card";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { SortSelect } from "@/components/echo/sort-select";
import { buttonClasses } from "@/components/ui/button-classes";
import { chipClasses } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { CloseIcon, QuoteMarksIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { hrefWith, parsePage, parseSort, parseString } from "@/lib/search-params";
import { requireUserPage } from "@/server/auth";
import { getLibraryFilters } from "@/server/organization-pages";
import { listEchoes } from "@/server/services/echoes";
import type { EchoSort } from "@/server/validation/echo";

export const metadata: Metadata = { title: "Library" };

// 18 fills 1, 2 and 3 columns evenly.
const PAGE_SIZE = 18;
const LIBRARY_SORTS = [
  "newest",
  "oldest",
  "recently_updated",
  "author",
] as const satisfies EchoSort[];

type LibraryState = { page: number; sort: EchoSort; tag?: string; collection?: string };

/**
 * Builds a library URL, leaving defaults out of the query string.
 *
 * @param state - The page, sort and filters.
 * @returns The URL path with its query.
 */
function libraryHref({ page, sort, tag, collection }: LibraryState): string {
  return hrefWith("/app/echoes", {
    tag,
    collection,
    sort: sort === "newest" ? undefined : sort,
    page: page > 1 ? page : undefined,
  });
}

export default async function LibraryPage({ searchParams }: PageProps<"/app/echoes">) {
  const [user, params] = await Promise.all([requireUserPage(), searchParams]);
  const page = parsePage(params.page);
  const sort = parseSort(params.sort, LIBRARY_SORTS);
  const tagId = parseString(params.tag);
  const collectionId = parseString(params.collection);
  const filters = await getLibraryFilters(user.id, tagId, collectionId);
  const state: LibraryState = {
    page,
    sort,
    tag: filters.tag?.id,
    collection: filters.collection?.id,
  };
  // Unknown or not-owned filter IDs are dropped rather than shown as an empty library.
  if ((tagId && !filters.tag) || (collectionId && !filters.collection)) {
    redirect(libraryHref(state));
  }

  const result = await listEchoes(user.id, {
    page,
    limit: PAGE_SIZE,
    sort,
    tag: state.tag,
    collection: state.collection,
  });
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  if (result.total > 0 && page > pageCount) redirect(libraryHref({ ...state, page: pageCount }));
  const filtered = Boolean(filters.tag || filters.collection);

  if (result.total === 0 && !filtered) {
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
            {filtered && " match these filters"}
          </p>
        </div>
        <SortSelect value={sort} />
      </header>

      {filtered && (
        <ul aria-label="Active filters" className="-mt-4 flex flex-wrap items-center gap-2">
          {filters.tag && (
            <li className="max-w-full min-w-0">
              <Link
                href={libraryHref({ ...state, tag: undefined, page: 1 })}
                className={chipClasses(true)}
                aria-label={`Remove filter: tag ${filters.tag.name}`}
                title={filters.tag.name}
              >
                <span className="truncate">Tag: {filters.tag.name}</span>
                <CloseIcon className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </li>
          )}
          {filters.collection && (
            <li className="max-w-full min-w-0">
              <Link
                href={libraryHref({ ...state, collection: undefined, page: 1 })}
                className={chipClasses(true)}
                aria-label={`Remove filter: collection ${filters.collection.name}`}
                title={filters.collection.name}
              >
                <AccentDot accent={filters.collection.accent} />
                <span className="truncate">{filters.collection.name}</span>
                <CloseIcon className="h-3.5 w-3.5 shrink-0" />
              </Link>
            </li>
          )}
          <li>
            <Link
              href={libraryHref({ page: 1, sort })}
              className="inline-flex h-8 items-center px-2 text-button-sm text-ink underline-offset-4 hover:underline"
            >
              Clear filters
            </Link>
          </li>
        </ul>
      )}

      {result.total === 0 ? (
        <EmptyState
          title="No Echoes match these filters."
          body="Try removing a filter, or clear them all to see your whole library."
          action={
            <Link href={libraryHref({ page: 1, sort })} className={buttonClasses("secondary")}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {result.items.map((echo) => (
            <li key={echo.id} className="min-w-0">
              <QuoteCard echo={echo} showReflection showTags />
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(target) => libraryHref({ ...state, page: target })}
      />
    </div>
  );
}
