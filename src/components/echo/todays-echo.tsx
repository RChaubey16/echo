"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { OpenQuoteIcon, ShuffleIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fullDate, relativeDate } from "@/lib/dates";
import { RANDOM_EXCLUDE_MAX } from "@/server/services/discovery-rules";
import type { EchoDto } from "@/types/echo";
import { AccentDot } from "./accent-dot";
import { FavoriteButton } from "./favorite-button";
import { QuoteText, attribution } from "./quote-text";

type TodaysEchoProps = {
  echo: EchoDto;
  /** The local date it is pinned to, as `YYYY-MM-DD`. */
  date: string;
  /** The date for the eyebrow, e.g. "Sunday, October 4", formatted on the server. */
  dateLabel: string;
};

/** How long the old quote takes to fade out before the next one rises in (motion.md, `fast`). */
const FADE_OUT_MS = 120;

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
 * Today's Echo, the home page's one loud moment. "Echo me something" swaps in a random Echo in
 * place: the old quote dims while loading, fades out, and the new one rises in (instant with
 * reduced motion), and a live region announces it.
 */
export function TodaysEcho({ echo: initial, date, dateLabel }: TodaysEchoProps) {
  const toast = useToast();
  const [echo, setEcho] = useState(initial);
  const [phase, setPhase] = useState<"idle" | "loading" | "out">("idle");
  const [swaps, setSwaps] = useState(0);
  const [status, setStatus] = useState("");
  const shown = useRef<string[]>([initial.id]);
  const regionRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>();
  const credit = attribution(echo);
  const collection = echo.collections[0];
  const savedAt = new Date(echo.savedAt);

  const echoMeSomething = async () => {
    if (phase !== "idle") return;
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

  return (
    <section aria-labelledby="today-heading" className="rounded-md bg-tint-lagoon p-6 tablet:p-8">
      <h2 id="today-heading" className="text-caption text-primary">
        Today&apos;s Echo · <time dateTime={date}>{dateLabel}</time>
      </h2>

      <div
        ref={regionRef}
        style={minHeight ? { minHeight } : undefined}
        aria-busy={phase !== "idle" || undefined}
        className={cn(
          "mt-6 transition-opacity",
          phase === "loading" && "opacity-60 duration-base ease-standard",
          phase === "out" && "opacity-0 duration-fast ease-in-soft",
        )}
      >
        {/* Re-keyed on every swap so the rise-in plays again; the first render doesn't animate. */}
        <div key={swaps} className={cn(swaps > 0 && "animate-rise-in motion-reduce:animate-none")}>
          <OpenQuoteIcon className="mb-3 h-8 w-8 text-primary opacity-40" />
          <figure>
            <QuoteText size="hero">{echo.quote}</QuoteText>
            {credit && <figcaption className="mt-4 text-body-md text-body">{credit}</figcaption>}
          </figure>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-body-sm text-muted">
            {collection && <AccentDot accent={collection.accent} />}
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {collection ? `From ${collection.name}` : "From your library"}
            </span>
            <span aria-hidden>·</span>
            <time dateTime={echo.savedAt} title={fullDate(savedAt)}>
              saved {relativeDate(savedAt)}
            </time>
          </p>
          {echo.reflection && (
            <div className="mt-8 rounded-sm bg-canvas p-4 tablet:p-6">
              <p className="text-caption text-muted">You wrote:</p>
              <p className="mt-2 text-body-md [overflow-wrap:anywhere] whitespace-pre-wrap text-body">
                {echo.reflection}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 tablet:flex-row tablet:items-center">
        <Button
          variant="pill"
          onClick={() => void echoMeSomething()}
          // Not disabled while loading: a quick swap shouldn't flash the disabled colors; the
          // handler ignores repeat clicks instead.
          aria-busy={phase !== "idle" || undefined}
          className="w-full tablet:w-auto"
        >
          <ShuffleIcon className="h-4 w-4" />
          Echo me something
        </Button>
        <div className="flex flex-1 items-center justify-between gap-4">
          <Link href={`/app/echoes/${echo.id}`} className={buttonClasses("tertiary", "h-11")}>
            Open Echo
          </Link>
          <FavoriteButton key={echo.id} echoId={echo.id} isFavorite={echo.isFavorite} />
        </div>
      </div>

      <p role="status" aria-atomic="true" className="sr-only">
        {status}
      </p>
    </section>
  );
}
