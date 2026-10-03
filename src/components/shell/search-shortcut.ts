"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isTypingTarget } from "@/components/echo/quick-capture";
import { PAGE_SEARCH_ID, SIDEBAR_SEARCH_ID } from "./search-ids";

/**
 * Finds the search field to focus for `/`: the search page's own field, else the sidebar's when it
 * is on screen (the expanded desktop sidebar).
 *
 * @returns The input, or null when no search field is visible.
 */
function visibleSearchField(): HTMLInputElement | null {
  for (const id of [PAGE_SEARCH_ID, SIDEBAR_SEARCH_ID]) {
    const input = document.getElementById(id);
    if (input instanceof HTMLInputElement && input.getClientRects().length > 0) return input;
  }
  return null;
}

/**
 * Binds `/` to search: it focuses a visible search field, or opens the search page. Ignored while
 * typing or while a dialog is open.
 *
 * @returns Nothing.
 */
export function useSearchShortcut(): void {
  const router = useRouter();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      const field = visibleSearchField();
      if (field) {
        field.focus();
        field.select();
      } else {
        router.push("/app/search");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);
}
