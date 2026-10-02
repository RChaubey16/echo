import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export const ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "ECHO_NOT_FOUND",
  "COLLECTION_NOT_FOUND",
  "TAG_NOT_FOUND",
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
  RATE_LIMITED: { status: 429, message: "Too many requests. Try again shortly." },
  INTERNAL_ERROR: { status: 500, message: "Something went wrong." },
};

/** An expected, user-facing API error with a spec §39 code. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  /**
   * Creates an API error.
   *
   * @param code - The error code from spec §39.
   * @param message - A friendly message; defaults to the code's standard message.
   * @param status - The HTTP status; defaults to the code's standard status.
   * @returns A new AppError.
   */
  constructor(code: ErrorCode, message?: string, status?: number) {
    super(message ?? DEFAULTS[code].message);
    this.name = "AppError";
    this.code = code;
    this.status = status ?? DEFAULTS[code].status;
  }
}

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
      { error: { code: error.code, message: error.message } },
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
  return errorResponse(
    500,
    { error: { code: "INTERNAL_ERROR", message: DEFAULTS.INTERNAL_ERROR.message, errorId } },
    requestId,
  );
}

/**
 * Wraps a route handler with a request ID, timing logs and spec §39 error mapping.
 *
 * @param fn - The route handler to wrap.
 * @returns A route handler that never throws.
 */
export function apiHandler<Ctx = unknown>(
  fn: (request: Request, context: Ctx & { requestId: string }) => Promise<Response> | Response,
): (request: Request, context: Ctx) => Promise<Response> {
  return async (request, context) => {
    const requestId = crypto.randomUUID();
    const started = performance.now();
    const route = new URL(request.url).pathname;
    let response: Response;
    try {
      response = await fn(request, { ...(context as Ctx), requestId });
      try {
        response.headers.set("x-request-id", requestId);
      } catch {
        // Some responses (e.g. Response.redirect) have immutable headers.
      }
    } catch (error) {
      response = toErrorResponse(error, requestId, route);
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
