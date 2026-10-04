"use client";

import { useEffect } from "react";
import { applyTheme, readThemeCookie, type Theme } from "@/lib/theme";

/**
 * Brings this browser's theme cookie in line with the theme saved on the account, e.g. after
 * signing in on a new device or changing it on another one. Renders nothing.
 */
export function ThemeSync({ stored }: { stored: Theme | null }) {
  useEffect(() => {
    if (readThemeCookie() !== (stored ?? undefined)) applyTheme(stored ?? undefined);
  }, [stored]);
  return null;
}
