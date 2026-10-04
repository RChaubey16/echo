import { AsyncLocalStorage } from "node:async_hooks";
import type { RateLimitPolicy } from "@/server/rate-limit";

/** Per-request state that apiHandler sets and requireUser reads. */
export type RequestScope = {
  /** The limit to count once the user is known, or null for an unlimited route. */
  rateLimit: RateLimitPolicy | null;
};

const storage = new AsyncLocalStorage<RequestScope>();

/**
 * Runs a function with the given request scope visible to everything it awaits.
 *
 * @param scope - The scope for this request.
 * @param fn - The work to run inside the scope.
 * @returns Whatever `fn` returns.
 */
export function runInRequestScope<T>(scope: RequestScope, fn: () => T): T {
  return storage.run(scope, fn);
}

/**
 * Reads the current request scope.
 *
 * @returns The scope set by apiHandler, or undefined outside a route handler (e.g. in pages).
 */
export function currentRequestScope(): RequestScope | undefined {
  return storage.getStore();
}
