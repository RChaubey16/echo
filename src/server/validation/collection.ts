import { z } from "zod";

// Shared by the route handlers and the client forms, so this module must stay free of
// server-only imports.

export const COLLECTION_NAME_MAX = 100;
export const COLLECTION_DESCRIPTION_MAX = 1_000;
export const COLLECTIONS_PER_ECHO_MAX = 50;

/** DESIGN.md › Tints: the color of a collection's dot and icon chip. */
export const COLLECTION_ACCENTS = ["lagoon", "bronze", "plum", "neutral"] as const;
export type CollectionAccent = (typeof COLLECTION_ACCENTS)[number];

/** New collections cycle through these so neighbouring collections differ. */
export const ACCENT_CYCLE = ["lagoon", "bronze", "plum"] as const satisfies CollectionAccent[];

const collectionFields = {
  name: z
    .string({ error: "Name your collection." })
    .trim()
    .min(1, "Name your collection.")
    .max(COLLECTION_NAME_MAX, `Name must be ${COLLECTION_NAME_MAX} characters or fewer.`),
  description: z
    .string()
    .trim()
    .max(
      COLLECTION_DESCRIPTION_MAX,
      `Description must be ${COLLECTION_DESCRIPTION_MAX.toLocaleString("en-US")} characters or fewer.`,
    )
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  accent: z.enum(COLLECTION_ACCENTS).optional(),
};

export const collectionCreateSchema = z.object(collectionFields);

export const collectionUpdateSchema = collectionCreateSchema
  .partial()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    error: "Change at least one field.",
  });

export const collectionEchoSchema = z.object({ echoId: z.uuid({ error: "Pick an Echo." }) });

export type CollectionCreateInput = z.input<typeof collectionCreateSchema>;
export type CollectionCreate = z.output<typeof collectionCreateSchema>;
export type CollectionUpdate = z.output<typeof collectionUpdateSchema>;
