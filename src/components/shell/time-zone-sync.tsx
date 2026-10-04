"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/lib/api";

/**
 * Saves the browser's time zone when it differs from the stored one, so Today's Echo and the
 * greeting follow the user's own day. Renders nothing.
 */
export function TimeZoneSync({ stored }: { stored: string | null }) {
  const router = useRouter();

  useEffect(() => {
    let zone: string;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!zone || zone === stored) return;
    api
      .updateMe({ timezone: zone })
      // The first capture re-renders the page so "today" is the user's date, not UTC's.
      .then(() => {
        if (stored === null) router.refresh();
      })
      .catch(() => {
        // Not worth bothering the user; UTC is a fine fallback until the next visit.
      });
  }, [stored, router]);

  return null;
}
