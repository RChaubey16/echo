"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Reports an error caught by an error boundary to Sentry, once per error.
 *
 * Errors with a digest came from the server and were already reported there by onRequestError,
 * so only browser-side errors are sent from here.
 *
 * @param error - The error the boundary caught.
 * @returns Nothing.
 */
export function useReportError(error: Error & { digest?: string }): void {
  useEffect(() => {
    if (!error.digest) Sentry.captureException(error);
  }, [error]);
}
