const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// The SDK is loaded only when a DSN is set, and after the page starts, so it never adds to the
// first load or slows hydration.
if (dsn) {
  void Promise.all([import("@sentry/nextjs"), import("@/lib/sentry-scrub")]).then(
    ([Sentry, { SENTRY_DATA_COLLECTION, scrubEvent }]) => {
      Sentry.init({
        dsn,
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
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
