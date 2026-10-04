import { LoadingState, Skeleton } from "@/components/ui/skeleton";
import { RecentSkeleton, SidePanelSkeleton, TodaySkeleton } from "./home-sections";

/** The home page's shape in gray: the greeting, Today's Echo, then Recently added beside the panels. */
export default function HomeLoading() {
  return (
    <LoadingState label="Loading your Echoes" className="flex flex-1 flex-col pt-6 tablet:pt-12">
      <h1 className="sr-only">Home</h1>
      <Skeleton className="h-7 w-56 max-w-full" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <div className="mt-7 flex flex-col gap-8 tablet:mt-10 tablet:gap-10">
        <TodaySkeleton />
        <div className="grid grid-cols-1 items-start gap-8 desktop:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <RecentSkeleton />
          <div className="grid grid-cols-1 gap-6">
            <SidePanelSkeleton tint="bg-tint-ochre" />
            <SidePanelSkeleton tint="bg-tint-heather" />
          </div>
        </div>
      </div>
    </LoadingState>
  );
}
