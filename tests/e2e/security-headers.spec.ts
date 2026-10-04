import { test as base } from "@playwright/test";
import { expect, test } from "./fixtures";
import { openHydrated } from "./helpers";

/**
 * Asserts the headers every page must carry (Phase 6 security review).
 *
 * @param headers - The response headers.
 * @returns The CSP header, for further checks.
 */
function expectPageHeaders(headers: Record<string, string>): string {
  const csp = headers["content-security-policy"] ?? "";
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("default-src 'self'");
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-frame-options"]).toBe("DENY");
  return csp;
}

base("/ and /login send the security headers with a fresh nonce each time", async ({ request }) => {
  const first = expectPageHeaders((await request.get("/")).headers());
  const second = expectPageHeaders((await request.get("/")).headers());
  expect(first).not.toBe(second);
  expectPageHeaders((await request.get("/login")).headers());
});

test("/app sends the security headers and hydrates under the CSP", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  const response = await page.goto("/app");
  expectPageHeaders(response!.headers());
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await openHydrated(page, "/app/settings");
  expect(violations).toEqual([]);
});

test("the API refuses cross-site writes and non-JSON bodies", async ({ context }) => {
  const request = context.request;
  const api = await request.get("/api/me");
  expect(api.headers()["content-security-policy"]).toContain("default-src 'none'");

  const crossSite = await request.post("/api/echoes", {
    data: { quote: "From another site" },
    headers: { origin: "https://evil.example" },
  });
  expect(crossSite.status()).toBe(403);

  const form = await request.post("/api/echoes", {
    form: { quote: "A form post" },
  });
  expect(form.status()).toBe(415);
});
