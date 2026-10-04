import { cn } from "@/lib/cn";
import type { CollectionAccent } from "@/server/validation/collection";

/** The names the four stored accent slots go by in the interface. */
export const ACCENT_LABEL: Record<CollectionAccent, string> = {
  lagoon: "Moss",
  bronze: "Ochre",
  plum: "Heather",
  neutral: "Neutral",
};

/** Each slot's pale panel colour, e.g. behind a collection page's header. */
export const ACCENT_TINT: Record<CollectionAccent, string> = {
  lagoon: "bg-tint-moss",
  bronze: "bg-tint-ochre",
  plum: "bg-tint-heather",
  neutral: "bg-tint-neutral",
};

const DOT: Record<CollectionAccent, string> = {
  lagoon: "bg-mark-moss",
  bronze: "bg-mark-ochre",
  plum: "bg-mark-heather",
  // The neutral slot is a ring, so it never reads as a fourth color.
  neutral: "border-2 border-mark-neutral",
};

/**
 * A collection's accent dot (8px, or 10px beside a card title). Decorative: the collection's name
 * always sits next to it, so color is never the only signal.
 */
export function AccentDot({
  accent,
  size = "sm",
  className,
}: {
  accent: CollectionAccent;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full",
        size === "md" ? "h-2.5 w-2.5" : "h-2 w-2",
        DOT[accent],
        className,
      )}
    />
  );
}
