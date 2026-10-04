import { describe, expect, it } from "vitest";
import { publicPageMetadata, siteUrl } from "@/lib/site";

describe("siteUrl", () => {
  it("prefers AUTH_URL", () => {
    expect(
      siteUrl({
        AUTH_URL: "https://echo.example",
        VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app",
      }).href,
    ).toBe("https://echo.example/");
  });

  it("falls back to the Vercel production domain over https", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "echo.vercel.app" }).href).toBe(
      "https://echo.vercel.app/",
    );
  });

  it("falls back to localhost", () => {
    expect(siteUrl({}).href).toBe("http://localhost:3000/");
  });
});

describe("publicPageMetadata", () => {
  it("sets the canonical link and matching Open Graph tags", () => {
    const metadata = publicPageMetadata({ title: "Terms", description: "Rules.", path: "/terms" });
    expect(metadata.title).toBe("Terms");
    expect(metadata.alternates?.canonical).toBe("/terms");
    expect(metadata.openGraph).toMatchObject({
      url: "/terms",
      title: "Terms · Echo",
      siteName: "Echo",
    });
  });

  it("uses the tagline when the page has no title", () => {
    const metadata = publicPageMetadata({ description: "Home.", path: "/" });
    expect(metadata.title).toBeUndefined();
    expect(metadata.openGraph?.title).toBe("Echo · Words worth coming back to.");
  });
});
