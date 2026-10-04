import type { Metadata } from "next";
import Link from "next/link";
import { Attribution, QuoteText, attribution } from "@/components/echo/quote-text";
import { UpcomingRevisitActions } from "@/components/echo/upcoming-revisit-actions";
import { buttonClasses } from "@/components/ui/button-classes";
import { MarkReflectedButton } from "@/components/echo/mark-reflected-button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarIcon } from "@/components/ui/icons";
import { fullDate, inFromNow, relativeDate } from "@/lib/dates";
import { shortRevisitDate } from "@/lib/revisit-dates";
import { requireUserPage } from "@/server/auth";
import { listRevisits } from "@/server/services/revisits";
import type { RevisitWithEchoDto } from "@/types/echo";

export const metadata: Metadata = { title: "Revisits" };

/** "Revisit on Apr 1, 2027" (or "Due since …") inside a `<time>` with the full date as its title. */
function RevisitDate({
  revisit,
  prefix,
  timeZone,
}: {
  revisit: RevisitWithEchoDto;
  prefix: string;
  timeZone: string;
}) {
  const date = new Date(revisit.scheduledFor);
  return (
    <span className="shrink-0 whitespace-nowrap">
      {prefix}{" "}
      <time dateTime={revisit.scheduledFor} title={fullDate(date)} className="tabular-nums">
        {shortRevisitDate(revisit.scheduledFor, timeZone)}
      </time>
    </span>
  );
}

export default async function RevisitsPage() {
  const user = await requireUserPage();
  const timeZone = user.timezone ?? "UTC";
  const now = new Date();
  const [due, upcoming] = await Promise.all([
    listRevisits(user.id, "due", { now }),
    listRevisits(user.id, "upcoming", { now }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-8 py-8 tablet:py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-display-lg text-ink">Revisits</h1>
        <p className="text-body-md text-body">
          Echoes you asked to see again, on the day you chose. Nothing is sent; they wait for you
          here.
        </p>
      </header>

      {due.length === 0 && upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-5 w-5" />}
          title="Nothing scheduled."
          body="Pick an Echo and choose a day to see it again."
        />
      ) : (
        <>
          <section aria-labelledby="due-heading" className="flex flex-col gap-4">
            <h2 id="due-heading" className="flex items-center gap-2.5 text-display-sm text-ink">
              Due now
              {due.length > 0 && (
                <span className="rounded-sm bg-tint-ochre px-2 py-0.5 text-badge text-ink tabular-nums">
                  {due.length}
                </span>
              )}
            </h2>
            {due.length === 0 ? (
              <p className="text-body-md text-muted">You&apos;re all caught up. Nothing is due.</p>
            ) : (
              <ul className="grid grid-cols-1 items-start gap-4 desktop:grid-cols-2">
                {due.map((revisit) => (
                  <li key={revisit.id} className="min-w-0">
                    <DueCard revisit={revisit} timeZone={timeZone} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="upcoming-heading" className="flex flex-col gap-4">
            <h2 id="upcoming-heading" className="text-display-sm text-ink">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-body-md text-muted">
                Nothing scheduled ahead. Open an Echo to choose a day.
              </p>
            ) : (
              <ul className="divide-y divide-hairline-soft rounded-lg border border-hairline bg-canvas">
                {upcoming.map((revisit) => (
                  <li key={revisit.id}>
                    <UpcomingRow revisit={revisit} timeZone={timeZone} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/**
 * A due Revisit as a card with an ochre top bar: when it was due, the full quote, and the actions.
 *
 * @param props - The Revisit and the user's time zone.
 * @returns The card.
 */
function DueCard({ revisit, timeZone }: { revisit: RevisitWithEchoDto; timeZone: string }) {
  const { echo } = revisit;
  return (
    <article className="flex flex-col gap-5 rounded-lg border border-t-4 border-hairline border-t-mark-ochre bg-canvas p-6 tablet:p-8">
      <p className="flex items-center gap-2 text-body-sm text-muted">
        <CalendarIcon aria-hidden className="h-4.5 w-4.5 shrink-0 text-mark-ochre" />
        <RevisitDate revisit={revisit} prefix="Due" timeZone={timeZone} />
        <span className="sr-only">, {relativeDate(new Date(revisit.scheduledFor))}</span>
      </p>
      <figure className="flex flex-col gap-3">
        <QuoteText size="card" className="line-clamp-8">
          {echo.quote}
        </QuoteText>
        {(echo.author || echo.source) && (
          <figcaption className="text-body-md">
            <Attribution echo={echo} />
          </figcaption>
        )}
      </figure>
      <div className="flex flex-wrap items-center gap-2.5 border-t border-hairline-soft pt-4">
        <MarkReflectedButton revisitId={revisit.id} size="md" />
        <Link href={`/app/echoes/${echo.id}`} className={buttonClasses("tertiary", "ml-auto h-12")}>
          Open
          <span className="sr-only"> this Echo</span>
        </Link>
      </div>
    </article>
  );
}

/**
 * An upcoming Revisit as a row: the date, the quote on one line, and Change / Cancel.
 *
 * @param props - The Revisit and the user's time zone.
 * @returns The row.
 */
function UpcomingRow({ revisit, timeZone }: { revisit: RevisitWithEchoDto; timeZone: string }) {
  const { echo } = revisit;
  const date = new Date(revisit.scheduledFor);
  const credit = attribution(echo);
  return (
    <article className="grid grid-cols-1 gap-x-6 gap-y-2 px-5 py-4 tablet:grid-cols-[8.75rem_minmax(0,1fr)_auto] tablet:items-center tablet:px-6 tablet:py-4.5">
      <p className="flex items-baseline gap-2 tablet:flex-col tablet:gap-0.5">
        <time
          dateTime={revisit.scheduledFor}
          title={fullDate(date)}
          className="text-body-md font-semibold text-ink tabular-nums"
        >
          {shortRevisitDate(revisit.scheduledFor, timeZone)}
        </time>
        <span className="text-caption-sm text-muted">{inFromNow(date)}</span>
      </p>
      <Link
        href={`/app/echoes/${echo.id}`}
        className="min-w-0 rounded-sm underline-offset-4 hover:underline"
      >
        <QuoteText size="compact" className="truncate whitespace-nowrap">
          {echo.quote}
        </QuoteText>
        {credit && <span className="block truncate text-caption-sm text-muted">{credit}</span>}
      </Link>
      <div className="-ml-3 tablet:ml-0">
        <UpcomingRevisitActions revisitId={revisit.id} echoId={echo.id} timeZone={timeZone} />
      </div>
    </article>
  );
}
