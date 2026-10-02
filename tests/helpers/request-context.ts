export const requestHeaders = { current: new Headers() };

/**
 * Builds a request to the app and makes its headers visible to next/headers in integration tests.
 *
 * @param path - The request path, e.g. "/api/me".
 * @param init - Optional fetch options; a `cookie` string is sent as the Cookie header.
 * @returns The request to pass to a route handler.
 */
export function makeRequest(path: string, init: RequestInit & { cookie?: string } = {}): Request {
  const { cookie, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("host", "localhost:3000");
  headers.set("x-forwarded-proto", "http");
  if (cookie) headers.set("cookie", cookie);
  requestHeaders.current = headers;
  return new Request(new URL(path, "http://localhost:3000"), { ...rest, headers });
}
