"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { PAGE_SEARCH_ID } from "@/components/shell/search-ids";
import { SearchIcon } from "@/components/ui/icons";
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
      onSubmit={(event) => {
        event.preventDefault();
        window.clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <label id={labelId} htmlFor={PAGE_SEARCH_ID} className="sr-only">
        Search your Echoes
      </label>
      <div className="flex h-12 items-center gap-2 rounded-full border border-hairline bg-canvas pr-1.5 pl-6 shadow-float focus-within:border-ink focus-within:outline-1 focus-within:-outline-offset-2 focus-within:outline-ink desktop:h-16 desktop:pr-2">
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
          className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden" // audit-ignore: the pill draws the focus outline (focus-within)
        />
        <button
          type="submit"
          aria-label="Search"
          aria-busy={pending || undefined}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-active active:scale-95 motion-reduce:active:scale-100 desktop:h-12 desktop:w-12"
        >
          {pending ? <Spinner className="h-4 w-4" /> : <SearchIcon className="h-5 w-5" />}
        </button>
      </div>
    </form>
  );
}
