import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.use({ viewport: { width: 1280, height: 800 } });

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
 * Calls the API with the signed-in context's session and returns the JSON body.
 *
 * @param request - The browser context's request client.
 * @param path - The API path.
 * @param data - The JSON body to POST.
 * @returns The parsed response.
 */
async function post<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const response = await request.post(path, { data });
  expect(response.status()).toBe(201);
  return (await response.json()) as T;
}

test("add an Echo with a tag into a collection, then find it in the collection", async ({
  page,
  context,
}) => {
  const collection = await post<{ id: string }>(context.request, "/api/collections", {
    name: "Morning pages",
  });
  await open(page, "/app/echoes");
  const dialog = page.getByRole("dialog", { name: "Add Echo" });
  await expect(async () => {
    await page.locator("body").press("n");
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass();

  await dialog.getByLabel("Quote").fill("Start where you are.");
  await dialog.getByRole("button", { name: "More details" }).click();

  const tags = dialog.getByRole("combobox", { name: "Tags" });
  await tags.fill("Beginnings");
  await tags.press("Enter");
  await expect(dialog.getByRole("button", { name: "Remove tag beginnings" })).toBeVisible();

  await dialog.getByRole("button", { name: /Collections/ }).click();
  await dialog.getByRole("checkbox", { name: /Morning pages/ }).check();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Morning pages/ })).toBeVisible();

  await dialog.getByRole("button", { name: "Save Echo" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Echo saved" })).toBeVisible();

  await open(page, `/app/collections/${collection.id}`);
  await expect(page.getByRole("heading", { level: 1, name: "Morning pages" })).toBeVisible();
  await expect(page.getByText("Start where you are.")).toBeVisible();
  await expect(page.getByRole("link", { name: "beginnings" })).toBeVisible();

  // The tag chip opens the library filtered by it.
  await page.getByRole("link", { name: "beginnings" }).click();
  await expect(page).toHaveURL(/\/app\/echoes\?tag=/);
  await expect(page.getByRole("link", { name: "Remove filter: tag beginnings" })).toBeVisible();
});

test("favorite an Echo and see it on Favorites", async ({ page, context }) => {
  const echo = await post<{ id: string }>(context.request, "/api/echoes", {
    quote: "Attention is the beginning of devotion.",
  });
  await post(context.request, "/api/echoes", { quote: "Not a favorite." });
  await open(page, `/app/echoes/${echo.id}`);
  const saved = page.waitForResponse(
    (r) => r.url().includes(`/api/echoes/${echo.id}`) && r.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Favorite", exact: false }).first().click();
  expect((await saved).status()).toBe(200);

  await open(page, "/app/favorites");
  await expect(page.getByRole("heading", { level: 1, name: "Favorites" })).toBeVisible();
  await expect(page.getByText("Attention is the beginning of devotion.")).toBeVisible();
  await expect(page.getByText("Not a favorite.")).toHaveCount(0);
  await page.getByRole("link", { name: "Recently updated" }).click();
  await expect(page).toHaveURL(/sort=recently_updated/);
  await expect(page.getByText("Attention is the beginning of devotion.")).toBeVisible();
});

test("search finds a word from a reflection and opens the result", async ({ page, context }) => {
  const echo = await post<{ id: string }>(context.request, "/api/echoes", {
    quote: "Rivers know this: there is no hurry.",
    reflection: "Reminds me of the lighthouse walk in October.",
  });
  await open(page, "/app");
  await page.locator("body").press("/");
  const sidebarSearch = page.getByRole("searchbox", { name: "Search your Echoes" });
  await expect(sidebarSearch).toBeFocused();
  await sidebarSearch.fill("lighthouse");
  await sidebarSearch.press("Enter");

  await expect(page).toHaveURL(/\/app\/search\?q=lighthouse/);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await expect(
    page.getByRole("status").filter({ hasText: '1 Echo match "lighthouse"' }),
  ).toBeVisible();

  // Typing in the page's field updates the URL after the debounce.
  const field = page.locator("#page-search");
  await field.fill("no hurry");
  await expect(page).toHaveURL(/q=no(\+|%20)hurry/);
  await field.fill("lighthouse");
  await expect(page).toHaveURL(/q=lighthouse/);

  await page.getByText("Rivers know this: there is no hurry.").click();
  await expect(page).toHaveURL(new RegExp(`/app/echoes/${echo.id}$`));

  await open(page, "/app/search?q=zzzznothing");
  await expect(
    page.getByRole("heading", { name: "Nothing matches “zzzznothing” yet." }),
  ).toBeVisible();
});

test("create, rename and delete a collection; its Echoes stay", async ({ page, context }) => {
  await post(context.request, "/api/echoes", { quote: "A line worth keeping." });
  await open(page, "/app/collections");
  await expect(page.getByRole("heading", { level: 1, name: "No collections yet." })).toBeVisible();
  await page.getByRole("button", { name: "Create a collection" }).click();
  const create = page.getByRole("dialog", { name: "New collection" });
  await create.getByLabel("Name").fill("Keepers");
  await create.getByRole("button", { name: "Create collection" }).click();
  await expect(create).toBeHidden();
  await page.getByRole("link", { name: "Keepers" }).first().click();

  await expect(page.getByRole("heading", { name: "This collection is empty." })).toBeVisible();
  await page.getByRole("button", { name: "Add Echoes" }).first().click();
  const picker = page.getByRole("dialog", { name: "Add Echoes" });
  await picker.getByRole("button", { name: "Add to this collection" }).first().click();
  await expect(picker.getByRole("button", { name: /Added/ })).toBeVisible();
  await picker.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("A line worth keeping.")).toBeVisible();

  await page.getByRole("button", { name: "More actions for this collection" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const rename = page.getByRole("dialog", { name: "Edit collection" });
  await rename.getByLabel("Name").fill("Keepsakes");
  await rename.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Keepsakes" })).toBeVisible();

  await page.getByRole("button", { name: "More actions for this collection" }).click();
  await page.getByRole("menuitem", { name: "Delete collection" }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this collection?" });
  await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
  await confirm.getByRole("button", { name: "Delete collection" }).click();
  await expect(page).toHaveURL(/\/app\/collections$/);

  await open(page, "/app/echoes");
  await expect(page.getByText("A line worth keeping.")).toBeVisible();
});
