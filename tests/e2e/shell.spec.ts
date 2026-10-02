import { test as base } from "@playwright/test";
import { expect, test } from "./fixtures";

base.describe("signed out", () => {
  base("/app redirects to /login", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to Echo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });

  base("a forged session cookie still lands on /login", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "authjs.session-token", value: "forged", url: baseURL! }]);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("signed in", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("/app renders the sidebar shell and the first-run state", async ({ page }) => {
    await page.goto("/app");
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Home", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(sidebar.getByRole("link", { name: "Add Echo" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Welcome to Echo." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add your first Echo" })).toBeVisible();
  });

  test("/login redirects to /app when already signed in", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("the sidebar collapses to the rail and expands again, and the choice survives a reload", async ({
    page,
  }) => {
    await page.goto("/app");
    const sidebar = page.getByRole("complementary", { name: "Sidebar" });
    await expect(sidebar).toHaveAttribute("data-expanded", "true");
    await expect(sidebar).toHaveCSS("width", "256px");

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(sidebar).toHaveCSS("width", "96px");
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeFocused();

    await page.reload();
    await expect(sidebar).toHaveCSS("width", "96px");
    await expect(sidebar.getByText("Home")).toBeVisible(); // rail labels stay visible

    await page.getByRole("button", { name: "Expand sidebar" }).click();
    await expect(sidebar).toHaveCSS("width", "256px");
    await page.reload();
    await expect(sidebar).toHaveCSS("width", "256px");
  });

  test("the account menu signs out", async ({ page }) => {
    await page.goto("/app");
    await page
      .getByRole("complementary", { name: "Sidebar" })
      .getByRole("button", { name: "Account menu" })
      .click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("at 375px the bottom tab bar shows and the sidebar doesn't", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toBeHidden();
    const tabs = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
    await expect(tabs).toHaveCount(1);
    for (const name of ["Home", "Library", "Add Echo", "Search", "Collections"]) {
      await expect(tabs.getByRole("link", { name })).toBeVisible();
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });
});

test.describe("dark theme", () => {
  test.use({ colorScheme: "dark", viewport: { width: 1280, height: 800 } });

  test("with the system set to dark, the shell renders the dark palette", async ({ page }) => {
    await page.goto("/app");
    // surface-soft (dark) = #121514, canvas (dark) = #1b1f1e
    const surfaceSoft = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-surface-soft").trim(),
    );
    expect(surfaceSoft).toBe("#121514");
    await expect(page.getByRole("complementary", { name: "Sidebar" })).toHaveCSS(
      "background-color",
      "rgb(27, 31, 30)",
    );
  });
});
