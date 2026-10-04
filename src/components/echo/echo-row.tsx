import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { CollectionAccent } from "@/server/validation/collection";
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
  /** A row-level action under the meta line, e.g. "Mark as reflected". */
  action?: ReactNode;
  /** Replaces the saved date in the meta line, e.g. "Revisit on Apr 1, 2027". */
  meta?: ReactNode;
};

/** Monogram colors per collection accent: the accent mark on its matching tint. */
const MONOGRAM: Record<CollectionAccent, string> = {
  lagoon: "bg-tint-moss text-mark-moss",
  bronze: "bg-tint-ochre text-mark-ochre",
  plum: "bg-tint-heather text-mark-heather",
  neutral: "bg-tint-neutral text-mark-neutral",
};

/** A dense Echo row for dashboard panels: a two-line serif quote, a meta line and the heart. */
export function EchoRow({ echo, monogram = false, surface = "panel", action, meta }: EchoRowProps) {
  const credit = attribution(echo);
  const accent = echo.collections[0]?.accent ?? "lagoon";
  const initial = echo.author?.trim().charAt(0).toUpperCase() || "“";
  return (
    <article
      className={cn(
        "relative -mx-3 flex items-start gap-4 rounded-md px-3 py-4 transition-colors duration-fast ease-standard",
        surface === "panel" ? "hover:bg-surface-soft" : "hover:bg-canvas/60",
      )}
    >
      {monogram && (
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-quote text-quote-compact",
            MONOGRAM[accent],
          )}
        >
          {initial}
        </span>
      )}
      <figure className="min-w-0 flex-1">
        <Link
          href={`/app/echoes/${echo.id}`}
          className="block rounded-sm after:absolute after:inset-0 after:rounded-md"
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
          {meta ?? <SavedDate savedAt={echo.savedAt} className="shrink-0 whitespace-nowrap" />}
        </figcaption>
        {/* The action keeps its 44px target; negative margins stop it from padding out the row. */}
        {action && <div className="relative z-10 -mt-1 -mb-3">{action}</div>}
      </figure>
      <FavoriteButton
        echoId={echo.id}
        isFavorite={echo.isFavorite}
        className="relative z-10 -my-2 shrink-0"
      />
    </article>
  );
}
