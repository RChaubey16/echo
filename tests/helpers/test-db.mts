import "dotenv/config";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "db", "postgres"]);

/**
 * Returns the disposable test database URL, refusing anything that is not a local host.
 *
 * @returns The test database connection string.
 */
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://echo:echo@localhost:5432/echo_test";
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to run tests against non-local database host "${host}".`);
  }
  return url;
}
