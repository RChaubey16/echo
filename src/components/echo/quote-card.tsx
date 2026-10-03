import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { EchoDto } from "@/types/echo";
import { FavoriteButton } from "./favorite-button";
import { QuoteText, attribution } from "./quote-text";
import { SavedDate } from "./saved-date";

export type QuoteCardProps = {
  echo: EchoDto;
  showReflection?: boolean;
  /** Tags arrive in Phase 3; this prop does nothing until then. */
  showTags?: boolean;
  showSavedDate?: boolean;
  compact?: boolean;
  className?: string;
};

/** An Echo as a card: the quote opens the detail page, the heart stays independently clickable. */
export function QuoteCard({
  echo,
  showReflection = false,
  showSavedDate = true,
  compact = false,
  className,
}: QuoteCardProps) {
  const credit = attribution(echo);
  return (
    <Card as="article" interactive compact={compact} className={cn("flex flex-col", className)}>
      <figure className="min-w-0">
        <Link
          href={`/app/echoes/${echo.id}`}
          className="block rounded-xs after:absolute after:inset-0 after:rounded-md"
        >
          <QuoteText size="card" className={cn("pr-8", compact ? "line-clamp-3" : "line-clamp-6")}>
            {echo.quote}
          </QuoteText>
        </Link>
        {credit && (
          <figcaption className="mt-3 truncate text-body-sm text-muted" title={credit}>
            — {credit}
          </figcaption>
        )}
      </figure>
      {showReflection && !compact && echo.reflection && (
        <p className="mt-4 line-clamp-3 border-t border-hairline-soft pt-4 text-body-sm [overflow-wrap:anywhere] whitespace-pre-wrap text-body">
          <span className="sr-only">Your reflection: </span>
          {echo.reflection}
        </p>
      )}
      {showSavedDate && <SavedDate savedAt={echo.savedAt} className="mt-4" />}
      {/* After the quote in the DOM so tab order matches reading order; positioned top-right. */}
      <FavoriteButton
        echoId={echo.id}
        isFavorite={echo.isFavorite}
        className={cn("absolute z-10", compact ? "top-2 right-2" : "top-3 right-3")}
      />
    </Card>
  );
}

/** The QuoteCard skeleton: three quote bars and a meta bar inside the same Card padding. */
export function QuoteCardSkeleton() {
  return (
    <div aria-hidden className="rounded-md border border-hairline bg-surface-card p-6">
      <div className="flex flex-col gap-2">
        {["w-full", "w-[85%]", "w-[60%]"].map((width) => (
          <div
            key={width}
            className={`h-4 ${width} animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none`} // audit-ignore: skeleton widths from components.md
          />
        ))}
      </div>
      <div className="mt-4 h-4 w-[30%] animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none" />
    </div>
  );
}
