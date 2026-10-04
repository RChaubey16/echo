"use client";

import { useEffect } from "react";

/**
 * Reports an error caught by an error boundary to Sentry, once per error.
 *
 * Errors with a digest came from the server and were already reported there by onRequestError,
 * so only browser-side errors are sent from here. The SDK is imported on demand, so pages don't
 * load it until something actually breaks.
 *
 * @param error - The error the boundary caught.
 * @returns Nothing.
 */
export function useReportError(error: Error & { digest?: string }): void {
  useEffect(() => {
    if (error.digest || !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
    void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
  }, [error]);
}
