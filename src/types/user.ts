import type { Theme } from "@/lib/theme";

/** The signed-in user's own settings, as returned by `PATCH /api/me`. */
export type MeDto = {
  name: string | null;
  timezone: string | null;
  onboardedAt: string | null;
  /** The saved theme, or null for System. */
  theme: Theme | null;
};
