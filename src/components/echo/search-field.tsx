"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { PAGE_SEARCH_ID } from "@/components/shell/search-ids";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";
import { SEARCH_MAX } from "@/server/validation/echo";

const DEBOUNCE_MS = 250;

/**
 * The search page's field (DESIGN.md search-bar-pill, one segment). The URL is the source of
 * truth: typing updates `?q=` 250ms after the last keystroke, and Esc clears it.
 */
export function SearchField({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const urlQuery = searchParams.get("q") ?? "";

  // Follow the URL when it changes from outside (back/forward, the sidebar's search).
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setValue(urlQuery);
  }

  /**
   * Replaces the URL's query, which re-renders the results on the server.
   *
   * @param next - The query text.
   * @returns Nothing.
   */
  const navigate = (next: string) => {
    const trimmed = next.trim();
    if (trimmed === urlQuery.trim()) return;
    startTransition(() => {
      router.replace(trimmed ? `${pathname}?q=${encodeURIComponent(trimmed)}` : pathname, {
        scroll: false,
      });
    });
  };

  // Typing schedules the URL update; each keystroke restarts the 250ms wait.
  const timer = useRef<number | undefined>(undefined);
  const schedule = (next: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => navigate(next), DEBOUNCE_MS);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <form
      role="search"
      aria-labelledby={labelId}
      className="flex max-w-190 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        window.clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <label id={labelId} htmlFor={PAGE_SEARCH_ID} className="text-caption text-body">
        Search your library
      </label>
      <div className="flex h-13 items-center gap-3 rounded-md border border-border-input bg-canvas pr-1.5 pl-4 transition-colors duration-fast ease-standard focus-within:border-ink focus-within:ring-1 focus-within:ring-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary focus-within:ring-inset hover:border-ink tablet:h-15 tablet:pl-4.5">
        <span aria-hidden className="flex shrink-0 text-muted">
          {pending ? <Spinner className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
        </span>
        <input
          ref={inputRef}
          id={PAGE_SEARCH_ID}
          name="q"
          type="search"
          autoFocus
          autoComplete="off"
          enterKeyHint="search"
          aria-keyshortcuts="/"
          maxLength={SEARCH_MAX}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            schedule(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              window.clearTimeout(timer.current);
              setValue("");
              navigate("");
              inputRef.current?.blur();
            }
          }}
          placeholder="Words, authors, reflections, tags…"
          className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted focus-visible:outline-none tablet:text-display-sm tablet:font-normal [&::-webkit-search-cancel-button]:hidden" // audit-ignore: the pill draws the focus outline (focus-within)
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              window.clearTimeout(timer.current);
              setValue("");
              navigate("");
              inputRef.current?.focus();
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-strong hover:text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
        <span aria-live="polite" className="sr-only">
          {pending ? "Searching…" : ""}
        </span>
      </div>
    </form>
  );
}
