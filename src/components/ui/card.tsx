import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  /** Adds the hover float for cards whose content is a link (stretched-link pattern). */
  interactive?: boolean;
  compact?: boolean;
};

export const CARD_CLASSES = "relative rounded-lg border border-hairline bg-canvas";
export const CARD_INTERACTIVE =
  "transition-shadow duration-base ease-standard hover:border-transparent hover:shadow-float";

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
