"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { ShuffleIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fullDate, relativeDate } from "@/lib/dates";
import { RANDOM_EXCLUDE_MAX } from "@/server/services/discovery-rules";
import type { EchoDto } from "@/types/echo";
import { AccentDot } from "./accent-dot";
import { FavoriteButton } from "./favorite-button";
import { Attribution, QuoteText } from "./quote-text";

type TodaysEchoProps = {
  echo: EchoDto;
  /** The local date it is pinned to, as `YYYY-MM-DD`. */
  date: string;
  /** The date for the eyebrow, e.g. "Sunday, October 4", formatted on the server. */
  dateLabel: string;
};

/** How long the old quote takes to fade out before the next one rises in (motion.md, `fast`). */
const FADE_OUT_MS = 150;

/**
 * Builds the screen-reader announcement for a newly shown Echo.
 *
 * @param echo - The Echo now on screen.
 * @returns Text such as "Now showing an Echo by Mary Oliver, from Courage, saved 2 years ago."
 */
function announcement(echo: EchoDto): string {
  const by = echo.author ? ` by ${echo.author}` : "";
  const from = echo.collections[0] ? `, from ${echo.collections[0].name}` : "";
  return `Now showing an Echo${by}${from}, saved ${relativeDate(new Date(echo.savedAt))}.`;
}

/**
 * Today's Echo, the app's one bold moment: a 44px quote on canvas, with "You wrote" as a margin
 * note on desktop. "Echo me something" swaps in a random Echo in place: the old quote dims while
 * loading, fades out, and the new one rises in (instant with reduced motion), and a live region
 * announces it.
 */
export function TodaysEcho({ echo: initial, date, dateLabel }: TodaysEchoProps) {
  const toast = useToast();
  const [echo, setEcho] = useState(initial);
  const [phase, setPhase] = useState<"idle" | "loading" | "out">("idle");
  const [swaps, setSwaps] = useState(0);
  // Each press turns the shuffle icon half a turn, so the button answers before the new Echo lands.
  const [presses, setPresses] = useState(0);
  const [status, setStatus] = useState("");
  const shown = useRef<string[]>([initial.id]);
  const regionRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>();
  const collection = echo.collections[0];
  const savedAt = new Date(echo.savedAt);

  const echoMeSomething = async () => {
    if (phase !== "idle") return;
    setPresses((count) => count + 1);
    // Keep the region's height through the swap, so nothing below it jumps.
    setMinHeight(regionRef.current?.offsetHeight);
    setPhase("loading");
    try {
      const { echo: next } = await api.randomEcho(shown.current);
      if (!next) throw new Error("empty library");
      shown.current = [...shown.current, next.id].slice(-RANDOM_EXCLUDE_MAX);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        setPhase("out");
        await new Promise((resolve) => setTimeout(resolve, FADE_OUT_MS));
      }
      setEcho(next);
      setSwaps((count) => count + 1);
      setStatus(announcement(next));
    } catch (error) {
      toast({ message: failureMessage(error, "Couldn't find another Echo.") });
    } finally {
      setPhase("idle");
      setMinHeight(undefined);
    }
  };

  // The swap animates the quote block and the margin note; the buttons stay mounted so focus stays
  // on Echo me something.
  const swapClasses = cn(
    "min-w-0 transition-opacity",
    phase === "loading" && "opacity-60 duration-base ease-standard",
    phase === "out" && "opacity-0 duration-fast ease-in-soft",
    swaps > 0 && phase === "idle" && "animate-rise-in motion-reduce:animate-fade-in",
  );

  return (
    <section
      aria-labelledby="today-heading"
      className="animate-rise-in rounded-lg border border-hairline bg-canvas p-6 motion-reduce:animate-fade-in tablet:p-10 desktop:p-14"
    >
      <div
        ref={regionRef}
        style={minHeight ? { minHeight } : undefined}
        aria-busy={phase !== "idle" || undefined}
        className="grid grid-cols-1 gap-x-12 gap-y-6 tablet:gap-y-7 desktop:grid-cols-[minmax(0,1fr)_17.5rem]"
      >
        <h2
          id="today-heading"
          className="flex flex-wrap items-baseline gap-x-3 text-body-sm text-muted desktop:col-start-1"
        >
          <span className="font-semibold text-ink">Today&apos;s Echo</span>
          <span className="hidden tablet:inline">Something you once wanted to remember.</span>
          <time dateTime={date} className="sr-only">
            {dateLabel}
          </time>
        </h2>

        {/* Re-keyed on every swap so the rise-in plays again; the first render doesn't animate. */}
        <div key={`quote-${swaps}`} className={cn(swapClasses, "desktop:col-start-1")}>
          <figure className="flex flex-col gap-5 tablet:gap-7">
            <QuoteText size="today" className="max-w-3xl">
              {echo.quote}
            </QuoteText>
            <figcaption className="flex flex-col gap-1">
              {(echo.author || echo.source) && <Attribution echo={echo} className="text-body-md" />}
              <span className="flex flex-wrap items-center gap-x-2 text-body-sm text-muted">
                {collection && <AccentDot accent={collection.accent} />}
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {collection ? `From ${collection.name}` : "From your library"}
                </span>
                <span aria-hidden>·</span>
                <time dateTime={echo.savedAt} title={fullDate(savedAt)}>
                  saved {relativeDate(savedAt)}
                </time>
              </span>
            </figcaption>
          </figure>
        </div>

        {echo.reflection && (
          // A reader's note in the margin on desktop; below the quote on smaller screens.
          <aside
            key={`note-${swaps}`}
            aria-label="Your reflection"
            className={cn(
              swapClasses,
              "flex flex-col gap-2.5 self-start rounded-md bg-surface-soft p-4 tablet:p-5 desktop:col-start-2 desktop:row-start-2",
            )}
          >
            <p className="text-label text-muted uppercase">You wrote</p>
            <p className="text-body-md user-text text-body">{echo.reflection}</p>
          </aside>
        )}

        <div className="flex flex-col gap-2.5 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-3 tablet:pt-2 desktop:col-start-1">
          <Button
            onClick={() => void echoMeSomething()}
            // Not disabled while loading: a quick swap shouldn't flash the disabled colors; the
            // handler ignores repeat clicks instead.
            aria-busy={phase !== "idle" || undefined}
            className="w-full tablet:w-auto"
          >
            <ShuffleIcon
              className="h-4 w-4 transition-transform duration-slow ease-out-soft"
              style={{ transform: `rotate(${presses * 180}deg)` }}
            />
            Echo me something
          </Button>
          <div className="flex gap-2.5 tablet:contents">
            <Link
              href={`/app/echoes/${echo.id}`}
              aria-label="Open this Echo"
              className={buttonClasses("secondary", "flex-1 tablet:flex-none")}
            >
              Open
            </Link>
            <FavoriteButton
              key={echo.id}
              echoId={echo.id}
              isFavorite={echo.isFavorite}
              variant="filled"
            />
          </div>
        </div>
      </div>

      <p role="status" aria-atomic="true" className="sr-only">
        {status}
      </p>
    </section>
  );
}
