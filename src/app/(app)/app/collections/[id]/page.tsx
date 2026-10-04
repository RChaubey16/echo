import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccentDot } from "@/components/echo/accent-dot";
import { echoCount } from "@/components/echo/collection-card";
import {
  AddEchoesButton,
  CollectionActions,
  RemoveFromCollectionButton,
} from "@/components/echo/collection-actions";
import { QuoteCard } from "@/components/echo/quote-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
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
    <div className="flex flex-col py-8 tablet:py-12">
      <Link
        href="/app/collections"
        className="-ml-1 inline-flex h-11 items-center gap-1.5 self-start rounded-md px-1 text-body-sm text-muted transition-colors duration-fast ease-standard hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Collections
      </Link>

      <header className="mt-4 flex flex-col gap-4 tablet:flex-row tablet:items-start tablet:justify-between">
        <div className="max-w-3xl min-w-0">
          <h1 className="flex min-w-0 items-center gap-3 text-display-lg text-ink">
            <AccentDot accent={collection.accent} className="h-3 w-3" />
            <span className="[overflow-wrap:anywhere]">{collection.name}</span>
          </h1>
          {collection.description && (
            <p className="mt-2 text-body-md user-text text-body">{collection.description}</p>
          )}
          <p className="mt-2 text-body-sm text-muted tabular-nums">
            {echoCount(collection.echoCount)}
          </p>
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
          <ul className="mt-8 grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
            {echoes.items.map((echo) => (
              <li key={echo.id} className="min-w-0">
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
