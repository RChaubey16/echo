import { QuoteCardGridSkeleton } from "@/components/echo/quote-card";
import { LoadingState, Skeleton } from "@/components/ui/skeleton";

export default function FavoritesLoading() {
  return (
    <LoadingState label="Loading your favorites" className="flex flex-col gap-8 py-8 tablet:py-12">
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-48 rounded-md" />
      </div>
      <QuoteCardGridSkeleton />
    </LoadingState>
  );
}
