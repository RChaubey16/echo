import { NextResponse, type NextRequest } from "next/server";
import { buildPageCsp } from "@/lib/security-headers";

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/**
 * Tells whether a path is inside the signed-in app.
 *
 * @param pathname - The request path.
 * @returns True for /app and everything under it.
 */
function isAppPath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

/**
 * Runs before every page: adds a per-request CSP nonce, and sends signed-out visitors of /app to
 * /login. The redirect only checks that a session cookie exists; the real session check happens in
 * the /app layout and in every route handler.
 *
 * @param request - The incoming request.
 * @returns The redirect, or the response carrying the CSP.
 */
export function proxy(request: NextRequest): NextResponse {
  if (isAppPath(request.nextUrl.pathname)) {
    const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
    if (!hasSession) return NextResponse.redirect(new URL("/login", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildPageCsp(nonce, {
    dev: process.env.NODE_ENV === "development",
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
  // Next.js reads the nonce from the request's CSP header and stamps it on its own scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Every page; not the API, static assets or image optimizer.
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
