"use client";

import { useEffect } from "react";
import { applyTheme, readThemeCookie, type Theme } from "@/lib/theme";

/**
 * Brings this browser's theme cookie and the page in line with the theme saved on the account,
 * e.g. after signing in on a new device or changing it on another one. Renders nothing.
 *
 * The page is checked as well as the cookie: another tab can write the cookie after this page's
 * HTML was rendered without it, leaving the cookie right but the page wrong.
 */
export function ThemeSync({ stored }: { stored: Theme | null }) {
  useEffect(() => {
    const theme = stored ?? undefined;
    if (readThemeCookie() !== theme || document.documentElement.dataset.theme !== theme) {
      applyTheme(theme);
    }
  }, [stored]);
  return null;
}
