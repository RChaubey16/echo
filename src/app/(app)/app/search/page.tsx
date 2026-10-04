import type { Metadata } from "next";
import { QuoteCard } from "@/components/echo/quote-card";
import { SearchField } from "@/components/echo/search-field";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { hrefWith, parsePage, parseString } from "@/lib/search-params";
import { track } from "@/server/analytics";
import { requireUserPage } from "@/server/auth";
import { searchEchoes } from "@/server/services/search";
import { SEARCH_MAX } from "@/server/validation/echo";

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
    <div className="flex flex-col gap-6 py-8 tablet:py-12">
      <h1 className="text-display-lg text-ink">Search</h1>
      <SearchField initialQuery={q} />

      <p role="status" className="text-body-sm text-muted tabular-nums">
        {result
          ? result.total === 0
            ? ""
            : `${result.total === 1 ? "1 Echo" : `${result.total.toLocaleString("en-US")} Echoes`} match "${q}"`
          : ""}
      </p>

      {!result ? (
        <EmptyState
          icon={<SearchIcon className="h-5 w-5" />}
          title="Search your library."
          body="Find Echoes by a word, an author, a source, a reflection, a tag or a collection."
        />
      ) : result.total === 0 ? (
        <EmptyState
          title={`No Echoes match "${q}".`}
          body="Try a different word, an author, or a tag."
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {result.results.map((echo) => (
              <li key={echo.id} className="min-w-0">
                <QuoteCard echo={echo} showReflection showTags />
              </li>
            ))}
          </ul>
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
