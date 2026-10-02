import { test as base } from "@playwright/test";
import { testDatabaseUrl } from "../helpers/test-db.mts";
import { SESSION_COOKIE, createTestUser, type TestUser } from "../helpers/session";

type Fixtures = { testUser: TestUser };

/**
 * A Playwright test whose browser context is signed in with a freshly seeded database session.
 */
export const test = base.extend<Fixtures>({
  testUser: async ({}, use) => {
    await use(await createTestUser(testDatabaseUrl()));
  },
  context: async ({ context, baseURL, testUser }, use) => {
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: testUser.sessionToken,
        url: baseURL!,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await use(context);
  },
});

export { expect } from "@playwright/test";
