import "server-only";
import { logger } from "@/lib/logger";
import { runAfterResponse } from "@/server/after-response";

/**
 * Every analytics event and the only props it may carry (spec §43). Props are counts and flags,
 * never content: no quote, reflection, author, name or search text.
 */
export type AnalyticsEvents = {
  signup_completed: Record<string, never>;
  echo_created: {
    hasAuthor: boolean;
    hasReflection: boolean;
    tagCount: number;
    collectionCount: number;
  };
  echo_updated: Record<string, never>;
  echo_deleted: Record<string, never>;
  echo_favorited: Record<string, never>;
  echo_unfavorited: Record<string, never>;
  echo_revisited: { daysSinceSaved: number };
  echo_opened: { daysSinceSaved: number };
  search_performed: { resultCount: number };
  collection_created: Record<string, never>;
  collection_opened: Record<string, never>;
};

export type AnalyticsEvent = keyof AnalyticsEvents;

type PropsArg<E extends AnalyticsEvent> =
  AnalyticsEvents[E] extends Record<string, never> ? [] : [props: AnalyticsEvents[E]];

/** The runtime twin of AnalyticsEvents, so a cast can't smuggle extra fields past the type. */
const ALLOWED_PROPS: { [E in AnalyticsEvent]: ReadonlyArray<keyof AnalyticsEvents[E]> } = {
  signup_completed: [],
  echo_created: ["hasAuthor", "hasReflection", "tagCount", "collectionCount"],
  echo_updated: [],
  echo_deleted: [],
  echo_favorited: [],
  echo_unfavorited: [],
  echo_revisited: ["daysSinceSaved"],
  echo_opened: ["daysSinceSaved"],
  search_performed: ["resultCount"],
  collection_created: [],
  collection_opened: [],
};

const DEFAULT_CAPTURE_HOST = "https://eu.i.posthog.com";
const DEFAULT_API_HOST = "https://eu.posthog.com";

/**
 * Tells whether analytics is switched off for this process, e.g. in test runs that load a .env
 * holding real PostHog keys.
 *
 * @returns True when ANALYTICS_DISABLED is "1" or "true".
 */
function analyticsDisabled(): boolean {
  const flag = process.env.ANALYTICS_DISABLED;
  return flag === "1" || flag === "true";
}

/**
 * Keeps only the allow-listed props of an event, dropping anything else.
 *
 * @param event - The event name.
 * @param props - The props passed by the caller.
 * @returns A new object holding only the allowed props.
 */
export function allowedProps(event: AnalyticsEvent, props: object = {}): Record<string, unknown> {
  const allowed = new Set<string>(ALLOWED_PROPS[event] as readonly string[]);
  return Object.fromEntries(Object.entries(props).filter(([key]) => allowed.has(key)));
}

/**
 * Builds the PostHog capture payload for one event.
 *
 * Person profiles are off: events carry only the opaque user ID, never an email or name.
 *
 * @param apiKey - The PostHog project API key.
 * @param userId - The user's ID, used as the distinct ID.
 * @param event - The event name.
 * @param props - The event's props.
 * @returns The JSON body for the capture endpoint.
 */
export function capturePayload(
  apiKey: string,
  userId: string,
  event: AnalyticsEvent,
  props?: object,
): Record<string, unknown> {
  return {
    api_key: apiKey,
    event,
    distinct_id: userId,
    timestamp: new Date().toISOString(),
    properties: { ...allowedProps(event, props), $process_person_profile: false, $ip: null },
  };
}

/**
 * Records a product analytics event server-side, after the response is sent.
 *
 * A no-op unless POSTHOG_KEY is set, or when ANALYTICS_DISABLED is on. Failures are logged by code only and never reach the user.
 *
 * @param userId - The user the event belongs to.
 * @param event - The event name.
 * @param props - The event's allow-listed props, when it has any.
 * @returns Nothing.
 */
export function track<E extends AnalyticsEvent>(
  userId: string,
  event: E,
  ...[props]: PropsArg<E>
): void {
  const apiKey = process.env.POSTHOG_KEY;
  if (!apiKey || analyticsDisabled()) return;
  const host = process.env.POSTHOG_HOST ?? DEFAULT_CAPTURE_HOST;
  const body = JSON.stringify(capturePayload(apiKey, userId, event, props));
  runAfterResponse(async () => {
    try {
      const response = await fetch(`${host}/i/v0/e/`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(3_000),
      });
      if (!response.ok) logger.warn("analytics capture failed", { status: response.status });
    } catch {
      logger.warn("analytics capture failed", { code: "NETWORK_ERROR" });
    }
  });
}

/**
 * Asks PostHog to delete a user's person and events, for account deletion (spec §62).
 *
 * A no-op unless POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID are set. PostHog queues the event
 * deletion and runs it in a weekly batch.
 *
 * @param userId - The deleted user's ID (their distinct ID).
 * @returns Nothing.
 */
export function forgetAnalyticsUser(userId: string): void {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId || analyticsDisabled()) return;
  const host = process.env.POSTHOG_API_HOST ?? DEFAULT_API_HOST;
  runAfterResponse(async () => {
    try {
      const response = await fetch(
        `${host}/api/projects/${encodeURIComponent(projectId)}/persons/bulk_delete/?delete_events=true`,
        {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ distinct_ids: [userId] }),
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!response.ok) logger.warn("analytics delete failed", { status: response.status });
    } catch {
      logger.warn("analytics delete failed", { code: "NETWORK_ERROR" });
    }
  });
}

/**
 * Whole days between a save date and now, for `daysSinceSaved`.
 *
 * @param savedAt - When the Echo was saved, as a Date or ISO string.
 * @param now - The current time.
 * @returns The number of whole days, never negative.
 */
export function daysSince(savedAt: Date | string, now: Date = new Date()): number {
  const ms = now.getTime() - new Date(savedAt).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
