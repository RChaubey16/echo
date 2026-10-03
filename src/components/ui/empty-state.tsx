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

/** The calm empty-state block: an optional icon, a title, one line of body and one action. */
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
        "mx-auto w-full max-w-sm rounded-md border border-hairline-soft bg-canvas px-6 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="mx-auto flex justify-center text-muted">{icon}</div>}
      <Heading className={cn("text-title-md text-ink", Boolean(icon) && "mt-6")}>{title}</Heading>
      <p className="mt-2 text-body-md text-body">{body}</p>
      {action && <div className="mt-8">{action}</div>}
    </section>
  );
}
