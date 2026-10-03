import type { Metadata } from "next";
import { CollectionCard, echoCount } from "@/components/echo/collection-card";
import { NewCollectionButton } from "@/components/echo/new-collection-button";
import { buttonClasses } from "@/components/ui/button-classes";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderIcon, PlusIcon } from "@/components/ui/icons";
import { requireUserPage } from "@/server/auth";
import { listCollections } from "@/server/services/collections";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const user = await requireUserPage();
  const collections = await listCollections(user.id);

  if (collections.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <EmptyState
          headingLevel="h1"
          icon={<FolderIcon className="h-12 w-12" />}
          title="No collections yet."
          body="Collections help you gather Echoes around ideas, moments, and themes."
          action={
            <NewCollectionButton className={buttonClasses("secondary", "gap-2")}>
              <PlusIcon className="h-5 w-5 shrink-0" />
              Create a collection
            </NewCollectionButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 tablet:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-display-lg text-ink">Collections</h1>
          <p className="mt-1 text-body-sm text-muted tabular-nums">
            {collections.length === 1 ? "1 collection" : `${collections.length} collections`} ·{" "}
            {echoCount(collections.reduce((sum, collection) => sum + collection.echoCount, 0))}{" "}
            filed
          </p>
        </div>
        <NewCollectionButton className={buttonClasses("secondary", "gap-2")}>
          <PlusIcon className="h-5 w-5 shrink-0" />
          New collection
        </NewCollectionButton>
      </header>
      <ul className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {collections.map((collection) => (
          <li key={collection.id} className="min-w-0">
            <CollectionCard collection={collection} />
          </li>
        ))}
      </ul>
    </div>
  );
}
