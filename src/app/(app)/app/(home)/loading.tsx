import { LoadingState, Skeleton } from "@/components/ui/skeleton";
import { RecentSkeleton, SidePanelSkeleton, TodaySkeleton } from "./home-sections";

/** The home page's shape in gray: it fills the screen, and the last panel in each column stretches. */
export default function HomeLoading() {
  return (
    <LoadingState label="Loading your Echoes" className="flex flex-1 flex-col pt-8 tablet:pt-12">
      <h1 className="sr-only">Home</h1>
      <Skeleton className="h-7 w-56 max-w-full" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <div className="mt-8 grid min-h-0 flex-1 gap-8 desktop:grid-cols-3">
        <div className="flex min-h-0 min-w-0 flex-col gap-8 desktop:col-span-2">
          <TodaySkeleton />
          <RecentSkeleton className="min-h-0 flex-1 overflow-hidden" />
        </div>
        <div className="flex min-h-0 min-w-0 flex-col gap-8">
          <SidePanelSkeleton tint="bg-tint-bronze" />
          <SidePanelSkeleton tint="bg-tint-plum" />
          <SidePanelSkeleton
            tint="border border-hairline-soft bg-canvas"
            className="min-h-0 flex-1 overflow-hidden"
          />
        </div>
      </div>
    </LoadingState>
  );
}
