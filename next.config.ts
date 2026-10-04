import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { API_CSP, STATIC_SECURITY_HEADERS } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Pages get their nonce-based CSP from src/proxy.ts.
        source: "/:path*",
        headers: [...STATIC_SECURITY_HEADERS],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Content-Security-Policy", value: API_CSP }],
      },
      {
        // Private app and API: never indexed (spec §42).
        source: "/:prefix(app|api)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/app",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Source maps are uploaded only when SENTRY_AUTH_TOKEN is set (production builds on Vercel).
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN, deleteSourcemapsAfterUpload: true },
  telemetry: false,
});
