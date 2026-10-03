import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuoteCard } from "@/components/echo/quote-card";
import { ChipLink } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { HeartIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { hrefWith, parsePage, parseSort } from "@/lib/search-params";
import { requireUserPage } from "@/server/auth";
import { listEchoes } from "@/server/services/echoes";
import type { EchoSort } from "@/server/validation/echo";

export const metadata: Metadata = { title: "Favorites" };

const PAGE_SIZE = 18;
const FAVORITE_SORTS = ["recently_favorited", "recently_updated"] as const satisfies EchoSort[];
type FavoriteSort = (typeof FAVORITE_SORTS)[number];
const SORT_LABELS: Record<FavoriteSort, string> = {
  recently_favorited: "Recently favorited",
  recently_updated: "Recently updated",
};

/**
 * Builds a favorites URL, leaving defaults out of the query string.
 *
 * @param page - The page number.
 * @param sort - The sort order.
 * @returns The URL path with its query.
 */
function favoritesHref(page: number, sort: FavoriteSort): string {
  return hrefWith("/app/favorites", {
    sort: sort === "recently_favorited" ? undefined : sort,
    page: page > 1 ? page : undefined,
  });
}

export default async function FavoritesPage({ searchParams }: PageProps<"/app/favorites">) {
  const [user, params] = await Promise.all([requireUserPage(), searchParams]);
  const page = parsePage(params.page);
  const sort = parseSort(params.sort, FAVORITE_SORTS);
  const result = await listEchoes(user.id, { page, limit: PAGE_SIZE, sort, favorite: true });
  const pageCount = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  if (result.total > 0 && page > pageCount) redirect(favoritesHref(pageCount, sort));

  if (result.total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <EmptyState
          headingLevel="h1"
          icon={<HeartIcon className="h-12 w-12" />}
          title="Nothing here yet."
          body="Favorite the Echoes you never want to lose."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 tablet:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg text-ink">Favorites</h1>
          <p className="mt-1 text-body-sm text-muted tabular-nums">
            {result.total === 1 ? "1 Echo" : `${result.total.toLocaleString("en-US")} Echoes`}
          </p>
        </div>
        <nav aria-label="Sort favorites">
          <ul className="flex flex-wrap gap-2">
            {FAVORITE_SORTS.map((option) => (
              <li key={option}>
                <ChipLink
                  href={favoritesHref(1, option)}
                  selected={option === sort}
                  aria-current={option === sort ? "page" : undefined}
                >
                  {SORT_LABELS[option]}
                </ChipLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <ul className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {result.items.map((echo) => (
          <li key={echo.id} className="min-w-0">
            <QuoteCard echo={echo} showReflection showTags />
          </li>
        ))}
      </ul>
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(target) => favoritesHref(target, sort)}
      />
    </div>
  );
}
