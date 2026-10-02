import { defineConfig, devices } from "@playwright/test";
import { testDatabaseUrl } from "./tests/helpers/test-db.mts";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;
const databaseUrl = testDatabaseUrl();

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/helpers/integration-global-setup.ts",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      AUTH_URL: baseURL,
      AUTH_TRUST_HOST: "true",
    },
  },
});
