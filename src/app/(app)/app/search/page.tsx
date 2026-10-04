import type { Metadata } from "next";
import Link from "next/link";
import { AccentDot } from "@/components/echo/accent-dot";
import { FavoriteButton } from "@/components/echo/favorite-button";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { Attribution, QuoteText } from "@/components/echo/quote-text";
import { SearchField } from "@/components/echo/search-field";
import { buttonClasses } from "@/components/ui/button-classes";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { highlight } from "@/lib/highlight";
import { hrefWith, parsePage, parseString } from "@/lib/search-params";
import { track } from "@/server/analytics";
import { requireUserPage } from "@/server/auth";
import { searchEchoes } from "@/server/services/search";
import { SEARCH_MAX } from "@/server/validation/echo";
import type { EchoDto } from "@/types/echo";

export const metadata: Metadata = { title: "Search" };

const PAGE_SIZE = 18;

export default async function SearchPage({ searchParams }: PageProps<"/app/search">) {
  const [user, params] = await Promise.all([requireUserPage(), searchParams]);
  const q = (parseString(params.q) ?? "").trim().slice(0, SEARCH_MAX);
  const page = parsePage(params.page);
  const result = q ? await searchEchoes(user.id, { q, page, limit: PAGE_SIZE }) : null;
  if (result && page === 1) track(user.id, "search_performed", { resultCount: result.total });
  const pageCount = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-6 py-8 tablet:gap-8 tablet:py-12">
      <h1 className="sr-only">Search</h1>
      <div className="flex flex-col gap-3">
        <SearchField initialQuery={q} />
        <p role="status" className="text-body-sm text-muted tabular-nums">
          {result
            ? result.total === 0
              ? ""
              : `${result.total === 1 ? "1 Echo" : `${result.total.toLocaleString("en-US")} Echoes`} match "${q}"`
            : ""}
        </p>
      </div>

      {!result ? (
        <EmptyState
          icon={<SearchIcon className="h-5 w-5" />}
          title="Search your library."
          body="Find Echoes by a word, an author, a source, a reflection, a tag or a collection."
        />
      ) : result.total === 0 ? (
        <section className="flex max-w-130 flex-col items-start gap-3.5">
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-tint-neutral text-muted"
          >
            <SearchIcon className="h-5 w-5" />
          </span>
          <h2 className="text-display-sm text-ink">Nothing matches &ldquo;{q}&rdquo; yet.</h2>
          <p className="text-body-md text-body">
            Search looks through quotes, authors, sources, your reflections, tags and collections.
            Try fewer words, or save it if it&apos;s something you want to keep.
          </p>
          <AddEchoLink className={buttonClasses("secondary")}>
            <PlusIcon className="h-4.5 w-4.5" />
            Add an Echo
          </AddEchoLink>
        </section>
      ) : (
        <>
          <section aria-labelledby="results-heading" className="flex max-w-3xl flex-col gap-3">
            <h2 id="results-heading" className="text-label text-muted uppercase">
              Echoes
            </h2>
            <ul className="divide-y divide-hairline-soft rounded-lg border border-hairline bg-canvas">
              {result.results.map((echo) => (
                <li key={echo.id}>
                  <SearchResult echo={echo} query={q} />
                </li>
              ))}
            </ul>
          </section>
          <Pagination
            page={page}
            pageCount={pageCount}
            hrefFor={(target) =>
              hrefWith("/app/search", { q, page: target > 1 ? target : undefined })
            }
          />
        </>
      )}
    </div>
  );
}

/**
 * One search result: the quote, the attribution, a matching reflection under "You wrote", and the
 * first collection, with the query's words marked.
 *
 * @param props - The Echo and the query.
 * @returns The result row.
 */
function SearchResult({ echo, query }: { echo: EchoDto; query: string }) {
  const collection = echo.collections[0];
  return (
    <article className="relative flex flex-col gap-2.5 p-5 transition-colors duration-fast ease-standard first:rounded-t-lg last:rounded-b-lg hover:bg-surface-soft tablet:p-6">
      <div className="flex items-start gap-3">
        <Link
          href={`/app/echoes/${echo.id}`}
          className="block min-w-0 flex-1 rounded-sm after:absolute after:inset-0"
        >
          <QuoteText size="card" className="line-clamp-4">
            {highlight(echo.quote, query)}
          </QuoteText>
        </Link>
        <FavoriteButton
          echoId={echo.id}
          isFavorite={echo.isFavorite}
          className="relative z-10 -mt-2 -mr-2 shrink-0"
        />
      </div>
      {(echo.author || echo.source) && (
        <p className="text-body-sm">
          <Attribution echo={echo} />
        </p>
      )}
      {echo.reflection && (
        <p className="flex gap-2.5 text-body-md text-body">
          <span className="shrink-0 pt-0.5 text-label text-muted uppercase">You wrote</span>
          <span className="line-clamp-3 min-w-0 user-text">
            {highlight(echo.reflection, query)}
          </span>
        </p>
      )}
      {collection && (
        <p className="flex items-center gap-1.5 text-caption-sm text-muted">
          <AccentDot accent={collection.accent} />
          <span className="truncate">In {highlight(collection.name, query)}</span>
        </p>
      )}
    </article>
  );
}
