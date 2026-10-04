import AxeBuilder from "@axe-core/playwright";
import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "./fixtures";

/**
 * Saves an Echo through the API with the signed-in context's session.
 *
 * @param request - The browser context's request client.
 * @param data - The Echo fields; the quote is required.
 * @returns The new Echo's id.
 */
export async function seedEcho(
  request: APIRequestContext,
  data: Record<string, unknown> & { quote: string },
): Promise<string> {
  const response = await request.post("/api/echoes", { data });
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
export async function openHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/**
 * Runs axe against WCAG 2.2 A/AA and returns the serious and critical violations, one line each.
 *
 * @param page - The page to scan, already loaded.
 * @returns "impact rule-id: target" lines; empty when the page passes.
 */
export async function seriousAxeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .flatMap((violation) =>
      violation.nodes.map(
        (node) => `${violation.impact} ${violation.id}: ${node.target.join(" ")}`,
      ),
    );
}

/**
 * Seeds a small library: a favorite Echo with a reflection and tags in a collection with an
 * upcoming Revisit, plus a plain Echo.
 *
 * @param request - The browser context's request client.
 * @returns The rich Echo's id and the collection's id.
 */
export async function seededLibrary(
  request: APIRequestContext,
): Promise<{ echoId: string; collectionId: string }> {
  const collection = await request.post("/api/collections", { data: { name: "Courage" } });
  expect(collection.status()).toBe(201);
  const collectionId = ((await collection.json()) as { id: string }).id;
  const echoId = await seedEcho(request, {
    quote: "Courage is grace under pressure.",
    author: "Ernest Hemingway",
    reflection: "Said quietly, it still holds.",
    tagNames: ["courage", "calm"],
    collectionIds: [collectionId],
    isFavorite: true,
  });
  await seedEcho(request, { quote: "Begin anywhere.", author: "John Cage" });
  const revisit = await request.post("/api/revisits", {
    data: { echoId, scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
  });
  expect(revisit.status()).toBe(201);
  return { echoId, collectionId };
}
