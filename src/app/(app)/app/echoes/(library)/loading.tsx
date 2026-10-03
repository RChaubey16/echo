import { QuoteCardSkeleton } from "@/components/echo/quote-card";

export default function LibraryLoading() {
  return (
    <div className="flex flex-col gap-8 py-8 tablet:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your library
      </p>
      <div className="flex items-end justify-between gap-4">
        <div className="h-7 w-32 animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none" />
        <div className="h-10 w-48 animate-skeleton rounded-sm bg-surface-strong motion-reduce:animate-none" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <QuoteCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
