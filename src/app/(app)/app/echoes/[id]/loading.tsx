import { LoadingState, Skeleton } from "@/components/ui/skeleton";

export default function EchoLoading() {
  return (
    <LoadingState
      label="Loading Echo"
      className="mx-auto flex w-full max-w-3xl flex-col py-8 tablet:py-12"
    >
      <div className="flex h-11 items-center">
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-7 w-[90%]" /> {/* audit-ignore: TodaysEcho skeleton widths */}
        <Skeleton className="h-7 w-[70%]" /> {/* audit-ignore: TodaysEcho skeleton widths */}
      </div>
      <Skeleton className="mt-6 h-4 w-[30%]" /> {/* audit-ignore: meta bar width */}
    </LoadingState>
  );
}
