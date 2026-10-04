import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { EchoRow } from "@/components/echo/echo-row";
import { Attribution, QuoteText, attribution } from "@/components/echo/quote-text";
import { MarkReflectedButton } from "@/components/echo/mark-reflected-button";
import { QuoteCard } from "@/components/echo/quote-card";
import { TodaysEcho } from "@/components/echo/todays-echo";
import { SectionError } from "@/components/ui/error-state";
import { CalendarIcon, ClockIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { relativeDate } from "@/lib/dates";
import type { LibraryCounts } from "@/server/services/discovery";
import type { EchoDto, EchoListDto, RevisitWithEchoDto, TodaysEchoDto } from "@/types/echo";

/** A section's data, or the failure that kept it from loading. */
export type Settled<T> = { ok: true; value: T } | { ok: false };

/**
 * Turns a section's data promise into one that never rejects, so one failing panel shows an inline
 * error while the rest of the home page keeps working.
 *
 * @param promise - The section's data promise.
 * @returns A promise of the data or a failure marker.
 */
export function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    () => ({ ok: false as const }),
  );
}

const LINK = "text-body-sm font-medium text-ink underline-offset-4 hover:underline";

/**
 * Home's sections rise in once as they stream in, 40ms apart (ui-ux-pro-max: stagger 30–50ms),
 * so the page settles rather than popping in. Reduced motion makes it a plain fade.
 */
const ENTER = "animate-rise-in motion-reduce:animate-fade-in";
const STAGGER = [
  "[animation-delay:40ms]",
  "[animation-delay:80ms]",
  "[animation-delay:120ms]",
  "[animation-delay:160ms]",
] as const;

/** A tinted side panel's header: the icon in its accent mark and the heading, with an optional link. */
function PanelHeader({
  id,
  title,
  icon: Icon,
  iconClass,
  link,
}: {
  id: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClass: string;
  link?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon aria-hidden className={cn("h-5 w-5 shrink-0", iconClass)} />
        <h2 id={id} className="text-display-sm text-ink">
          {title}
        </h2>
      </div>
      {link}
    </div>
  );
}

/**
 * Formats Today's Echo's date for its eyebrow.
 *
 * @param day - The local date as `YYYY-MM-DD`.
 * @returns Text such as "Sunday, October 4".
 */
