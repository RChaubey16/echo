import type { ReactNode } from "react";

/**
 * Splits a search query into the words worth highlighting: two characters or longer, unique,
 * longest first so overlapping words prefer the longer match.
 *
 * @param query - The raw search query.
 * @returns The lowercase terms.
 */
export function highlightTerms(query: string): string[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((word) => word.length >= 2);
  return [...new Set(words)].sort((a, b) => b.length - a.length);
}

/**
 * Wraps each occurrence of the query's words in a `<mark>`, keeping the text as plain text (never
 * HTML). Matching ignores case.
 *
 * @param text - The user's text.
 * @param query - The search query; an empty query returns the text unchanged.
 * @returns The text, with matches wrapped.
 */
export function highlight(text: string, query: string | undefined): ReactNode {
  const terms = query ? highlightTerms(query) : [];
  if (terms.length === 0) return text;
  const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "giu"));
  return parts.map((part, index) =>
    // split() with one capture group puts the matches at the odd indexes.
    index % 2 === 1 ? (
      <mark
        key={index}
        className="rounded-xs bg-tint-ochre text-ink underline decoration-mark-ochre decoration-2 underline-offset-2"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
