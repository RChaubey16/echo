import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { EchoRow } from "@/components/echo/echo-row";
import { MarkReflectedButton } from "@/components/echo/mark-reflected-button";
import { QuoteCard } from "@/components/echo/quote-card";
import { TodaysEcho } from "@/components/echo/todays-echo";
import { SectionError } from "@/components/ui/error-state";
import { CalendarIcon, ClockIcon, FolderIcon, HeartIcon, LibraryIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
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

/** A tinted side panel's header: a round icon chip and the heading, with an optional link. */
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
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas",
            iconClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
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
      <section aria-labelledby="today-heading" className="rounded-md bg-tint-lagoon p-6 tablet:p-8">
        <h2 id="today-heading" className="text-caption text-primary">
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
    <div aria-hidden className="rounded-md bg-tint-lagoon p-6 tablet:p-8">
      <Skeleton className="h-4 w-48" />
      <div className="mt-6 grid gap-3">
        <Skeleton className="h-7 w-11/12" />
        <Skeleton className="h-7 w-8/12" />
      </div>
      <Skeleton className="mt-6 h-4 w-40" />
      <Skeleton className="mt-8 h-11 w-48 rounded-full" />
    </div>
  );
}

export async function RecentSection({ data }: { data: Promise<Settled<EchoListDto>> }) {
  const result = await data;
  return (
    <section
      aria-labelledby="recent-heading"
      className="rounded-md border border-hairline-soft bg-canvas p-6"
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
        <ul className="mt-2 grid grid-cols-1">
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
    <ul aria-hidden className="mt-4 grid grid-cols-1">
      {[0, 1, 2].map((row) => (
        <li key={row} className={cn("py-4", row > 0 && "border-t border-hairline-soft")}>
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="mt-2 h-3 w-4/12" />
        </li>
      ))}
    </ul>
  );
}

export function RecentSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("rounded-md border border-hairline-soft bg-canvas p-6", className)}
    >
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
    <section aria-labelledby="revisits-heading" className="rounded-md bg-tint-bronze p-6">
      <PanelHeader
        id="revisits-heading"
        title="Revisits due"
        icon={CalendarIcon}
        iconClass="text-luxe"
        link={
          <Link href="/app/revisits" className={LINK}>
            View all
            {total > 3 && <span className="sr-only"> {total} due Revisits</span>}
          </Link>
        }
      />
      <p className="mt-3 text-body-sm text-muted">You asked to see these again around now.</p>
      {result.ok ? (
        <ul className="mt-2 grid grid-cols-1">
          {result.value.map((revisit) => (
            <li key={revisit.id} className="min-w-0">
              <EchoRow
                echo={revisit.echo}
                surface="tint"
                action={<MarkReflectedButton revisitId={revisit.id} />}
              />
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
    <section aria-labelledby="past-heading" className="rounded-md bg-tint-plum p-6">
      <PanelHeader id="past-heading" title="From the past" icon={ClockIcon} iconClass="text-plus" />
      {result.ok && result.value ? (
        <>
          <p className="mt-3 text-body-sm text-muted">
            You saved this {result.value.label} this week.
          </p>
          <div className="mt-2">
            <EchoRow echo={result.value.echo} surface="tint" />
          </div>
        </>
      ) : (
        <SectionError what="this memory" retryHref="/app" />
      )}
    </section>
  );
}

export function SidePanelSkeleton({ tint, className }: { tint: string; className?: string }) {
  return (
    <div aria-hidden className={cn("rounded-md p-6", tint, className)}>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-8/12" />
    </div>
  );
}

const STATS: Array<{
  key: keyof LibraryCounts;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chip: string;
}> = [
  {
    key: "echoes",
    label: "Echoes",
    href: "/app/echoes",
    icon: LibraryIcon,
    chip: "bg-tint-lagoon text-primary",
  },
  {
    key: "favorites",
    label: "Favorites",
    href: "/app/favorites",
    icon: HeartIcon,
    chip: "bg-tint-plum text-plus",
  },
  {
    key: "collections",
    label: "Collections",
    href: "/app/collections",
    icon: FolderIcon,
    chip: "bg-tint-bronze text-luxe",
  },
  {
    key: "revisitsDue",
    label: "Revisits due",
    href: "/app/revisits",
    icon: CalendarIcon,
    chip: "bg-surface-strong text-ink",
  },
];

/** "Your library": four plain counts, each linking to its view. No goals or streaks. */
export function LibrarySection({ counts }: { counts: LibraryCounts }) {
  return (
    <section
      aria-labelledby="library-heading"
      className="rounded-md border border-hairline-soft bg-canvas p-6"
    >
      <h2 id="library-heading" className="text-display-sm text-ink">
        Your library
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        {STATS.map(({ key, label, href, icon: Icon, chip }) => (
          <li key={key} className="flex min-w-0 items-center gap-2 tablet:gap-3">
            {/* Smaller on phones so labels like "Collections" fit two-up at 320px. */}
            <span
              aria-hidden
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full tablet:h-10 tablet:w-10",
                chip,
              )}
            >
              <Icon className="h-4 w-4 tablet:h-5 tablet:w-5" />
            </span>
            <div className="min-w-0">
              <span aria-hidden className="block truncate text-body-sm text-muted">
                {label}
              </span>
              <Link
                href={href}
                aria-label={`${counts[key]} ${label.toLowerCase()}`}
                className="block text-display-sm text-ink tabular-nums underline-offset-4 hover:underline"
              >
                {counts[key].toLocaleString("en-US")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function FavoritesSection({ data }: { data: Promise<Settled<EchoListDto>> }) {
  const result = await data;
  if (result.ok && result.value.items.length === 0) return null;
  return (
    <section aria-labelledby="favorites-heading" className="min-w-0 desktop:col-span-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="favorites-heading" className="text-display-sm text-ink">
          Favorites
        </h2>
        <Link href="/app/favorites" className={LINK}>
          View all
        </Link>
      </div>
      {result.ok ? (
        <ul className="mt-6 grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
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
