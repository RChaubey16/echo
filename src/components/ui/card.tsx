import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  /** Darkens the border on hover, for cards whose content is a link (stretched-link pattern). */
  interactive?: boolean;
  compact?: boolean;
};

export const CARD_CLASSES = "relative rounded-lg border border-hairline bg-canvas";
// Cards never lift or gain a shadow; the border darkens instead.
export const CARD_INTERACTIVE =
  "transition-colors duration-fast ease-standard hover:border-border-input";

/** The base surface for QuoteCard and CollectionCard. `className` is for layout only. */
export function Card({
  as: Tag = "div",
  interactive = false,
  compact = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        CARD_CLASSES,
        compact ? "p-4" : "p-6",
        interactive && CARD_INTERACTIVE,
        className,
      )}
      {...rest}
    />
  );
}
