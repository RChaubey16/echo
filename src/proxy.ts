import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * Fast redirect for signed-out visitors: only checks that a session cookie exists.
 * The real session check happens in the /app layout and in every route handler.
 *
 * @param request - The incoming request.
 * @returns A redirect to /login, or undefined to continue.
 */
export function proxy(request: NextRequest): NextResponse | undefined {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return undefined;
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/app", "/app/:path*"],
};
