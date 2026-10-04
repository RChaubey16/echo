import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { redirect } from "next/navigation";
import { cache } from "react";
import { parseTheme, type Theme } from "@/lib/theme";
import { db } from "@/server/db";
import { track } from "@/server/analytics";
import { AppError } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { currentRequestScope } from "@/server/request-scope";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter is typed against @prisma/client; our client is generated to a custom path
  // with the same model delegates.
  adapter: PrismaAdapter(db as unknown as Parameters<typeof PrismaAdapter>[0]),
  providers: [Google],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  events: {
    createUser({ user }) {
      if (user.id) track(user.id, "signup_completed");
    },
  },
  callbacks: {
    session({ session, user }) {
      // The database adapter hands over the whole users row, including our own columns.
      const row = user as typeof user & {
        timezone?: string | null;
        onboardedAt?: Date | null;
        theme?: string | null;
      };
      session.user.id = user.id;
      session.user.timezone = row.timezone ?? null;
      session.user.onboardedAt = row.onboardedAt ?? null;
      session.user.theme = parseTheme(row.theme) ?? null;
      return session;
    },
  },
});

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  /** IANA time zone captured from the browser, or null before the first capture. */
  timezone: string | null;
  /** When the first-Echo reflection prompt was answered or skipped. */
  onboardedAt: Date | null;
  /** The saved Appearance choice, or null for System. */
  theme: Theme | null;
};

/**
 * Reads the signed-in user from the database session, once per request.
 *
 * Wrapped in React.cache() so layouts, pages and helpers that all ask for the user share a single
 * session lookup within one server render (vercel-react-best-practices: server-cache-react).
 *
 * @returns The signed-in user, or null when there is no valid session.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
    timezone: user.timezone ?? null,
    onboardedAt: user.onboardedAt ?? null,
    theme: user.theme ?? null,
  };
});

/**
 * Returns the signed-in user for a route handler, or throws UNAUTHORIZED.
 *
 * Inside apiHandler this also counts the request against the route's rate limit for this user, so
 * every authenticated mutation is limited without each handler remembering to do it.
 *
 * @returns The signed-in user.
 * @throws AppError UNAUTHORIZED without a session, or RATE_LIMITED over the route's limit.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("UNAUTHORIZED");
  const policy = currentRequestScope()?.rateLimit;
  if (policy) await enforceRateLimit(policy, user.id);
  return user;
}

/**
 * Returns the signed-in user for a server component, or redirects to /login.
 *
 * @returns The signed-in user.
 */
export async function requireUserPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