function dayLabel(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function TodaySection({ data }: { data: Promise<Settled<TodaysEchoDto | null>> }) {
  const result = await data;
  if (!result.ok) {
    return (
      <section
        aria-labelledby="today-heading"
        className="rounded-lg border border-hairline bg-canvas p-6 tablet:p-10"
      >
        <h2 id="today-heading" className="text-body-sm font-semibold text-ink">
          Today&apos;s Echo
        </h2>
        <SectionError what="today's Echo" retryHref="/app" />
      </section>
    );
  }
  if (!result.value) return null;
  const { echo, date } = result.value;
  return <TodaysEcho echo={echo} date={date} dateLabel={dayLabel(date)} />;
}

export function TodaySkeleton() {
  return (
    <div
      aria-hidden
      className="rounded-lg border border-hairline bg-canvas p-6 tablet:p-10 desktop:p-14"
    >
      <Skeleton className="h-4 w-48" />
      <div className="mt-7 grid gap-3">
        <Skeleton className="h-9 w-11/12" />
        <Skeleton className="h-9 w-8/12" />
      </div>
      <Skeleton className="mt-7 h-4 w-40" />
      <Skeleton className="mt-8 h-12 w-48" />
    </div>
  );
}

export async function RecentSection({ data }: { data: Promise<Settled<EchoListDto>> }) {
  const result = await data;
  return (
    <section
      aria-labelledby="recent-heading"
      className={cn(ENTER, STAGGER[0], "flex min-w-0 flex-col gap-3.5")}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="recent-heading" className="text-display-sm text-ink">
          Recently added
        </h2>
        <Link href="/app/echoes" className={LINK}>
          View library
        </Link>
      </div>
      {result.ok ? (
        <ul className="grid grid-cols-1 rounded-lg border border-hairline bg-canvas p-1.5">
          {result.value.items.map((echo) => (
            <li key={echo.id} className="min-w-0">
              <EchoRow echo={echo} monogram />
            </li>
          ))}
        </ul>
      ) : (
        <SectionError what="your recent Echoes" retryHref="/app" />
      )}
    </section>
  );
}

/** Placeholder rows for a panel list; three suggest the list without overflowing the screen. */
function SkeletonRows() {
  return (
    <ul aria-hidden className="grid grid-cols-1 rounded-lg border border-hairline bg-canvas p-1.5">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex gap-3.5 p-3">
          <div className="h-10 w-10 shrink-0 rounded-md bg-surface-strong" />
          <div className="flex-1">
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="mt-2 h-3 w-4/12" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RecentSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-3.5", className)}>
      <Skeleton className="h-5 w-36" />
      <SkeletonRows />
    </div>
  );
}

export async function RevisitsDueSection({
  data,
  total,
}: {
  data: Promise<Settled<RevisitWithEchoDto[]>>;
  total: number;
}) {
  const result = await data;
  if (result.ok && result.value.length === 0) return null;
  return (
    <section
      aria-labelledby="revisits-heading"
      className={cn(
        ENTER,
        STAGGER[1],
        "flex flex-col gap-3.5 rounded-lg bg-tint-ochre p-5 tablet:p-6",
      )}
    >
      <PanelHeader
        id="revisits-heading"
        title="Revisits due"
        icon={CalendarIcon}
        iconClass="text-mark-ochre"
        link={
          <Link href="/app/revisits" className={LINK}>
            View all
            {total > 3 && <span className="sr-only"> {total} due Revisits</span>}
          </Link>
        }
      />
      <p className="text-body-sm text-body">You asked to see these again around now.</p>
      {result.ok ? (
        <ul className="grid grid-cols-1 gap-3">
          {result.value.map((revisit) => (
            <li key={revisit.id} className="min-w-0">
              <DueRevisit revisit={revisit} />
            </li>
          ))}
        </ul>
      ) : (
        <SectionError what="your Revisits" retryHref="/app" />
      )}
    </section>
  );
}

export async function FromThePastSection({
  data,
}: {
  data: Promise<Settled<{ echo: EchoDto; label: string } | null>>;
}) {
  const result = await data;
  if (result.ok && !result.value) return null;
  return (
    <section
      aria-labelledby="past-heading"
      className={cn(
        ENTER,
        STAGGER[2],
        "flex flex-col gap-3 rounded-lg bg-tint-heather p-5 tablet:p-6",
      )}
    >
      <PanelHeader
        id="past-heading"
        title="From the past"
        icon={ClockIcon}
        iconClass="text-mark-heather"
        link={
          result.ok && result.value ? (
            <span className="shrink-0 text-caption-sm text-body">{result.value.label}</span>
          ) : undefined
        }
      />
      {result.ok && result.value ? (
        <PastEcho echo={result.value.echo} label={result.value.label} />
      ) : (
        <SectionError what="this memory" retryHref="/app" />
      )}
    </section>
  );
}

export function SidePanelSkeleton({ tint, className }: { tint: string; className?: string }) {
  return (
    <div aria-hidden className={cn("rounded-lg p-5 tablet:p-6", tint, className)}>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-8/12" />
    </div>
  );
}

const STATS: Array<{ key: keyof LibraryCounts; label: string; href: string }> = [
  { key: "echoes", label: "Echoes", href: "/app/echoes" },
  { key: "favorites", label: "Favorites", href: "/app/favorites" },
  { key: "collections", label: "Collections", href: "/app/collections" },
  { key: "revisitsDue", label: "Revisits due", href: "/app/revisits" },
];

/** "Your library": four plain counts in one row, each linking to its view. No goals or streaks. */
export function LibrarySection({ counts }: { counts: LibraryCounts }) {
  return (
    <section aria-labelledby="library-heading" className="flex min-w-0 flex-col gap-3.5">
      <h2 id="library-heading" className="text-display-sm text-ink">
        Your library
      </h2>
      <ul className="grid grid-cols-2 overflow-hidden rounded-lg border border-hairline bg-canvas tablet:grid-cols-4">
        {STATS.map(({ key, label, href }, index) => (
          <li
            key={key}
            className={cn(
              "min-w-0 border-hairline-soft",
              index % 2 === 1 && "border-l",
              index >= 2 && "border-t tablet:border-t-0",
              index === 2 && "tablet:border-l",
            )}
          >
            <Link
              href={href}
              className="flex h-full flex-col gap-0.5 px-5 py-4 transition-colors duration-fast ease-standard hover:bg-surface-soft tablet:px-6 tablet:py-5"
            >
              <span className="text-display-lg text-ink tabular-nums">
                {counts[key].toLocaleString("en-US")}
              </span>
              <span className="truncate text-body-sm text-muted">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * One due Revisit in the home panel: the quote on a canvas slip, when it was due, and "Mark as
 * reflected".
 *
 * @param props - The due Revisit with its Echo.
 * @returns The slip.
 */
function DueRevisit({ revisit }: { revisit: RevisitWithEchoDto }) {
  const credit = attribution(revisit.echo);
  return (
    <article className="relative flex flex-col gap-3 rounded-md bg-canvas p-4">
      <Link
        href={`/app/echoes/${revisit.echo.id}`}
        className="block rounded-sm after:absolute after:inset-0 after:rounded-md"
      >
        <QuoteText size="compact" className="line-clamp-3">
          {revisit.echo.quote}
        </QuoteText>
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-caption-sm text-muted">
          {credit && <span className="[overflow-wrap:anywhere]">{credit} · </span>}
          due {relativeDate(new Date(revisit.scheduledFor))}
        </span>
        <div className="relative z-10 w-full tablet:w-auto">
          <MarkReflectedButton revisitId={revisit.id} className="w-full tablet:w-auto" />
        </div>
      </div>
    </article>
  );
}

/**
 * The From the past memory: the quote a size up, the author, and the old reflection.
 *
 * @param props - The Echo and how long ago it was saved.
 * @returns The memory.
 */
function PastEcho({ echo, label }: { echo: EchoDto; label: string }) {
  return (
    <figure className="relative flex flex-col gap-2">
      <Link
        href={`/app/echoes/${echo.id}`}
        aria-label={`Open the Echo you saved ${label}`}
        className="block rounded-sm after:absolute after:inset-0 after:rounded-md"
      >
        <QuoteText size="memory" className="line-clamp-4">
          {echo.quote}
        </QuoteText>
      </Link>
      {(echo.author || echo.source) && (
        <figcaption className="text-body-sm">
          <Attribution echo={echo} />
        </figcaption>
      )}
      {echo.reflection && (
        <p className="line-clamp-3 text-body-sm user-text text-body">
          You wrote: {echo.reflection}
        </p>
      )}
    </figure>
  );
}

export async function FavoritesSection({ data }: { data: Promise<Settled<EchoListDto>> }) {
  const result = await data;
  if (result.ok && result.value.items.length === 0) return null;
  return (
    <section
      aria-labelledby="favorites-heading"
      className={cn(ENTER, STAGGER[3], "flex min-w-0 flex-col gap-3.5")}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="favorites-heading" className="text-display-sm text-ink">
          Favorites
        </h2>
        <Link href="/app/favorites" className={LINK}>
          View all
        </Link>
      </div>
      {result.ok ? (
        <ul className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {result.value.items.map((echo) => (
            <li key={echo.id} className="min-w-0">
              <QuoteCard echo={echo} showReflection showTags />
            </li>
          ))}
        </ul>
      ) : (
        <SectionError what="your favorites" retryHref="/app" />
      )}
    </section>
  );
}
