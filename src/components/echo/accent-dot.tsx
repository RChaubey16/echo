import { cn } from "@/lib/cn";
import type { CollectionAccent } from "@/server/validation/collection";

const DOT: Record<CollectionAccent, string> = {
  lagoon: "bg-mark-moss",
  bronze: "bg-mark-ochre",
  plum: "bg-mark-heather",
  // The neutral slot is a ring, so it never reads as a fourth color.
  neutral: "border-2 border-mark-neutral",
};

/**
 * A collection's 8px accent dot. Decorative: the collection's name always sits next to it, so
 * color is never the only signal.
 */
export function AccentDot({ accent, className }: { accent: CollectionAccent; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", DOT[accent], className)}
    />
  );
}
