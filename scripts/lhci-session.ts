// Creates a throwaway signed-in user in the LOCAL test database and prints its Cookie header value,
// so Lighthouse CI can measure /app. Refuses non-local databases (see testDatabaseUrl).
import { testDatabaseUrl } from "../tests/helpers/test-db.mts";
import { createTestUser } from "../tests/helpers/session";

const user = await createTestUser(testDatabaseUrl(), { name: "Lighthouse" });
process.stdout.write(user.cookie);
