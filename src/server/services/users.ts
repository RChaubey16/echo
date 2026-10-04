import "server-only";
import { parseTheme } from "@/lib/theme";
import { db } from "@/server/db";
import { liveEchoes } from "@/server/services/echoes";
import type { UserUpdate } from "@/server/validation/user";
import type { MeDto } from "@/types/user";

/**
 * Updates the signed-in user's own settings: name, theme, time zone and onboarding.
 *
 * Onboarding keeps its first timestamp; sending it again changes nothing. A theme of "system" is
 * stored as null.
 *
 * @param userId - The user's ID.
 * @param patch - The validated fields to change.
 * @returns The stored name, time zone, onboarding time and theme.
 */
export async function updateMe(userId: string, patch: UserUpdate): Promise<MeDto> {
  if (patch.onboarded) {
    await db.user.updateMany({
      where: { id: userId, onboardedAt: null },
      data: { onboardedAt: new Date() },
    });
  }
  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(patch.timezone === undefined ? {} : { timezone: patch.timezone }),
      ...(patch.name === undefined ? {} : { name: patch.name }),
      ...(patch.theme === undefined ? {} : { theme: parseTheme(patch.theme) ?? null }),
    },
    select: { name: true, timezone: true, onboardedAt: true, theme: true },
  });
  return {
    name: user.name,
    timezone: user.timezone,
    onboardedAt: user.onboardedAt?.toISOString() ?? null,
    theme: parseTheme(user.theme) ?? null,
  };
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
