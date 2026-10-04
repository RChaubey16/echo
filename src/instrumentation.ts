import * as Sentry from "@sentry/nextjs";
import { SENTRY_DATA_COLLECTION, scrubEvent } from "@/lib/sentry-scrub";

/**
 * Starts Sentry on the server when SENTRY_DSN is set; a no-op otherwise (local dev, CI, tests).
 *
 * @returns Nothing.
 */
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    dataCollection: SENTRY_DATA_COLLECTION,
    // Errors only: traces carry URLs and timings we don't need yet.
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => (crumb.category === "console" ? null : crumb),
  });
}

export const onRequestError = Sentry.captureRequestError;
