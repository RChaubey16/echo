import { fullDate, savedLabel } from "@/lib/dates";
import { cn } from "@/lib/cn";

/** "Saved 3 days ago" inside a `<time>` whose title carries the full date. */
export function SavedDate({ savedAt, className }: { savedAt: string; className?: string }) {
  const date = new Date(savedAt);
  return (
    <time
      dateTime={savedAt}
      title={fullDate(date)}
      className={cn("text-body-sm text-muted", className)}
    >
      {savedLabel(date)}
    </time>
  );
}
