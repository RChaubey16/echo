import { expect, test } from "./fixtures";
import { openHydrated, seededLibrary } from "./helpers";

// iPhone SE size in Chromium (CI installs only Chromium); 320px runs the overflow check.
test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

test("quick capture opens as a bottom sheet from the tab bar and saves", async ({ page }) => {
  await openHydrated(page, "/app");
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Add Echo" })
    .tap();

  const sheet = page.getByRole("dialog", { name: "Add Echo" });
  await expect(sheet).toBeVisible();
  // Docked full width to the bottom edge, once the rise-in animation settles.
  await expect
    .poll(async () => {
      const box = (await sheet.boundingBox())!;
      return [box.width, Math.round(box.y + box.height)];
    })
    .toEqual([375, 667]);

  await sheet.getByLabel("Quote").fill("Small steps, every day.");
  await sheet.getByRole("button", { name: "Save Echo" }).tap();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("status").filter({ hasText: "Echo saved" })).toBeVisible();
});

test("the Echo detail keeps its actions in reach above the tab bar", async ({ page, context }) => {
  const { echoId } = await seededLibrary(context.request);
  await openHydrated(page, `/app/echoes/${echoId}`);
  const favorite = page.getByRole("button", { name: /favorites/ });
  await expect(favorite).toBeInViewport();
  const tabBar = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
  const action = (await favorite.boundingBox())!;
  expect(action.y + action.height).toBeLessThanOrEqual(tabBar.y);
  expect(action.height).toBeGreaterThanOrEqual(44);
});

test("Favorites, Revisits and Settings are in the account menu", async ({ page }) => {
  await openHydrated(page, "/app");
  await page.getByRole("button", { name: "Account menu" }).tap();
  const menu = page.getByRole("menu", { name: "Account" });
  for (const name of ["Favorites", "Revisits", "Settings"]) {
    await expect(menu.getByRole("menuitem", { name })).toBeVisible();
  }
  await menu.getByRole("menuitem", { name: "Settings" }).tap();
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
});

test("no main route scrolls sideways at 320px", async ({ page, context }) => {
  test.slow();
  await page.setViewportSize({ width: 320, height: 640 });
  const { echoId, collectionId } = await seededLibrary(context.request);
  const overflowing: string[] = [];
  for (const path of [
    "/app",
    "/app/echoes",
    `/app/echoes/${echoId}`,
    `/app/echoes/${echoId}/edit`,
    "/app/echoes/new",
    "/app/favorites",
    "/app/collections",
    `/app/collections/${collectionId}`,
    "/app/search?q=courage",
    "/app/revisits",
    "/app/settings",
  ]) {
    await openHydrated(page, path);
    const wide = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (wide) overflowing.push(path);
  }
  expect(overflowing).toEqual([]);
});

test("tap targets in the tab bar and header are at least 44px", async ({ page }) => {
  await openHydrated(page, "/app");
  const targets = page.locator('nav[aria-label="Main"] a, header button, header a');
  const small: string[] = [];
  for (const target of await targets.all()) {
    const box = await target.boundingBox();
    if (box && (box.width < 44 || box.height < 44)) {
      small.push(
        `${(await target.getAttribute("aria-label")) ?? (await target.innerText())}: ${box.width}x${box.height}`,
      );
    }
  }
  expect(small).toEqual([]);
});

test("on phones the Echo detail keeps Add to collection and Delete in the More menu", async ({
  page,
  context,
}) => {
  const { echoId } = await seededLibrary(context.request);
  await openHydrated(page, `/app/echoes/${echoId}`);
  // Only the menu offers them at this width.
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "More actions for this Echo" }).click();
  await page.getByRole("menuitem", { name: "Change collections" }).click();
  const collections = page.getByRole("dialog", { name: "Add to collection" });
  await expect(collections).toBeVisible();
  await collections.getByRole("button", { name: "Done" }).click();

  await page.getByRole("button", { name: "More actions for this Echo" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this Echo?" });
  await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "More actions for this Echo" })).toBeFocused();
});
