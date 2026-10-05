import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import type { RateLimitPolicy } from "@/server/rate-limit";
import { runInRequestScope } from "@/server/request-scope";

export const ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "ECHO_NOT_FOUND",
  "COLLECTION_NOT_FOUND",
  "TAG_NOT_FOUND",
  "REVISIT_NOT_FOUND",
  "UNSUPPORTED_MEDIA_TYPE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const DEFAULTS: Record<ErrorCode, { status: number; message: string }> = {
  UNAUTHORIZED: { status: 401, message: "You need to sign in." },
  FORBIDDEN: { status: 403, message: "You don't have access to this." },
  VALIDATION_ERROR: { status: 400, message: "Some fields are invalid." },
  NOT_FOUND: { status: 404, message: "Not found." },
  ECHO_NOT_FOUND: { status: 404, message: "Echo not found." },
  COLLECTION_NOT_FOUND: { status: 404, message: "Collection not found." },
  TAG_NOT_FOUND: { status: 404, message: "Tag not found." },
  REVISIT_NOT_FOUND: { status: 404, message: "Revisit not found." },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Send the request body as JSON." },
  RATE_LIMITED: { status: 429, message: "Too many requests. Try again shortly." },
  INTERNAL_ERROR: { status: 500, message: "Something went wrong." },
};

/** An expected, user-facing API error with a spec §39 code. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string[]>;

  /**
   * Creates an API error.
   *
   * @param code - The error code from spec §39.
   * @param message - A friendly message; defaults to the code's standard message.
   * @param status - The HTTP status; defaults to the code's standard status.
   * @param fields - Per-field messages for a form to show inline.
   * @returns A new AppError.
   */
  constructor(
    code: ErrorCode,
    message?: string,
    status?: number,
    fields?: Record<string, string[]>,
  ) {
    super(message ?? DEFAULTS[code].message);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? DEFAULTS[code].status;
    this.fields = fields;
  }
}

/** Every API response is private to its user and never stored by a cache. */
const NO_STORE = "private, no-store";

export type ErrorBody = {
  error: { code: ErrorCode; message: string; fields?: Record<string, string[]>; errorId?: string };
};

/**
 * Builds a JSON error response in the spec §39 shape.
 *
 * @param status - The HTTP status.
 * @param body - The error body.
 * @param requestId - The request ID to echo back in a header.
 * @returns The JSON response.
 */
function errorResponse(status: number, body: ErrorBody, requestId: string): Response {
  return Response.json(body, { status, headers: { "x-request-id": requestId } });
}

/**
 * Converts any thrown value into a spec §39 error response, logging only safe metadata.
 *
 * @param error - The thrown value.
 * @param requestId - The current request ID.
 * @param route - The request path, for logging.
 * @returns The JSON error response.
 */
export function toErrorResponse(error: unknown, requestId: string, route?: string): Response {
  if (error instanceof AppError) {
    return errorResponse(
      error.status,
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      },
      requestId,
    );
  }
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }
    return errorResponse(
      400,
      { error: { code: "VALIDATION_ERROR", message: DEFAULTS.VALIDATION_ERROR.message, fields } },
      requestId,
    );
  }
  const errorId = crypto.randomUUID();
  logger.error("unhandled error", { requestId, errorId, route, code: "INTERNAL_ERROR" });
  // A no-op unless Sentry is configured; the event is scrubbed by beforeSend.
  Sentry.captureException(error, { tags: { errorId, requestId, ...(route ? { route } : {}) } });
  return errorResponse(
    500,
    { error: { code: "INTERNAL_ERROR", message: DEFAULTS.INTERNAL_ERROR.message, errorId } },
    requestId,
  );
}

/**
 * Reads a request body as JSON, treating a malformed body as a validation error.
 *
 * Only `application/json` is accepted: an HTML form can't send it cross-site without a CORS
 * preflight, which closes the classic form-post CSRF hole.
 *
 * @param request - The incoming request.
 * @returns The parsed JSON value.
 * @throws AppError UNSUPPORTED_MEDIA_TYPE when the content type isn't JSON.
 * @throws AppError VALIDATION_ERROR when the body is not valid JSON.
 */
export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new AppError("UNSUPPORTED_MEDIA_TYPE");
  }
  try {
    return await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "The request body must be valid JSON.");
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Rejects a state-changing request that a browser sent from another site.
 *
 * Browsers mark every request with `Sec-Fetch-Site` and send `Origin` on non-GET requests, so a
 * cross-site form or fetch is caught by either. Clients that send neither (curl, a future mobile
 * app) carry no ambient cookies to abuse and are let through.
 *
 * @param request - The incoming request.
 * @returns Nothing.
 * @throws AppError FORBIDDEN when the request came from another origin.
 */
export function assertSameOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method)) return;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new AppError("FORBIDDEN");
  }
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("FORBIDDEN");
  }
  if (originHost !== host) throw new AppError("FORBIDDEN");
}

type ApiHandlerOptions = {
  /**
   * The rate limit counted against the signed-in user once requireUser() resolves them. Defaults
   * to `mutation` for POST, PATCH, PUT and DELETE, and to no limit for reads.
   */
  rateLimit?: RateLimitPolicy | null;
};

/**
 * Wraps a route handler with a request ID, timing logs, CSRF and rate-limit checks and spec §39
 * error mapping.
 *
 * @param fn - The route handler to wrap.
 * @param options - Per-route settings such as the rate-limit policy.
 * @returns A route handler that never throws.
 */
export function apiHandler<Ctx = unknown>(
  fn: (request: Request, context: Ctx & { requestId: string }) => Promise<Response> | Response,
  options: ApiHandlerOptions = {},
): (request: Request, context: Ctx) => Promise<Response> {
  return async (request, context) => {
    const requestId = crypto.randomUUID();
    const started = performance.now();
    const route = new URL(request.url).pathname;
    const rateLimit =
      options.rateLimit !== undefined
        ? options.rateLimit
        : SAFE_METHODS.has(request.method)
          ? null
          : "mutation";
    let response: Response;
    try {
      assertSameOrigin(request);
      response = await runInRequestScope({ rateLimit }, () =>
        fn(request, { ...(context as Ctx), requestId }),
      );
    } catch (error) {
      response = toErrorResponse(error, requestId, route);
    }
    try {
      response.headers.set("x-request-id", requestId);
      // User content must never sit in a CDN or shared cache (spec §44).
      response.headers.set("cache-control", NO_STORE);
    } catch {
      // Some responses (e.g. Response.redirect) have immutable headers.
    }
    logger.info("request", {
      requestId,
      route,
      method: request.method,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
    });
    return response;
  };
}
