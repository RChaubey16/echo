import { cn } from "@/lib/cn";
import type { CollectionAccent } from "@/server/validation/collection";

const DOT: Record<CollectionAccent, string> = {
  lagoon: "bg-primary",
  bronze: "bg-luxe",
  plum: "bg-plus",
  neutral: "bg-muted-soft",
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
