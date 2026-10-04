import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  body: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** "h1" when the state replaces the whole page, "h2" inside a section. */
  headingLevel?: "h1" | "h2";
  className?: string;
};

/**
 * The calm empty-state block: an optional icon on a moss disc, a title, one line of body and one
 * action, aligned to the left like the rest of the page.
 */
export function EmptyState({
  title,
  body,
  icon,
  action,
  headingLevel: Heading = "h2",
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-start rounded-lg border border-hairline bg-canvas p-6 tablet:p-8",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-tint-moss text-mark-moss [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
      )}
      <Heading className="text-display-sm text-ink">{title}</Heading>
      <p className="mt-2 text-body-md text-body">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
