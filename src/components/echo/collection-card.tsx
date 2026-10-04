import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

/** A collection as a card: name with its accent dot, Echo count and description. */
export function CollectionCard({ collection }: { collection: CollectionDto }) {
  return (
    <Card as="article" interactive className="flex min-w-0 flex-col">
      <h2 className="flex min-w-0 items-center gap-2 text-title-md text-ink">
        <AccentDot accent={collection.accent} />
        <Link
          href={`/app/collections/${collection.id}`}
          className="truncate rounded-sm after:absolute after:inset-0 after:rounded-lg"
          title={collection.name}
        >
          {collection.name}
        </Link>
      </h2>
      <p className="mt-1 text-body-sm text-muted tabular-nums">{echoCount(collection.echoCount)}</p>
      {collection.description && (
        <p className="mt-3 line-clamp-2 text-body-sm [overflow-wrap:anywhere] text-body">
          {collection.description}
        </p>
      )}
    </Card>
  );
}

/** The CollectionCard skeleton: a name bar, a count bar and two description bars. */
export function CollectionCardSkeleton() {
  return (
    <div aria-hidden className="rounded-lg border border-hairline bg-canvas p-6">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="mt-2 h-4 w-1/4" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}
