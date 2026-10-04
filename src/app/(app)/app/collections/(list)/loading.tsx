import { CollectionCardSkeleton } from "@/components/echo/collection-card";
import { LoadingState, Skeleton } from "@/components/ui/skeleton";

export default function CollectionsLoading() {
  return (
    <LoadingState
      label="Loading your collections"
      className="flex flex-col gap-8 py-8 tablet:py-12"
    >
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-12 w-44 rounded-md" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <CollectionCardSkeleton key={index} />
        ))}
      </div>
    </LoadingState>
  );
}
