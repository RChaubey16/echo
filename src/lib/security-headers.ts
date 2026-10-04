/** Headers sent on every response, pages and API alike (Phase 6 security review). */
export const STATIC_SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** API responses are JSON or downloads and never need to load anything. */
export const API_CSP = "default-src 'none'; frame-ancestors 'none'";

/**
 * Reads the origin of the Sentry ingest host from a DSN, so the browser SDK may report errors.
 *
 * @param dsn - The public Sentry DSN, if any.
 * @returns The ingest origin, e.g. "https://o1.ingest.de.sentry.io", or null.
 */
export function sentryOrigin(dsn: string | undefined): string | null {
  if (!dsn) return null;
  try {
    return new URL(dsn).origin;
  } catch {
    return null;
  }
}

/**
 * Builds the page Content Security Policy around a per-request script nonce.
 *
 * Scripts need the nonce ('strict-dynamic' lets Next.js chunks load their own children). Styles
 * keep 'unsafe-inline' because React style props and next/font emit inline styles; CSS can't run
 * code. Images allow Google profile photos.
 *
 * @param nonce - The base64 nonce for this request.
 * @param options - `dev` adds 'unsafe-eval' for React's dev tooling; `sentryDsn` allows its host.
 * @returns The policy as a single header value.
 */
export function buildPageCsp(
  nonce: string,
  options: { dev?: boolean; sentryDsn?: string } = {},
): string {
  const sentry = sentryOrigin(options.sentryDsn);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${options.dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com",
    "font-src 'self'",
    `connect-src 'self'${sentry ? ` ${sentry}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    // Signing in posts to Auth.js, which redirects the form to Google.
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    ...(options.dev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}
