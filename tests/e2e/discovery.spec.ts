import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.use({ viewport: { width: 1280, height: 800 } });

/**
 * Saves an Echo through the API with the signed-in context's session.
 *
 * @param request - The browser context's request client.
 * @param quote - The quote text.
 * @returns The new Echo's id.
 */
async function seedEcho(request: APIRequestContext, quote: string): Promise<string> {
  const response = await request.post("/api/echoes", { data: { quote, author: "E2E Author" } });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
}

/**
 * Navigates and waits until the app shell has hydrated, so clicks and typing reach React.
 *
 * @param page - The page.
 * @param url - The path to open.
 * @returns Nothing.
 */
async function open(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

test("a new user goes from the welcome screen to their first Echo, a reflection, and Today's Echo", async ({
  page,
}) => {
  await open(page, "/app");
  await expect(page.getByRole("heading", { level: 1, name: /^Welcome to Echo/ })).toBeVisible();
  await page.getByRole("link", { name: "Add your first Echo" }).click();

  const dialog = page.getByRole("dialog", { name: "Add Echo" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Quote").fill("The first words worth keeping.");
  await dialog.getByRole("button", { name: "Save Echo" }).click();

  await expect(page).toHaveURL(/\/app\/echoes\/[0-9a-f-]{36}$/);
  const prompt = page.getByRole("region", { name: "Why did this speak to you?" });
  await expect(prompt).toBeVisible();
  await prompt.getByRole("textbox").fill("It made me slow down.");
  await prompt.getByRole("button", { name: "Save reflection" }).click();
  await expect(prompt).toBeHidden();
  await expect(page.getByRole("region", { name: "Reflection" })).toContainText(
    "It made me slow down.",
  );

  // The prompt shows only once.
  await page.reload();
  await expect(page.getByRole("region", { name: "Why did this speak to you?" })).toHaveCount(0);

  await open(page, "/app");
  const today = page.getByRole("region", { name: /Today's Echo/ });
  await expect(today).toContainText("The first words worth keeping.");
  await expect(today).toContainText("You wrote");
  await expect(today).toContainText("It made me slow down.");
});

test("Today's Echo stays put on reload, and Echo me something swaps it", async ({
  page,
  context,
}) => {
  for (const quote of ["Alpha words.", "Beta words.", "Gamma words.", "Delta words."]) {
    await seedEcho(context.request, quote);
  }
  await open(page, "/app");
  const today = page.getByRole("region", { name: /Today's Echo/ });
  const quote = today.getByRole("blockquote");
  const first = await quote.textContent();

  await page.reload();
  await expect(quote).toHaveText(first!);

  await today.getByRole("button", { name: "Echo me something" }).click();
  await expect(quote).not.toHaveText(first!);
  await expect(today.getByRole("status")).toContainText("Now showing an Echo");
});

test("a Revisit scheduled from the Add form appears under Upcoming", async ({ page }) => {
  await open(page, "/app/echoes/new");
  await page.getByLabel("Quote").fill("See me again in a month.");
  await page.getByRole("button", { name: "In 1 month" }).click();
  await expect(page.getByText(/Revisit on/)).toBeVisible();
  await page.getByRole("button", { name: "Save Echo" }).click();
  await expect(page).toHaveURL(/\/app\/echoes\/[0-9a-f-]{36}$/);
  await expect(page.getByText(/Revisit on/)).toBeVisible();

  await open(page, "/app/revisits");
  const upcoming = page.getByRole("region", { name: /Upcoming/ });
  await expect(upcoming).toContainText("See me again in a month.");
  await expect(upcoming.getByRole("button", { name: "Change" })).toBeVisible();
});

test("the calendar picks a date with the keyboard", async ({ page, context }) => {
  const id = await seedEcho(context.request, "Pick a day for me.");
  await open(page, `/app/echoes/${id}`);
  await page.getByRole("button", { name: "Pick a date" }).click();
  const grid = page.getByRole("grid");
  await expect(grid).toBeVisible();

  // The first focusable day is tomorrow; move a week ahead and choose it.
  await grid.locator("button[tabindex='0']").focus();
  await page.keyboard.press("ArrowDown");
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/revisits") && r.request().method() === "POST",
  );
  await page.keyboard.press("Enter");
  expect((await saved).status()).toBe(201);
  await expect(page.getByText(/Revisit on/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Change" })).toBeFocused();
});
