import "server-only";
import { db } from "@/server/db";

/**
 * Permanently deletes a user and everything they own (spec §62).
 *
 * One DELETE of the users row is a single atomic statement; `onDelete: Cascade` removes sessions,
 * accounts, every Echo (soft-deleted ones too), their tag and collection links, tags, collections,
 * Revisits and Today's Echo pins with it. Nothing is kept.
 *
 * @param userId - The user's ID.
 * @returns The Google tokens that were stored, so the caller can revoke them after the delete.
 */
export async function deleteAccount(userId: string): Promise<string[]> {
  const accounts = await db.account.findMany({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });
  await db.user.deleteMany({ where: { id: userId } });
  return accounts.flatMap((account) =>
    [account.refresh_token, account.access_token].filter((token): token is string => !!token),
  );
}

/**
 * Revokes Echo's access to the user's Google account, best effort.
 *
 * Revoking either token ends the whole grant, so the first success is enough. Failures are
 * ignored: the account is already deleted and the token expires on its own.
 *
 * @param tokens - The refresh and access tokens to try, most durable first.
 * @returns Nothing.
 */
export async function revokeGoogleTokens(tokens: readonly string[]): Promise<void> {
  for (const token of tokens) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }).toString(),
        signal: AbortSignal.timeout(3_000),
      });
      if (response.ok) return;
    } catch {
      // Try the next token.
    }
  }
}
