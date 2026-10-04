import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * One placeholder bar. Shape it like the content it stands in for; `className` sets only its size
 * and spacing.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-skeleton rounded-sm bg-surface-strong motion-reduce:animate-none",
        className,
      )}
    />
  );
}

type LoadingStateProps = {
  /** What is loading, read once by screen readers, e.g. "Loading your library". */
  label: string;
  className?: string;
  children: ReactNode;
};

/**
 * The wrapper for a route's or section's skeleton: marks the region busy and announces the label
 * politely. The skeletons inside stay hidden from assistive tech.
 */
export function LoadingState({ label, className, children }: LoadingStateProps) {
  return (
    <div aria-busy="true" className={className}>
      <p className="sr-only" role="status">
        {label}
      </p>
      {children}
    </div>
  );
}
