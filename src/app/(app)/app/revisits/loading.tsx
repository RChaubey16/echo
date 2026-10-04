import { LoadingState, Skeleton } from "@/components/ui/skeleton";

/** The Revisits page in gray: the title, then the Due now and Upcoming panels. */
export default function RevisitsLoading() {
  return (
    <LoadingState
      label="Loading your Revisits"
      className="flex flex-1 flex-col gap-8 py-8 tablet:py-12"
    >
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="grid items-start gap-8 desktop:grid-cols-2">
        {["bg-tint-ochre", "border border-hairline-soft bg-canvas"].map((panel) => (
          <div key={panel} className={`rounded-lg p-6 ${panel}`}>
            <Skeleton className="h-5 w-32" />
            {[0, 1, 2].map((row) => (
              <div key={row} className="py-4">
                <Skeleton className="h-4 w-10/12" />
                <Skeleton className="mt-2 h-3 w-4/12" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </LoadingState>
  );
}
