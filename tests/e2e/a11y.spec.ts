import { test as base } from "@playwright/test";
import { expect, test } from "./fixtures";
import { openHydrated, seededLibrary, seriousAxeViolations } from "./helpers";

/** Every main signed-in route, given the seeded Echo's and collection's ids. */
function appRoutes(echoId: string, collectionId: string): string[] {
  return [
    "/app",
    "/app/echoes",
    "/app/echoes/new",
    `/app/echoes/${echoId}`,
    `/app/echoes/${echoId}/edit`,
    "/app/favorites",
    "/app/collections",
    `/app/collections/${collectionId}`,
    "/app/search?q=courage",
    "/app/search?q=nothing-matches-this",
    "/app/revisits",
    "/app/settings",
  ];
}

base.describe("signed out", () => {
  for (const scheme of ["light", "dark"] as const) {
    for (const path of ["/", "/?goodbye=1", "/login", "/privacy", "/terms", "/no-such-page"]) {
      base(`${path} has no serious axe violations (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(path);
        expect(await seriousAxeViolations(page)).toEqual([]);
      });
    }
  }
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`signed in, ${scheme}`, () => {
    test.use({ viewport: { width: 1280, height: 800 }, colorScheme: scheme });

    test("every main route has no serious axe violations", async ({ page, context }) => {
      test.slow();
      const { echoId, collectionId } = await seededLibrary(context.request);
      const failures: string[] = [];
      for (const path of appRoutes(echoId, collectionId)) {
        await openHydrated(page, path);
        await expect(page.locator("h1")).toHaveCount(1);
        failures.push(...(await seriousAxeViolations(page)).map((line) => `${path} ${line}`));
      }
      expect(failures).toEqual([]);
    });

    test("empty states have no serious axe violations", async ({ page }) => {
      const failures: string[] = [];
      for (const path of [
        "/app",
        "/app/echoes",
        "/app/favorites",
        "/app/collections",
        "/app/revisits",
      ]) {
        await openHydrated(page, path);
        failures.push(...(await seriousAxeViolations(page)).map((line) => `${path} ${line}`));
      }
      expect(failures).toEqual([]);
    });
  });
}

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

  test("the main routes have no serious axe violations at 375px", async ({ page, context }) => {
    test.slow();
    const { echoId, collectionId } = await seededLibrary(context.request);
    const failures: string[] = [];
    for (const path of appRoutes(echoId, collectionId)) {
      await openHydrated(page, path);
      failures.push(...(await seriousAxeViolations(page)).map((line) => `${path} ${line}`));
    }
    expect(failures).toEqual([]);
  });
});
