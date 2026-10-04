import { z } from "zod";
import { isValidTimeZone } from "@/lib/daily";

export const userUpdateSchema = z
  .object({
    timezone: z
      .string()
      .max(64)
      .refine(isValidTimeZone, { error: "Unknown time zone." })
      .optional(),
    /** Marks the first-Echo reflection prompt as done, so it never shows again. */
    onboarded: z.literal(true).optional(),
  })
  .refine((patch) => patch.timezone !== undefined || patch.onboarded !== undefined, {
    error: "Change at least one field.",
  });

export type UserUpdate = z.output<typeof userUpdateSchema>;
