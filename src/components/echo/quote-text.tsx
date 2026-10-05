import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type QuoteSize = "today" | "hero" | "memory" | "card" | "compact";

const SIZES: Record<QuoteSize, string> = {
  // Today's Echo is the one place quote type reaches 44px.
  today: "font-quote text-quote-hero-sm tablet:text-quote-hero desktop:text-quote-today",
  hero: "font-quote text-quote-hero-sm tablet:text-quote-hero",
  // From the past: a step above a card, the same at every width.
  memory: "font-quote text-quote-hero-sm",
  card: "font-quote text-quote-card-sm tablet:text-quote-card",
  compact: "font-quote text-quote-compact",
};

/**
 * Returns the quote typography for a size. QuoteText is the only place quote type is defined; the
 * quote textarea uses this so typed text looks like a saved Echo.
 *
 * @param size - The quote size.
 * @returns The class string.
 */
export function quoteClasses(size: QuoteSize): string {
  return cn(SIZES[size], "user-text text-pretty text-ink");
}

type QuoteTextProps = {
  size: QuoteSize;
  /** The quote, rendered as plain text with its line breaks. Never HTML. */
  children: ReactNode;
  /** Layout and clamping only (e.g. `line-clamp-6`, `pr-8`). */
  className?: string;
};

/** A quote in EB Garamond. Wrap it in a `<figure>` with the attribution in a `<figcaption>`. */
export function QuoteText({ size, children, className }: QuoteTextProps) {
  return <blockquote className={cn(quoteClasses(size), className)}>{children}</blockquote>;
}

/**
 * The attribution as shown under a quote: the author in weight 600, then " · " and the source.
 * Renders nothing when both are missing.
 */
export function Attribution({
  echo,
  className,
}: {
  echo: { author: string | null; source: string | null };
  className?: string;
}) {
  if (!echo.author && !echo.source) return null;
  return (
    <span className={cn("[overflow-wrap:anywhere] text-body", className)}>
      {echo.author && <span className="font-semibold text-ink">{echo.author}</span>}
      {echo.author && echo.source && " · "}
      {echo.source}
    </span>
  );
}

/**
 * Joins author and source into the attribution line, or null when both are missing.
 *
 * @param echo - The Echo's author and source.
 * @returns Text such as "Author, Source", or null.
 */
export function attribution(echo: { author: string | null; source: string | null }): string | null {
  const parts = [echo.author, echo.source].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
