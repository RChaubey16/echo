import { describe, expect, it } from "vitest";
import { scrubEvent, stripQuery } from "@/lib/sentry-scrub";

describe("stripQuery", () => {
  it("drops the query string and fragment", () => {
    expect(stripQuery("https://echo.app/app/search?q=grief#top")).toBe(
      "https://echo.app/app/search",
    );
    expect(stripQuery("/app/search?q=grief")).toBe("/app/search");
  });
});

describe("scrubEvent", () => {
  it("removes bodies, cookies, user, query strings and content fields", () => {
    const event = scrubEvent({
      request: {
        url: "https://echo.app/api/search?q=my%20secret",
        data: { quote: "secret quote" },
        cookies: { "authjs.session-token": "tok" },
        query_string: "q=my%20secret",
        headers: { cookie: "a=b", authorization: "Bearer x", "user-agent": "UA" },
      },
      user: { email: "me@example.com" },
      transaction: "/app/search?q=secret",
      extra: { body: { quote: "secret quote", reflection: "secret", tagCount: 2 } },
      contexts: { form: { name: "Me", nested: [{ q: "secret" }] } },
      breadcrumbs: [{ data: { url: "/api/search?q=secret", method: "GET" } }],
    });
    const text = JSON.stringify(event);
    expect(text).not.toContain("secret");
    expect(text).not.toContain("me@example.com");
    expect(text).not.toContain("tok");
    expect(event.request?.url).toBe("https://echo.app/api/search");
    expect(event.request?.headers).toEqual({ "user-agent": "UA" });
    expect(event.extra).toEqual({
      body: { quote: "[redacted]", reflection: "[redacted]", tagCount: 2 },
    });
    expect(event.breadcrumbs?.[0]?.data).toEqual({ url: "/api/search", method: "GET" });
  });
});
