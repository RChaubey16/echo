import * as Sentry from "@sentry/nextjs";
import { SENTRY_DATA_COLLECTION, scrubEvent } from "@/lib/sentry-scrub";

/**
 * Starts Sentry on the server for production builds with SENTRY_DSN set. `next dev` (local work and
 * the E2E suite) never reports, even when the local .env holds the DSN.
 *
 * @returns Nothing.
 */
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || process.env.NODE_ENV !== "production") return;
  Sentry.init({
    dsn,
    // "production" or "preview" on Vercel; a local production build is labelled "local".
    environment: process.env.VERCEL_ENV ?? "local",
    dataCollection: SENTRY_DATA_COLLECTION,
    // Errors only: traces carry URLs and timings we don't need yet.
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => (crumb.category === "console" ? null : crumb),
  });
}

export const onRequestError = Sentry.captureRequestError;
