import { describe, expect, it } from "vitest";
import { THEME_COOKIE, parseTheme, themeCookie } from "@/lib/theme";

describe("parseTheme", () => {
  it.each(["light", "dark"] as const)("keeps %s", (theme) => {
    expect(parseTheme(theme)).toBe(theme);
  });

  it.each([undefined, null, "", "system", "DARK", "blue"])("treats %j as System", (value) => {
    expect(parseTheme(value)).toBeUndefined();
  });
});

describe("themeCookie", () => {
  it("remembers a saved theme for a year, site-wide", () => {
    expect(themeCookie("dark")).toBe(
      `${THEME_COOKIE}=dark; path=/; max-age=31536000; samesite=lax`,
    );
  });

  it("clears the cookie for System", () => {
    expect(themeCookie(undefined)).toBe(`${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`);
  });
});
