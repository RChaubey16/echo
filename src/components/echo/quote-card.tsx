import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ChipLink } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { highlight } from "@/lib/highlight";
import type { EchoDto } from "@/types/echo";
import { AccentDot } from "./accent-dot";
import { FavoriteButton } from "./favorite-button";
import { Attribution, QuoteText } from "./quote-text";
import { SavedDate } from "./saved-date";

type QuoteCardProps = {
  echo: EchoDto;
  showReflection?: boolean;
  /** Shows up to four tag chips, each opening the library filtered by that tag. */
  showTags?: boolean;
  showSavedDate?: boolean;
  compact?: boolean;
  /** A card-level action shown in the footer, e.g. "Remove" on a collection page. */
  action?: ReactNode;
  /** A search query whose words are highlighted in the quote and reflection. */
  highlightQuery?: string;
  className?: string;
};

const VISIBLE_TAGS = 4;

/**
 * An Echo as a card: the quote opens the detail page. The footer row holds the first collection
 * (or the saved date) and the heart, which stays independently clickable.
 */
export function QuoteCard({
  echo,
  showReflection = false,
  showTags = false,
  showSavedDate = true,
  compact = false,
  action,
  highlightQuery,
  className,
}: QuoteCardProps) {
  const tags = showTags && !compact ? echo.tags : [];
  const hiddenTags = tags.length - VISIBLE_TAGS;
  const collection = echo.collections[0];
  return (
    <Card
      as="article"
      interactive
      compact={compact}
      className={cn("flex flex-col gap-3.5", className)}
    >
      <figure className="flex min-w-0 flex-col gap-3.5">
        <Link
          href={`/app/echoes/${echo.id}`}
          className="block rounded-sm after:absolute after:inset-0 after:rounded-lg"
        >
          <QuoteText size="card" className={compact ? "line-clamp-3" : "line-clamp-6"}>
            {highlight(echo.quote, highlightQuery)}
          </QuoteText>
        </Link>
        {(echo.author || echo.source) && (
          <figcaption className="text-body-sm">
            <Attribution echo={echo} />
          </figcaption>
        )}
      </figure>
      {showReflection && !compact && echo.reflection && (
        <p className="line-clamp-3 border-l-2 border-hairline pl-3 text-body-sm user-text text-body">
          <span className="sr-only">Your reflection: </span>
          {highlight(echo.reflection, highlightQuery)}
        </p>
      )}
      {tags.length > 0 && (
        // Above the stretched link, so each chip stays independently clickable.
        <ul aria-label="Tags" className="relative z-10 flex flex-wrap gap-1.5">
          {tags.slice(0, VISIBLE_TAGS).map((tag) => (
            <li key={tag.id} className="max-w-full min-w-0">
              <ChipLink size="sm" href={`/app/echoes?tag=${tag.id}`} title={tag.name}>
                <span className="truncate">{tag.name}</span>
              </ChipLink>
            </li>
          ))}
          {hiddenTags > 0 && (
            <li>
              <ChipLink
                size="sm"
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
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-hairline-soft pt-3 text-caption-sm text-muted">
        <div className="flex min-w-0 items-center gap-1.5">
          {collection ? (
            <>
              <AccentDot accent={collection.accent} />
              <span className="truncate" title={collection.name}>
                <span className="sr-only">In </span>
                {collection.name}
              </span>
            </>
          ) : (
            showSavedDate && <SavedDate savedAt={echo.savedAt} className="text-caption-sm" />
          )}
        </div>
        <div className="relative z-10 -my-3 -mr-3 flex shrink-0 items-center">
          {action}
          <FavoriteButton echoId={echo.id} isFavorite={echo.isFavorite} />
        </div>
      </div>
    </Card>
  );
}

/** The QuoteCard skeleton: three quote bars and a meta bar inside the same Card padding. */
export function QuoteCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-3 rounded-lg border border-hairline bg-canvas p-6"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%]" />{" "}
        {/* audit-ignore: skeleton widths from components.md */}
        <Skeleton className="h-4 w-[60%]" />{" "}
        {/* audit-ignore: skeleton widths from components.md */}
      </div>
      <Skeleton className="mt-2 h-3 w-1/3" />
      <div className="mt-2 h-px bg-hairline-soft" />
      <Skeleton className="h-3 w-[45%]" /> {/* audit-ignore: skeleton widths from components.md */}
    </div>
  );
}

/**
 * The masonry for QuoteCard lists: CSS columns, so short and long quotes pack without gaps. The
 * visual order runs down each column; the DOM (and so the reading and tab order) stays sorted.
 */
export const MASONRY = "columns-1 gap-x-4 tablet:columns-2 desktop:columns-3";
/** Each masonry item: kept whole within a column. */
export const MASONRY_ITEM = "mb-4 min-w-0 break-inside-avoid";

/** The QuoteCard masonry in gray: as many cards as a page usually shows, in the same columns. */
export function QuoteCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={MASONRY}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={MASONRY_ITEM}>
          <QuoteCardSkeleton />
        </div>
      ))}
    </div>
  );
}
