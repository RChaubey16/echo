import { randomBytes, randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

export const SESSION_COOKIE = "authjs.session-token";

export type TestUser = {
  user: { id: string; email: string; name: string };
  sessionToken: string;
  cookie: string;
};

/**
 * Inserts a user and a 30-day database session so tests can sign in without Google.
 *
 * @param databaseUrl - The local test database to write to.
 * @param overrides - Optional name and email for the user.
 * @returns The user, the raw session token and a ready-to-send Cookie header value.
 */
export async function createTestUser(
  databaseUrl: string,
  overrides: { name?: string; email?: string } = {},
): Promise<TestUser> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const user = await prisma.user.create({
      data: {
        email: overrides.email ?? `test-${randomUUID()}@example.com`,
        name: overrides.name ?? "Test User",
        emailVerified: new Date(),
      },
    });
    const sessionToken = randomBytes(32).toString("hex");
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return {
      user: { id: user.id, email: user.email, name: user.name ?? "" },
      sessionToken,
      cookie: `${SESSION_COOKIE}=${sessionToken}`,
    };
  } finally {
    await prisma.$disconnect();
  }
}
