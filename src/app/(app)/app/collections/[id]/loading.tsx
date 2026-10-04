import { QuoteCardSkeleton } from "@/components/echo/quote-card";

const BAR = "animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none";

export default function CollectionLoading() {
  return (
    <div className="flex flex-col py-8 tablet:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        Loading collection
      </p>
      <div className="flex h-11 items-center">
        <div className={`h-4 w-24 ${BAR}`} />
      </div>
      <div className={`mt-4 h-7 w-64 max-w-full ${BAR}`} />
      <div className={`mt-3 h-4 w-32 ${BAR}`} />
      <div className="mt-8 grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <QuoteCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
