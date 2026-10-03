"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";
import type { EchoSort } from "@/server/validation/echo";

const OPTIONS: Array<{ value: EchoSort; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "recently_updated", label: "Recently updated" },
  { value: "author", label: "Author A–Z" },
];

/** The library's sort control; changing it keeps the filters and goes back to page 1. */
export function SortSelect({ value }: { value: EchoSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      label="Sort"
      inline
      value={value}
      options={OPTIONS}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams);
        params.delete("page");
        // "newest" is the default, so it keeps a clean URL.
        if (event.target.value === "newest") params.delete("sort");
        else params.set("sort", event.target.value);
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    />
  );
}
