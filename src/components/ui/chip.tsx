import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// A 36px chip (or a 28px one inside cards), both with a 44px hit area.
const CHIP =
  "relative inline-flex max-w-full items-center gap-1.5 rounded-sm transition-colors duration-fast ease-standard before:absolute before:inset-x-0 before:content-['']";
const SIZES = {
  md: "h-9 px-3 text-caption before:-inset-y-1",
  sm: "h-7 px-2 text-badge before:-inset-y-2",
} as const;
type ChipSize = keyof typeof SIZES;
const RESTING = "bg-surface-strong text-body hover:bg-hairline hover:text-ink";
// Ink fill is Echo's selection language; the primary accent stays reserved for saved state and primary actions.
const SELECTED = "bg-ink text-canvas";

/**
 * Returns the tag-chip classes, for links, buttons and spans.
 *
 * @param selected - Whether the chip is the active filter or choice.
 * @param className - Layout classes only.
 * @param size - "md" (36px, filters and inputs) or "sm" (28px, tags inside cards).
 * @returns The class string.
 */
export function chipClasses(selected = false, className?: string, size: ChipSize = "md"): string {
  return cn(CHIP, SIZES[size], selected ? SELECTED : RESTING, className);
}

type ChipLinkProps = {
  href: string;
  selected?: boolean;
  size?: ChipSize;
  /** Full text for the tooltip when the label truncates. */
  title?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | "true";
  className?: string;
  children: ReactNode;
};

/** A chip that navigates, e.g. a tag that opens the library filtered by it. */
export function ChipLink({ href, selected, size, className, children, ...rest }: ChipLinkProps) {
  return (
    <Link href={href} className={chipClasses(selected, className, size)} {...rest}>
      {children}
    </Link>
  );
}

/** A small label for counts and states such as "Favorite". 12px is the floor. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-surface-strong px-2 py-0.5 text-badge text-body tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}
