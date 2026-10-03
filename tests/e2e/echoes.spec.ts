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

/**
 * Presses `n` until QuickCapture opens, which also waits for the page to hydrate.
 *
 * @param page - The page.
 * @returns Nothing.
 */
async function openQuickCapture(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Add Echo" });
  await expect(async () => {
    await page.locator("body").press("n");
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass();
}

test("the full form saves a quote-only Echo and lands on its detail page", async ({ page }) => {
  await open(page, "/app/echoes/new");
  const quote = page.getByLabel("Quote");
  await expect(quote).toBeFocused();
  await quote.fill("Begin anywhere.");
  await page.getByRole("button", { name: "Save Echo" }).click();
  await expect(page).toHaveURL(/\/app\/echoes\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("blockquote")).toHaveText("Begin anywhere.");
});

test("a favorite survives a reload", async ({ page, context }) => {
  const id = await seedEcho(context.request, "Keep this one close.");
  await open(page, `/app/echoes/${id}`);
  const favorite = page.getByRole("button", { name: "Favorite", exact: false }).first();
  await expect(favorite).toHaveAttribute("aria-pressed", "false");
  const saved = page.waitForResponse(
    (r) => r.url().includes(`/api/echoes/${id}`) && r.request().method() === "PATCH",
  );
  await favorite.click();
  await expect(favorite).toHaveAttribute("aria-pressed", "true");
  expect((await saved).status()).toBe(200);
  await page.reload();
  await expect(page.getByRole("button", { name: /Favorited/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("quick capture: n, type, Cmd/Ctrl+Enter, toast, and it is in the library", async ({
  page,
}) => {
  await open(page, "/app/echoes");
  await openQuickCapture(page);
  const dialog = page.getByRole("dialog", { name: "Add Echo" });
  const quote = dialog.getByLabel("Quote");
  await expect(quote).toBeFocused();

  await quote.press("ControlOrMeta+Enter");
  await expect(dialog.getByText("Add the quote you want to save.")).toBeVisible();
  await expect(quote).toHaveAttribute("aria-invalid", "true");

  await quote.fill("The quieter you become, the more you can hear.");
  await quote.press("ControlOrMeta+Enter");
  await expect(page.getByRole("status").filter({ hasText: "Echo saved" })).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("The quieter you become, the more you can hear.")).toBeVisible();
});

test("quick capture asks before discarding a typed quote and returns focus", async ({ page }) => {
  await open(page, "/app");
  const trigger = page
    .getByRole("complementary", { name: "Sidebar" })
    .getByRole("link", { name: "Add Echo" })
    .first();
  await expect(async () => {
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Add Echo" })).toBeVisible({ timeout: 500 });
  }).toPass();
  const dialog = page.getByRole("dialog", { name: "Add Echo" });
  await dialog.getByLabel("Quote").fill("Half a thought");
  await page.keyboard.press("Escape");
  await expect(dialog.getByText("Discard this quote?")).toBeVisible();
  await dialog.getByRole("button", { name: "Discard" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("editing an Echo shows the change on its detail page", async ({ page, context }) => {
  const id = await seedEcho(context.request, "First draft of a thought.");
  await open(page, `/app/echoes/${id}/edit`);
  await expect(page.getByLabel("Author")).toHaveValue("E2E Author");
  await page.getByLabel("Quote").fill("Second, better draft.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/echoes/${id}$`));
  await expect(page.getByRole("blockquote")).toHaveText("Second, better draft.");
});

test("deleting an Echo removes it from the library", async ({ page, context }) => {
  const id = await seedEcho(context.request, "Here today, gone tomorrow.");
  await open(page, `/app/echoes/${id}`);
  await page.getByRole("button", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this Echo?" });
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await dialog.getByRole("button", { name: "Delete Echo" }).click();
  await expect(page).toHaveURL(/\/app\/echoes$/);
  await expect(page.getByText("Here today, gone tomorrow.")).toHaveCount(0);
  await open(page, `/app/echoes/${id}`);
  await expect(
    page.getByRole("heading", { name: "This Echo doesn't exist or isn't yours." }),
  ).toBeVisible();
});

test("another user's Echo shows the same 404 page", async ({ page }) => {
  await open(page, "/app/echoes/00000000-0000-4000-8000-000000000000");
  await expect(
    page.getByRole("heading", { name: "This Echo doesn't exist or isn't yours." }),
  ).toBeVisible();
  await open(page, "/app/echoes/not-a-uuid");
  await expect(
    page.getByRole("heading", { name: "This Echo doesn't exist or isn't yours." }),
  ).toBeVisible();
});

test("the library is empty for a new user and offers the first Echo", async ({ page }) => {
  await open(page, "/app/echoes");
  await expect(
    page.getByRole("heading", { level: 1, name: "Your library is empty." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Add your first Echo" })).toBeVisible();
});
