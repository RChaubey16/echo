// Lighthouse CI performance budgets (Phase 5 §7): LCP < 2.5 s on /login and /app.
// Two passes: signed out measures /login; with LHCI_COOKIE (a throwaway session made by
// scripts/lhci-session.ts in the local test DB) it measures /app. /login would redirect a session.
const port = 3200;
const cookie = process.env.LHCI_COOKIE;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm exec next start --port ${port}`,
      startServerReadyPattern: "Ready",
      url: [`http://localhost:${port}${cookie ? "/app" : "/login"}`],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        ...(cookie ? { extraHeaders: JSON.stringify({ Cookie: cookie }) } : {}),
      },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": [
          "error",
          { maxNumericValue: 2500, aggregationMethod: "median" },
        ],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1, aggregationMethod: "median" }],
        "total-blocking-time": ["warn", { maxNumericValue: 200, aggregationMethod: "median" }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
      },
    },
    upload: { target: "filesystem", outputDir: `.lighthouseci/${cookie ? "app" : "login"}` },
  },
};
