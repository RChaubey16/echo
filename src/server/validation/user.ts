import { z } from "zod";
import { isValidTimeZone } from "@/lib/daily";

export const USER_NAME_MAX = 100;

/** The Appearance choices; "system" is stored as null and follows the device setting. */
export const THEME_CHOICES = ["light", "dark", "system"] as const;

/** The display name rule, shared by the Settings form and the API. */
export const userNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Add your name." })
  .max(USER_NAME_MAX, { error: `Name must be ${USER_NAME_MAX} characters or fewer.` });

export const userUpdateSchema = z
  .object({
    timezone: z
      .string()
      .max(64)
      .refine(isValidTimeZone, { error: "Unknown time zone." })
      .optional(),
    /** Marks the first-Echo reflection prompt as done, so it never shows again. */
    onboarded: z.literal(true).optional(),
    name: userNameSchema.optional(),
    theme: z.enum(THEME_CHOICES).optional(),
  })
  .refine(
    (patch) =>
      patch.timezone !== undefined ||
      patch.onboarded !== undefined ||
      patch.name !== undefined ||
      patch.theme !== undefined,
    { error: "Change at least one field." },
  );

export type UserUpdate = z.output<typeof userUpdateSchema>;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

/** The word the Delete account dialog asks the user to type. */
export const DELETE_CONFIRMATION = "DELETE";

/**
 * Tells whether the typed confirmation matches: the word DELETE, or the user's own email.
 *
 * @param typed - What the user typed.
 * @param email - The signed-in user's email.
 * @returns True when the account may be deleted.
 */
export function isDeleteConfirmed(typed: string, email: string): boolean {
  const value = typed.trim();
  return value === DELETE_CONFIRMATION || value.toLowerCase() === email.toLowerCase();
}

export const accountDeleteSchema = z.object({
  confirm: z.string({ error: `Type ${DELETE_CONFIRMATION} to confirm.` }).max(320),
});
