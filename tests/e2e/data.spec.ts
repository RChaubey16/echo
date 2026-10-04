import { readFile } from "node:fs/promises";
import { test as base } from "@playwright/test";
import { expect, test } from "./fixtures";
import { openHydrated, seedEcho } from "./helpers";

test.use({ viewport: { width: 1280, height: 800 } });

test("Settings exports the library as JSON and CSV", async ({ page, context }) => {
  await seedEcho(context.request, { quote: "Begin anywhere.", author: "John Cage" });
  await openHydrated(page, "/app/settings");

  const [json] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download JSON" }).click(),
  ]);
  expect(json.suggestedFilename()).toMatch(/^echo-export-\d{4}-\d{2}-\d{2}\.json$/);
  const body = JSON.parse(await readFile((await json.path())!, "utf8")) as {
    echoes: Array<{ quote: string }>;
  };
  expect(body.echoes.map((echo) => echo.quote)).toEqual(["Begin anywhere."]);

  const [csv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download CSV" }).click(),
  ]);
  expect(csv.suggestedFilename()).toMatch(/\.csv$/);
  expect(await readFile((await csv.path())!, "utf8")).toContain("Begin anywhere.,John Cage");
});

test("deleting the account needs the typed confirmation, then signs out for good", async ({
  page,
  context,
}) => {
  await seedEcho(context.request, { quote: "Soon gone." });
  await openHydrated(page, "/app/settings");

  const trigger = page.getByRole("button", { name: "Delete account" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();

  const confirm = dialog.getByRole("button", { name: "Delete account" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type DELETE to confirm").fill("delete");
  await expect(confirm).toBeDisabled();

  // Esc closes it and focus returns to the trigger.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
  await confirm.click();

  // The first DELETE and the landing page may still be compiling under `next dev`.
  await expect(page).toHaveURL(/\/\?goodbye=1$/, { timeout: 20_000 });
  await expect(page.getByRole("status")).toContainText("Your account and everything in it");

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get("/api/me")).status()).toBe(401);
});

base("the legal pages are public and linked from the landing page", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Legal" })
    .getByRole("link", { name: "Privacy" })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy policy" })).toBeVisible();
  await expect(page.getByText(/gone at once and no copy remains anywhere/)).toBeVisible();
  await page
    .getByRole("navigation", { name: "Legal" })
    .getByRole("link", { name: "Terms" })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Terms of use" })).toBeVisible();
});
