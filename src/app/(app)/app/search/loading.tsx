import { QuoteCardGridSkeleton } from "@/components/echo/quote-card";
import { LoadingState, Skeleton } from "@/components/ui/skeleton";

/** Search in gray: the title, the field and a page of result cards. */
export default function SearchLoading() {
  return (
    <LoadingState label="Searching your library" className="flex flex-col gap-6 py-8 tablet:py-12">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-12 w-full rounded-full desktop:h-16" />
      <Skeleton className="h-4 w-40" />
      <QuoteCardGridSkeleton />
    </LoadingState>
  );
}
