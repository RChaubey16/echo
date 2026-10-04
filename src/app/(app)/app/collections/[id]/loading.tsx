import { QuoteCardGridSkeleton } from "@/components/echo/quote-card";
import { LoadingState, Skeleton } from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <LoadingState label="Loading collection" className="flex flex-col py-8 tablet:py-12">
      <div className="flex h-11 items-center">
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mt-4 h-7 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-32" />
      <div className="mt-8">
        <QuoteCardGridSkeleton />
      </div>
    </LoadingState>
  );
}
