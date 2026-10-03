"use client";

import { usePathname, useRouter } from "next/navigation";
import { useId } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import type { EchoSort } from "@/server/validation/echo";

const OPTIONS: Array<{ value: EchoSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "recently_updated", label: "Recently updated" },
  { value: "author", label: "Author A–Z" },
];

/** The library's sort control; changing it goes back to page 1. */
export function SortSelect({ value }: { value: EchoSort }) {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-caption text-muted">
        Sort
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => {
            // Sorting starts again from page 1; "newest" is the default, so it keeps a clean URL.
            const sort = event.target.value;
            router.push(sort === "newest" ? pathname : `${pathname}?sort=${sort}`);
          }}
          className="h-10 appearance-none rounded-sm border border-border-input bg-canvas pr-8 pl-3 text-body-md text-ink focus:border-ink focus:outline-1 focus:-outline-offset-2 focus:outline-ink"
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
