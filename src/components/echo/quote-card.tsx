import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ChipLink } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { EchoDto } from "@/types/echo";
import { FavoriteButton } from "./favorite-button";
import { QuoteText, attribution } from "./quote-text";
import { SavedDate } from "./saved-date";

export type QuoteCardProps = {
  echo: EchoDto;
  showReflection?: boolean;
  /** Shows up to four tag chips, each opening the library filtered by that tag. */
  showTags?: boolean;
  showSavedDate?: boolean;
  compact?: boolean;
  /** A card-level action shown in the footer, e.g. "Remove" on a collection page. */
  action?: ReactNode;
  className?: string;
};

const VISIBLE_TAGS = 4;

/** An Echo as a card: the quote opens the detail page, the heart stays independently clickable. */
export function QuoteCard({
  echo,
  showReflection = false,
  showTags = false,
  showSavedDate = true,
  compact = false,
  action,
  className,
}: QuoteCardProps) {
  const credit = attribution(echo);
  const tags = showTags && !compact ? echo.tags : [];
  const hiddenTags = tags.length - VISIBLE_TAGS;
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
      {tags.length > 0 && (
        // Above the stretched link, so each chip stays independently clickable.
        <ul aria-label="Tags" className="relative z-10 mt-4 flex flex-wrap gap-1">
          {tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <li key={tag.id} className="max-w-full min-w-0">
              <ChipLink href={`/app/echoes?tag=${tag.id}`} title={tag.name}>
                <span className="truncate">{tag.name}</span>
              </ChipLink>
            </li>
          ))}
          {hiddenTags > 0 && (
            <li>
              <ChipLink
                href={`/app/echoes/${echo.id}`}
                aria-label={`${hiddenTags} more ${hiddenTags === 1 ? "tag" : "tags"}`}
                className="tabular-nums"
              >
                +{hiddenTags}
              </ChipLink>
            </li>
          )}
        </ul>
      )}
      {(showSavedDate || action) && (
        <div className="mt-4 flex min-h-6 items-center justify-between gap-4">
          {showSavedDate ? <SavedDate savedAt={echo.savedAt} /> : <span />}
          {action && <div className="relative z-10 -my-2 shrink-0">{action}</div>}
        </div>
      )}
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
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%]" />{" "}
        {/* audit-ignore: skeleton widths from components.md */}
        <Skeleton className="h-4 w-[60%]" />{" "}
        {/* audit-ignore: skeleton widths from components.md */}
      </div>
      <Skeleton className="mt-4 h-4 w-[30%]" />{" "}
      {/* audit-ignore: skeleton widths from components.md */}
    </div>
  );
}

/** The QuoteCard grid in gray: as many cards as a page usually shows, in the same columns. */
export function QuoteCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <QuoteCardSkeleton key={index} />
      ))}
    </div>
  );
}
