import type { NextRequest } from "next/server";
import { handlers } from "@/server/auth";
import { toErrorResponse } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";

/**
 * Reads the caller's IP from the proxy headers Vercel sets.
 *
 * @param request - The incoming request.
 * @returns The client IP, or "unknown" when no proxy header is present.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Wraps an Auth.js handler with the per-IP `auth` rate limit (spec §41).
 *
 * @param handler - The Auth.js GET or POST handler.
 * @returns The rate-limited handler.
 */
function limited(
  handler: (request: NextRequest) => Promise<Response>,
): (request: NextRequest) => Promise<Response> {
  return async (request) => {
    try {
      await enforceRateLimit("auth", clientIp(request));
    } catch (error) {
      return toErrorResponse(error, crypto.randomUUID(), new URL(request.url).pathname);
    }
    return handler(request);
  };
}

export const GET = limited(handlers.GET);
export const POST = limited(handlers.POST);
