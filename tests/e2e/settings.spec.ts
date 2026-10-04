import { Client } from "pg";
import { testDatabaseUrl } from "../helpers/test-db.mts";
import { expect, test } from "./fixtures";
import { openHydrated, seededLibrary } from "./helpers";

test.use({ viewport: { width: 1280, height: 800 } });

test("renaming in Settings updates the sidebar", async ({ page }) => {
  await openHydrated(page, "/app/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();

  const name = page.getByLabel("Name");
  await name.fill("   ");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByText("Add your name.")).toBeVisible();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();

  await name.fill("Mary Oliver");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Name saved" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Sidebar" })).toContainText("Mary Oliver");
});

test("the theme applies at once, survives a reload without a flash, and System clears it", async ({
  page,
  context,
  baseURL,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openHydrated(page, "/app/settings");

  await page.locator("label").filter({ hasText: "Always dark" }).click();
  await expect(page.getByRole("radio", { name: /Dark/ })).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  // The server renders the saved theme straight into the HTML, so there is nothing to flash.
  const html = await (await context.request.get("/app/settings")).text();
  expect(html).toMatch(/<html[^>]*data-theme="dark"/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: /Dark/ })).toBeChecked();

  // A new browser on the same account picks the saved theme up from the session.
  await context.clearCookies({ name: "echo-theme" });
  await openHydrated(page, "/app");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const cookies = await context.cookies(baseURL);
  expect(cookies.find((cookie) => cookie.name === "echo-theme")?.value).toBe("dark");

  await openHydrated(page, "/app/settings");
  await page.locator("label").filter({ hasText: "Match this device" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});

test("Mark as reflected flips at once and the Revisit leaves Due now", async ({
  page,
  context,
}) => {
  const { echoId } = await seededLibrary(context.request);
  // The API only schedules future dates, so back-date the Revisit in the test database.
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  try {
    await client.query(
      "UPDATE revisits SET scheduled_for = now() - interval '1 hour' WHERE echo_id = $1",
      [echoId],
    );
  } finally {
    await client.end();
  }

  await openHydrated(page, "/app/revisits");
  const dueNow = page.getByRole("region", { name: /Due now/ });
  // Hold the request so the optimistic state is observable.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/revisits/*", async (route) => {
    await held;
    await route.continue();
  });
  await dueNow.getByRole("button", { name: "Mark as reflected" }).click();
  await expect(dueNow.getByRole("button", { name: "Reflected" })).toBeVisible();
  release();
  // That was the only Revisit, so the page settles on its empty state.
  await expect(page.getByRole("heading", { name: "Nothing scheduled." })).toBeVisible();
});
