import type { init } from "@sentry/nextjs";

type DataCollection = NonNullable<NonNullable<Parameters<typeof init>[0]>["dataCollection"]>;

/** Keys whose values are user content or secrets, wherever they appear in an event. */
const SENSITIVE_KEYS = new Set([
  "quote",
  "reflection",
  "name",
  "author",
  "source",
  "mood",
  "q",
  "query",
  "email",
  "cookie",
  "cookies",
  "authorization",
  "token",
  "sessiontoken",
  "access_token",
  "refresh_token",
  "id_token",
]);

const REDACTED = "[redacted]";

/** The parts of a Sentry event this scrubber touches; structurally compatible with ErrorEvent. */
export type ScrubbableEvent = {
  request?: {
    url?: string;
    data?: unknown;
    cookies?: unknown;
    headers?: Record<string, string>;
    query_string?: unknown;
  };
  user?: unknown;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  transaction?: string;
  breadcrumbs?: Array<{ message?: string; data?: Record<string, unknown> }>;
};

/**
 * Removes the query string and fragment from a URL, where search text lives (e.g. ?q=...).
 *
 * @param url - An absolute or relative URL.
 * @returns The URL without its query string or fragment.
 */
export function stripQuery(url: string): string {
  return url.replace(/[?#].*$/, "");
}

/**
 * Deep-copies a value, replacing the values of sensitive keys and query strings in URL-like keys.
 *
 * @param value - Any JSON-like value.
 * @param depth - How deep the walk has gone; stops at 8 to bound the work.
 * @returns The scrubbed copy.
 */
export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      const lower = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lower)) out[key] = REDACTED;
      else if (typeof inner === "string" && /url|to|from|href/.test(lower)) {
        out[key] = stripQuery(inner);
      } else out[key] = scrubValue(inner, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Strips request bodies, cookies, user identity, query strings and content fields from a Sentry
 * event before it leaves the process (spec §63). Used as `beforeSend` on client and server.
 *
 * @param event - The event Sentry is about to send.
 * @returns The same event, scrubbed in place.
 */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    if (event.request.headers) {
      const { cookie: _cookie, authorization: _authorization, ...headers } = event.request.headers;
      void _cookie;
      void _authorization;
      event.request.headers = headers;
    }
  }
  delete event.user;
  if (event.transaction) event.transaction = stripQuery(event.transaction);
  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
  if (event.contexts) event.contexts = scrubValue(event.contexts) as Record<string, unknown>;
  if (event.tags) event.tags = scrubValue(event.tags) as Record<string, unknown>;
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      ...(crumb.data ? { data: scrubValue(crumb.data) as Record<string, unknown> } : {}),
    }));
  }
  return event;
}

/**
 * Sentry's own collection switches, all off (the v11 replacement for `sendDefaultPii: false`).
 * Stack-frame variables matter most: a local variable can hold a quote.
 */
export const SENTRY_DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: ["user-agent", "content-type"] }, response: false },
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  genAI: { inputs: false, outputs: false },
  graphQL: { document: false, variables: false },
};
