import { LoadingState, Skeleton } from "@/components/ui/skeleton";

/** The Echo form in gray: the title, the quote field and the details fields. */
export default function EditEchoLoading() {
  return (
    <LoadingState
      label="Loading Echo"
      className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-8 tablet:py-12"
    >
      <Skeleton className="h-7 w-36" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-32 w-full rounded-sm" />
      </div>
      {[0, 1].map((field) => (
        <div key={field} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-14 w-full rounded-sm" />
        </div>
      ))}
    </LoadingState>
  );
}
