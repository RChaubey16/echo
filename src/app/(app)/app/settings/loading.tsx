import { LoadingState, Skeleton } from "@/components/ui/skeleton";

/** Settings in gray: the title and the first two sections. */
export default function SettingsLoading() {
  return (
    <LoadingState
      label="Loading settings"
      className="mx-auto flex w-full max-w-3xl flex-col py-8 tablet:py-12"
    >
      <Skeleton className="mb-8 h-7 w-32" />
      {[0, 1].map((section) => (
        <div key={section} className="border-t border-hairline py-8">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-6 h-14 w-full rounded-sm" />
          <Skeleton className="mt-4 h-4 w-1/2" />
        </div>
      ))}
    </LoadingState>
  );
}
