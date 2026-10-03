import { CollectionCardSkeleton } from "@/components/echo/collection-card";

export default function CollectionsLoading() {
  return (
    <div className="flex flex-col gap-8 py-8 tablet:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your collections
      </p>
      <div className="flex items-end justify-between gap-4">
        <div className="h-7 w-40 animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none" />
        <div className="h-12 w-44 animate-skeleton rounded-sm bg-surface-strong motion-reduce:animate-none" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <CollectionCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
