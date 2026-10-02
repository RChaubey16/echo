import { z } from "zod";

// Shared by the route handlers and the client forms, so this module must stay free of server-only
// imports.

export const QUOTE_MAX = 10_000;
export const AUTHOR_MAX = 500;
export const SOURCE_MAX = 1_000;
export const REFLECTION_MAX = 10_000;
export const MOOD_MAX = 100;

export const ECHO_SORTS = ["newest", "oldest", "recently_updated", "author"] as const;
export type EchoSort = (typeof ECHO_SORTS)[number];

export const LIST_LIMIT_DEFAULT = 20;
export const LIST_LIMIT_MAX = 100;

/**
 * Builds an optional free-text field that trims input and stores empty strings as null.
 *
 * @param max - The maximum length after trimming.
 * @param label - The field name used in the length error message.
 * @returns A Zod schema that accepts a string, null or undefined.
 */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max.toLocaleString("en-US")} characters or fewer.`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();
}

const echoFields = {
  quote: z
    .string({ error: "Add the quote you want to save." })
    .trim()
    .min(1, "Add the quote you want to save.")
    .max(QUOTE_MAX, `Quote must be ${QUOTE_MAX.toLocaleString("en-US")} characters or fewer.`),
  author: optionalText(AUTHOR_MAX, "Author"),
  source: optionalText(SOURCE_MAX, "Source"),
  reflection: optionalText(REFLECTION_MAX, "Reflection"),
  mood: optionalText(MOOD_MAX, "Mood"),
  isFavorite: z.boolean().optional(),
};

export const echoCreateSchema = z.object(echoFields);

export const echoUpdateSchema = echoCreateSchema
  .partial()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    error: "Change at least one field.",
  });

export const echoListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .default(LIST_LIMIT_DEFAULT)
    .transform((limit) => Math.min(limit, LIST_LIMIT_MAX)),
  sort: z.enum(ECHO_SORTS).default("newest"),
  favorite: z.stringbool().optional(),
});

export const echoIdSchema = z.uuid();

/** Raw form values, before parsing. */
export type EchoCreateInput = z.input<typeof echoCreateSchema>;
export type EchoCreate = z.output<typeof echoCreateSchema>;
export type EchoUpdate = z.output<typeof echoUpdateSchema>;
export type EchoListQuery = z.output<typeof echoListQuerySchema>;
