import Link from "next/link";
import { cn } from "@/lib/cn";
import type { EchoDto } from "@/types/echo";
import { FavoriteButton } from "./favorite-button";
import { QuoteText, attribution } from "./quote-text";
import { SavedDate } from "./saved-date";

type EchoRowProps = {
  echo: EchoDto;
  /** Shows the author's initial (or a quote mark) in a 40px tinted circle. */
  monogram?: boolean;
  /** "panel" for white panels, "tint" for tinted ones; sets the hover fill. */
  surface?: "panel" | "tint";
};

/** A dense Echo row for dashboard panels: a two-line serif quote, a meta line and the heart. */
export function EchoRow({ echo, monogram = false, surface = "panel" }: EchoRowProps) {
  const credit = attribution(echo);
  const initial = echo.author?.trim().charAt(0).toUpperCase() || "“";
  return (
    <article
      className={cn(
        "relative -mx-3 flex items-start gap-4 rounded-sm px-3 py-4 transition-colors duration-fast ease-standard",
        surface === "panel" ? "hover:bg-surface-soft" : "hover:bg-canvas/60",
      )}
    >
      {monogram && (
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint-lagoon font-quote text-quote-compact text-primary"
        >
          {initial}
        </span>
      )}
      <figure className="min-w-0 flex-1">
        <Link
          href={`/app/echoes/${echo.id}`}
          className="block rounded-xs after:absolute after:inset-0 after:rounded-sm"
        >
          <QuoteText size="compact" className="line-clamp-2">
            {echo.quote}
          </QuoteText>
        </Link>
        <figcaption className="mt-1 flex min-w-0 gap-1 text-body-sm text-muted">
          {credit && (
            <>
              <span className="truncate" title={credit}>
                {credit}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <SavedDate savedAt={echo.savedAt} className="shrink-0 whitespace-nowrap" />
        </figcaption>
      </figure>
      <FavoriteButton
        echoId={echo.id}
        isFavorite={echo.isFavorite}
        className="relative z-10 -my-2 shrink-0"
      />
    </article>
  );
}
