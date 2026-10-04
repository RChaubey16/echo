const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// The SDK is loaded only for production builds with a DSN set, and after the page starts, so it
// never adds to the first load or slows hydration. `next dev` never reports.
if (dsn && process.env.NODE_ENV === "production") {
  void Promise.all([import("@sentry/nextjs"), import("@/lib/sentry-scrub")]).then(
    ([Sentry, { SENTRY_DATA_COLLECTION, scrubEvent }]) => {
      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "local",
        dataCollection: SENTRY_DATA_COLLECTION,
        tracesSampleRate: 0,
        // No Session Replay: it would record the quotes on screen.
        integrations: [],
        beforeSend: (event) => scrubEvent(event),
        beforeBreadcrumb: (crumb) => (crumb.category === "console" ? null : crumb),
      });
    },
  );
}
