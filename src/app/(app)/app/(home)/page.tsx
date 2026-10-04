import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { buttonClasses } from "@/components/ui/button-classes";
import { PlusIcon, QuoteMarksIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
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
  // The counts decide between first run and the dashboard, and feed the greeting line. From the past
  // is awaited here too (one small query, already running): whether it has a memory decides if
  // Recently added shares its row with the side panels.
  const [counts, pastResult] = await Promise.all([getLibraryCounts(user.id, now), past]);
  const showPast = !pastResult.ok || pastResult.value !== null;
  const hasSidePanels = counts.revisitsDue > 0 || showPast;
  const firstName = user.name?.trim().split(/\s+/)[0];

  if (counts.echoes === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-6 tablet:py-12">
        <section className="flex w-full max-w-xl flex-col items-start gap-5 rounded-lg border border-hairline bg-canvas p-7 tablet:p-14">
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-tint-moss text-mark-moss"
          >
            <QuoteMarksIcon className="h-5 w-5" />
          </span>
          <h1 className="text-display-lg text-ink">
            {firstName ? `Welcome to Echo, ${firstName}` : "Welcome to Echo."}
          </h1>
          <p className="text-body-md text-pretty text-body">
            Your library is waiting. Save the first words that stayed with you: a line from a book,
            something a friend said, a lyric you can&apos;t shake.
          </p>
          <div className="flex flex-col gap-3 pt-1">
            <AddEchoLink firstRun className={buttonClasses("primary", "self-start")}>
              <PlusIcon className="h-4.5 w-4.5" />
              Add your first Echo
            </AddEchoLink>
            <p className="text-body-sm text-muted">
              Only the words are needed. Everything else can wait.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">
      <header className="flex flex-col gap-1.5 pt-6 tablet:pt-12">
        <h1 className="text-display-lg text-ink">
          {greetingFor(localHour(timeZone, now))}
          {firstName && `, ${firstName}`}
        </h1>
        <p className="text-body-md text-body">
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

      <div className="mt-7 flex flex-col gap-8 tablet:mt-10 tablet:gap-10">
        <Suspense fallback={<TodaySkeleton />}>
          <TodaySection data={today} />
        </Suspense>
        {/* With nothing due and no memory, Recently added takes the full width. */}
        <div
          className={cn(
            "grid grid-cols-1 items-start gap-8",
            hasSidePanels && "desktop:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
          )}
        >
          <Suspense fallback={<RecentSkeleton />}>
            <RecentSection data={recent} />
          </Suspense>
          {hasSidePanels && (
            <div className="grid min-w-0 grid-cols-1 content-start gap-6">
              {counts.revisitsDue > 0 && (
                <Suspense fallback={<SidePanelSkeleton tint="bg-tint-ochre" />}>
                  <RevisitsDueSection data={due} total={counts.revisitsDue} />
                </Suspense>
              )}
              {showPast && <FromThePastSection data={past} />}
            </div>
          )}
        </div>
        <LibrarySection counts={counts} />
        {counts.favorites > 0 && (
          <Suspense fallback={null}>
            <FavoritesSection data={favorites} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
