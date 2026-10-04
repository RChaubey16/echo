import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const CHIP =
  "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border px-3 text-button-sm transition-colors duration-fast ease-standard";
const RESTING = "border-hairline bg-canvas text-ink hover:border-ink";
// Ink fill is Echo's selection language; Lagoon stays reserved for saved state and primary actions.
const SELECTED = "border-ink bg-ink text-on-dark";

/**
 * Returns the tag-chip classes (DESIGN.md category-strip pill), for links, buttons and spans.
 *
 * @param selected - Whether the chip is the active filter or choice.
 * @param className - Layout classes only.
 * @returns The class string.
 */
export function chipClasses(selected = false, className?: string): string {
  return cn(CHIP, selected ? SELECTED : RESTING, className);
}

type ChipLinkProps = {
  href: string;
  selected?: boolean;
  /** Full text for the tooltip when the label truncates. */
  title?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | "true";
  className?: string;
  children: ReactNode;
};

/** A chip that navigates, e.g. a tag that opens the library filtered by it. */
export function ChipLink({ href, selected, className, children, ...rest }: ChipLinkProps) {
  return (
    <Link href={href} className={chipClasses(selected, className)} {...rest}>
      {children}
    </Link>
  );
}

/** A small rounded label for counts and states such as "Favorite". 11px is the floor. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-strong px-2.5 py-1 text-badge text-ink tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}
