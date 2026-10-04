import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ACCENT_TINT, AccentDot } from "@/components/echo/accent-dot";
import { echoCount } from "@/components/echo/collection-card";
import {
  AddEchoesButton,
  CollectionActions,
  RemoveFromCollectionButton,
} from "@/components/echo/collection-actions";
import { MASONRY, MASONRY_ITEM, QuoteCard } from "@/components/echo/quote-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/cn";
import { hrefWith, parsePage } from "@/lib/search-params";
import { track } from "@/server/analytics";
import { requireUserPage } from "@/server/auth";
import { getCollectionOrNotFound } from "@/server/organization-pages";

export const metadata: Metadata = { title: "Collection" };

const PAGE_SIZE = 18;

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/app/collections/[id]">) {
  const [user, { id }, query] = await Promise.all([requireUserPage(), params, searchParams]);
  const page = parsePage(query.page);
  const collection = await getCollectionOrNotFound(user.id, id, {
    page,
    limit: PAGE_SIZE,
    sort: "newest",
  });
  const { echoes } = collection;
  const pageCount = Math.max(1, Math.ceil(echoes.total / PAGE_SIZE));
  const pageHref = (target: number) =>
    hrefWith(`/app/collections/${collection.id}`, { page: target > 1 ? target : undefined });
  if (echoes.total > 0 && page > pageCount) redirect(pageHref(pageCount));
  if (page === 1) track(user.id, "collection_opened");

  return (
    <div className="flex flex-col py-6 tablet:py-8">
      <Link
        href="/app/collections"
        className="-ml-2 inline-flex h-11 items-center gap-1.5 self-start rounded-md px-2 text-body-md font-medium text-body transition-colors duration-fast ease-standard hover:bg-surface-strong hover:text-ink"
      >
        <ArrowLeftIcon className="h-4.5 w-4.5" />
        Collections
      </Link>

      <header
        className={cn(
          "mt-4 flex flex-col gap-5 rounded-lg p-6 tablet:flex-row tablet:items-start tablet:justify-between tablet:gap-8 tablet:p-8",
          ACCENT_TINT[collection.accent],
        )}
      >
        <div className="flex max-w-160 min-w-0 flex-col gap-2.5">
          <h1 className="flex min-w-0 items-center gap-2.5 text-display-lg text-ink">
            <AccentDot accent={collection.accent} size="md" />
            <span className="[overflow-wrap:anywhere]">{collection.name}</span>
          </h1>
          {collection.description && (
            <p className="text-body-md user-text text-body">{collection.description}</p>
          )}
          <p className="text-body-sm text-body tabular-nums">{echoCount(collection.echoCount)}</p>
        </div>
        <CollectionActions collection={collection} />
      </header>

      {echoes.total === 0 ? (
        <EmptyState
          className="mt-12"
          title="This collection is empty."
          body="Add Echoes from your library to start gathering them here."
          action={<AddEchoesButton collectionId={collection.id} />}
        />
      ) : (
        <>
          <ul className={`mt-8 ${MASONRY}`}>
            {echoes.items.map((echo) => (
              <li key={echo.id} className={MASONRY_ITEM}>
                <QuoteCard
                  echo={echo}
                  showTags
                  action={
                    <RemoveFromCollectionButton collectionId={collection.id} echoId={echo.id} />
                  }
                />
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Pagination page={page} pageCount={pageCount} hrefFor={pageHref} />
          </div>
        </>
      )}
    </div>
  );
}
