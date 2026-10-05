import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";
import { AppError } from "@/server/http";

/** The spec §41 limits, plus export (Phase 6). Keys are per user, except `auth` (per IP). */
const RATE_LIMITS = {
  mutation: { tokens: 60, window: "1 m" },
  search: { tokens: 30, window: "1 m" },
  auth: { tokens: 20, window: "1 m" },
  export: { tokens: 5, window: "1 h" },
} as const satisfies Record<string, { tokens: number; window: `${number} ${"m" | "h"}` }>;

export type RateLimitPolicy = keyof typeof RATE_LIMITS;

let limiters: Map<RateLimitPolicy, Ratelimit> | null | undefined;

/**
 * Builds one Upstash limiter per policy, or returns null when Upstash isn't configured.
 *
 * Local development, CI and tests run without Upstash, so limits are off there. Production must set
 * both variables; a missing one is logged once so it can't go unnoticed.
 *
 * @returns The limiters keyed by policy, or null when rate limiting is off.
 */
function getLimiters(): Map<RateLimitPolicy, Ratelimit> | null {
  if (limiters !== undefined) return limiters;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("rate limiting disabled", { code: "UPSTASH_NOT_CONFIGURED" });
    }
    limiters = null;
    return limiters;
  }
  const redis = new Redis({ url, token });
  limiters = new Map(
    (Object.keys(RATE_LIMITS) as RateLimitPolicy[]).map((policy) => {
      const { tokens, window } = RATE_LIMITS[policy];
      return [
        policy,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(tokens, window),
          prefix: `echo:rl:${policy}`,
          // Never let a Redis outage take the app down; requests pass if Redis doesn't answer.
          timeout: 1_000,
        }),
      ];
    }),
  );
  return limiters;
}

/**
 * Counts one request against a policy and throws RATE_LIMITED once the limit is used up.
 *
 * @param policy - Which limit applies.
 * @param key - Who the request counts against: a user ID, or an IP for `auth`.
 * @returns Nothing.
 * @throws AppError RATE_LIMITED (429) when the limit is exceeded.
 */
export async function enforceRateLimit(policy: RateLimitPolicy, key: string): Promise<void> {
  const limiter = getLimiters()?.get(policy);
  if (!limiter) return;
  const { success } = await limiter.limit(key);
  if (!success) throw new AppError("RATE_LIMITED");
}

/**
 * Forgets the cached limiters so the next call re-reads the environment; for tests only.
 *
 * @returns Nothing.
 */
export function resetRateLimitersForTests(): void {
  limiters = undefined;
}
