import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { buttonClasses } from "@/components/ui/button-classes";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteMarksIcon } from "@/components/ui/icons";
import { greetingFor, localHour } from "@/lib/daily";
import { requireUserPage } from "@/server/auth";
import { getFromThePast, getLibraryCounts, getTodaysEcho } from "@/server/services/discovery";
import { listEchoes } from "@/server/services/echoes";
import { listRevisits } from "@/server/services/revisits";
import {
  FavoritesSection,
  FromThePastSection,
  LibrarySection,
  RecentSection,
  RecentSkeleton,
  RevisitsDueSection,
  SidePanelSkeleton,
  TodaySection,
  TodaySkeleton,
  settle,
} from "./home-sections";

export const metadata: Metadata = { title: "Home" };

/** How many rows each capped home list shows; the page is finite, never a feed. */
const RECENT_LIMIT = 5;
const REVISITS_LIMIT = 3;
const FAVORITES_LIMIT = 3;

export default async function HomePage() {
  const user = await requireUserPage();
  const timeZone = user.timezone ?? "UTC";
  const now = new Date();

  // Every panel's query starts now, in parallel; each panel awaits its own behind a Suspense
  // boundary, so a slow one never holds up the rest.
  const today = settle(getTodaysEcho(user.id, { now, timeZone }));
  const recent = settle(listEchoes(user.id, { page: 1, limit: RECENT_LIMIT, sort: "newest" }));
  const due = settle(listRevisits(user.id, "due", { now, limit: REVISITS_LIMIT }));
  const past = settle(getFromThePast(user.id, now));
  const favorites = settle(
    listEchoes(user.id, {
      page: 1,
      limit: FAVORITES_LIMIT,
      sort: "recently_favorited",
      favorite: true,
    }),
  );
  // The counts decide between first run and the dashboard, and feed the greeting line.
  const counts = await getLibraryCounts(user.id, now);

  if (counts.echoes === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <EmptyState
          headingLevel="h1"
          icon={<QuoteMarksIcon className="h-12 w-12" />}
          title="Welcome to Echo."
          body="Save the words you don't want to forget."
          action={
            <AddEchoLink firstRun className={buttonClasses("primary")}>
              Add your first Echo
            </AddEchoLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">
      <header className="pt-8 tablet:pt-12">
        <h1 className="text-display-lg text-ink">{greetingFor(localHour(timeZone, now))}</h1>
        <p className="mt-1 text-body-md text-body">
          {counts.revisitsDue > 0 ? (
            <Link
              href="/app/revisits"
              className="text-primary underline underline-offset-4 hover:decoration-2"
            >
              {counts.revisitsDue === 1
                ? "1 Echo is due for a revisit."
                : `${counts.revisitsDue} Echoes are due for a revisit.`}
            </Link>
          ) : (
            "Here's something from your library."
          )}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-8 desktop:grid-cols-3">
        <div className="grid min-w-0 grid-cols-1 content-start gap-8 desktop:col-span-2">
          <Suspense fallback={<TodaySkeleton />}>
            <TodaySection data={today} />
          </Suspense>
          <Suspense fallback={<RecentSkeleton />}>
            <RecentSection data={recent} />
          </Suspense>
        </div>
        <div className="grid min-w-0 grid-cols-1 content-start gap-8">
          {counts.revisitsDue > 0 && (
            <Suspense fallback={<SidePanelSkeleton tint="bg-tint-bronze" />}>
              <RevisitsDueSection data={due} total={counts.revisitsDue} />
            </Suspense>
          )}
          <Suspense fallback={<SidePanelSkeleton tint="bg-tint-plum" />}>
            <FromThePastSection data={past} />
          </Suspense>
          <LibrarySection counts={counts} />
        </div>
        {counts.favorites > 0 && (
          <Suspense fallback={null}>
            <FavoritesSection data={favorites} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
