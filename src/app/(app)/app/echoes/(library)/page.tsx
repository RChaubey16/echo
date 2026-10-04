import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccentDot } from "@/components/echo/accent-dot";
import { MASONRY, MASONRY_ITEM, QuoteCard } from "@/components/echo/quote-card";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { SortSelect } from "@/components/echo/sort-select";
import { buttonClasses } from "@/components/ui/button-classes";
import { chipClasses } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckIcon, CloseIcon, QuoteMarksIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { hrefWith, parsePage, parseSort, parseString, parseUuid } from "@/lib/search-params";
import { requireUserPage } from "@/server/auth";
import { getLibraryFilters } from "@/server/organization-pages";
import { listEchoes } from "@/server/services/echoes";
import { listTags } from "@/server/services/tags";
import type { TagDto } from "@/types/echo";
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
  const tagParam = parseString(params.tag);
  const collectionParam = parseString(params.collection);
  const tagId = parseUuid(tagParam);
  const collectionId = parseUuid(collectionParam);
  // Both only need the URL, so they run together. Listing by a not-owned ID is safe (every query
  // is scoped to the user); such a filter is dropped by the redirect below.
  const [filters, result, tags] = await Promise.all([
    getLibraryFilters(user.id, tagId, collectionId),
    listEchoes(user.id, { page, limit: PAGE_SIZE, sort, tag: tagId, collection: collectionId }),
    listTags(user.id),
  ]);
  const state: LibraryState = {
    page,
    sort,
    tag: filters.tag?.id,
    collection: filters.collection?.id,
  };
  // Unknown, malformed or not-owned filter IDs are dropped rather than shown as an empty library.
  if ((tagParam && !filters.tag) || (collectionParam && !filters.collection)) {
    redirect(libraryHref(state));
  }

  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  if (result.total > 0 && page > pageCount) redirect(libraryHref({ ...state, page: pageCount }));
  const filtered = Boolean(filters.tag || filters.collection);

  if (result.total === 0 && !filtered) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <EmptyState
          headingLevel="h1"
          icon={<QuoteMarksIcon className="h-5 w-5" />}
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

      <TagFilter
        tags={tags}
        selected={filters.tag?.id}
        hrefFor={(tag) => libraryHref({ ...state, tag, page: 1 })}
      />

      {filters.collection && (
        <ul aria-label="Active filters" className="-mt-4 flex flex-wrap items-center gap-2">
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
              className={buttonClasses("tertiary", "", "sm")}
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
        <ul className={MASONRY}>
          {result.items.map((echo) => (
            <li key={echo.id} className={MASONRY_ITEM}>
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

/** How many tags the filter shows on phones before "More tags". */
const MOBILE_TAGS = 3;
/** How many of the most-used tags the filter offers at all. */
const MAX_TAGS = 12;

/**
 * The tag filter strip: "All" plus the most-used tags with their counts. The selected tag is ink
 * with a check. Phones show three tags, and the rest behind "More tags".
 *
 * @param props - The user's tags, the selected tag, and the URL builder.
 * @returns The filter, or null when the user has no tags.
 */
function TagFilter({
  tags,
  selected,
  hrefFor,
}: {
  tags: TagDto[];
  selected?: string;
  hrefFor: (tagId: string | undefined) => string;
}) {
  const used = tags.filter((tag) => tag.echoCount > 0 || tag.id === selected);
  if (used.length === 0) return null;
  const top = [...used]
    .sort((a, b) => b.echoCount - a.echoCount || a.name.localeCompare(b.name))
    .slice(0, MAX_TAGS);
  // Keep a selected tag visible even when it isn't among the most used.
  const chosen = used.find((tag) => tag.id === selected);
  if (chosen && !top.includes(chosen)) top.push(chosen);

  const chip = (tag: TagDto, className?: string) => {
    const active = tag.id === selected;
    return (
      <li key={tag.id} className={className ?? "max-w-full min-w-0"}>
        <Link
          href={hrefFor(active ? undefined : tag.id)}
          aria-current={active ? "true" : undefined}
          // The selected tag clears the filter when pressed, and says so.
          aria-label={active ? `Remove filter: tag ${tag.name}` : undefined}
          title={tag.name}
          className={chipClasses(active)}
        >
          {active && <CheckIcon className="h-4 w-4 shrink-0" />}
          <span className="truncate">{tag.name}</span>
          <span className={active ? "font-normal" : "font-normal text-muted"}>
            <span className="sr-only">, </span>
            {tag.echoCount}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Filter by tag"
      className="-mt-2 flex flex-wrap items-center gap-2 border-b border-hairline pb-5"
    >
      <span className="mr-1 text-caption text-body">Tags</span>
      <ul className="contents">
        <li>
          <Link
            href={hrefFor(undefined)}
            aria-current={selected ? undefined : "true"}
            className={chipClasses(!selected)}
          >
            All
          </Link>
        </li>
        {top.slice(0, MOBILE_TAGS).map((tag) => chip(tag))}
        {/* The rest show inline from tablet up; on phones they wait behind "More tags". */}
        {top.slice(MOBILE_TAGS).map((tag) => chip(tag, "hidden max-w-full min-w-0 tablet:block"))}
      </ul>
      {top.length > MOBILE_TAGS && (
        <details className="group w-full tablet:hidden">
          <summary
            className={buttonClasses(
              "tertiary",
              "list-none px-2.5 [&::-webkit-details-marker]:hidden",
              "sm",
            )}
          >
            <span className="group-open:hidden">More tags</span>
            <span className="hidden group-open:inline">Fewer tags</span>
          </summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {top.slice(MOBILE_TAGS).map((tag) => chip(tag))}
          </ul>
        </details>
      )}
    </nav>
  );
}
