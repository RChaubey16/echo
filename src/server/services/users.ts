import "server-only";
import { db } from "@/server/db";
import { liveEchoes } from "@/server/services/echoes";
import type { UserUpdate } from "@/server/validation/user";

/**
 * Updates the signed-in user's own settings: their time zone and whether onboarding is done.
 *
 * Onboarding keeps its first timestamp; sending it again changes nothing.
 *
 * @param userId - The user's ID.
 * @param patch - The validated fields to change.
 * @returns The stored time zone and onboarding time.
 */
export async function updateMe(
  userId: string,
  patch: UserUpdate,
): Promise<{ timezone: string | null; onboardedAt: string | null }> {
  if (patch.onboarded) {
    await db.user.updateMany({
      where: { id: userId, onboardedAt: null },
      data: { onboardedAt: new Date() },
    });
  }
  const user = await db.user.update({
    where: { id: userId },
    data: patch.timezone === undefined ? {} : { timezone: patch.timezone },
    select: { timezone: true, onboardedAt: true },
  });
  return { timezone: user.timezone, onboardedAt: user.onboardedAt?.toISOString() ?? null };
}

/**
 * Tells whether the user should see the first-Echo reflection prompt: they haven't finished
 * onboarding and this is their only Echo, with no reflection yet.
 *
 * @param userId - The user's ID.
 * @param echo - The Echo being shown.
 * @param onboardedAt - When the user finished onboarding, or null.
 * @returns True when the prompt should show.
 */
export async function shouldPromptFirstReflection(
  userId: string,
  echo: { id: string; reflection: string | null },
  onboardedAt: Date | null,
): Promise<boolean> {
  if (onboardedAt || echo.reflection) return false;
  const count = await db.echo.count({ where: liveEchoes(userId) });
  return count === 1;
}
