import type { MetadataRoute } from "next";

/**
 * Keeps the private app and the API out of search engines (spec §42).
 *
 * @returns The robots.txt rules.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/privacy", "/terms"],
      disallow: ["/app", "/api"],
    },
  };
}
