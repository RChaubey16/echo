import type { Metadata } from "next";
import { EchoRow } from "@/components/echo/echo-row";
import { MarkReflectedButton } from "@/components/echo/mark-reflected-button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarIcon } from "@/components/ui/icons";
import { fullDate } from "@/lib/dates";
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
      <header>
        <h1 className="text-display-lg text-ink">Revisits</h1>
        <p className="mt-1 text-body-md text-body">
          Echoes you asked to see again. Nothing is sent; they wait for you here.
        </p>
      </header>

      {due.length === 0 && upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-5 w-5" />}
          title="Nothing scheduled."
          body="Pick an Echo and choose a day to see it again."
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 desktop:grid-cols-2">
          <section aria-labelledby="due-heading" className="rounded-lg bg-tint-ochre p-6">
            <h2 id="due-heading" className="text-display-sm text-ink">
              Due now <span className="text-body-md text-muted tabular-nums">({due.length})</span>
            </h2>
            {due.length === 0 ? (
              <p className="mt-3 text-body-sm text-muted">
                You&apos;re all caught up. Nothing is due.
              </p>
            ) : (
              <ul className="mt-2 grid grid-cols-1">
                {due.map((revisit) => (
                  <li key={revisit.id} className="min-w-0">
                    <EchoRow
                      echo={revisit.echo}
                      surface="tint"
                      meta={<RevisitDate revisit={revisit} prefix="Due" timeZone={timeZone} />}
                      action={<MarkReflectedButton revisitId={revisit.id} />}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="upcoming-heading"
            className="rounded-lg border border-hairline-soft bg-canvas p-6"
          >
            <h2 id="upcoming-heading" className="text-display-sm text-ink">
              Upcoming{" "}
              <span className="text-body-md text-muted tabular-nums">({upcoming.length})</span>
            </h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-body-sm text-muted">
                Nothing scheduled ahead. Open an Echo to choose a day.
              </p>
            ) : (
              <ul className="mt-2 grid grid-cols-1">
                {upcoming.map((revisit) => (
                  <li key={revisit.id} className="min-w-0">
                    <EchoRow
                      echo={revisit.echo}
                      meta={
                        <RevisitDate revisit={revisit} prefix="Revisit on" timeZone={timeZone} />
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
