import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { CollectionAccent } from "@/server/validation/collection";
import type { CollectionDto } from "@/types/echo";
import { AccentDot } from "./accent-dot";

/**
 * Formats an Echo count for display.
 *
 * @param count - The number of Echoes.
 * @returns Text such as "1 Echo" or "24 Echoes".
 */
export function echoCount(count: number): string {
  return count === 1 ? "1 Echo" : `${count.toLocaleString("en-US")} Echoes`;
}

/** The 4px bar along a collection card's top edge; the neutral slot uses a hairline. */
const TOP_BAR: Record<CollectionAccent, string> = {
  lagoon: "border-t-mark-moss",
  bronze: "border-t-mark-ochre",
  plum: "border-t-mark-heather",
  neutral: "border-t-hairline",
};

/**
 * A collection as a card: a 4px accent bar along the top, the name beside its dot (so colour is
 * never the only signal), the description and the Echo count.
 */
export function CollectionCard({ collection }: { collection: CollectionDto }) {
  return (
    <Card
      as="article"
      interactive
      className={cn("flex min-h-45 min-w-0 flex-col gap-3 border-t-4", TOP_BAR[collection.accent])}
    >
      <h2 className="flex min-w-0 items-center gap-2.5 text-title-md text-ink">
        <AccentDot accent={collection.accent} size="md" />
        <Link
          href={`/app/collections/${collection.id}`}
          className="truncate rounded-sm after:absolute after:inset-0 after:rounded-lg"
          title={collection.name}
        >
          {collection.name}
        </Link>
      </h2>
      {collection.description && (
        <p className="line-clamp-3 text-body-md text-pretty [overflow-wrap:anywhere] text-body">
          {collection.description}
        </p>
      )}
      <p className="mt-auto text-body-sm text-muted tabular-nums">
        {echoCount(collection.echoCount)}
      </p>
    </Card>
  );
}

/** The CollectionCard skeleton: a name bar, a count bar and two description bars. */
export function CollectionCardSkeleton() {
  return (
    <div
      aria-hidden
      className="min-h-45 rounded-lg border border-t-4 border-hairline bg-canvas p-6"
    >
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-2 h-4 w-1/4" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}
