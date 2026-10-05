import { z } from "zod";
import { RANDOM_EXCLUDE_MAX } from "@/server/services/discovery-rules";
import { COLLECTIONS_PER_ECHO_MAX } from "@/server/validation/collection";
import { TAGS_PER_ECHO_MAX, tagNameSchema } from "@/server/validation/tag";

// Shared by the route handlers and the client forms, so this module must stay free of server-only
// imports.

export const QUOTE_MAX = 10_000;
export const AUTHOR_MAX = 500;
export const SOURCE_MAX = 1_000;
export const REFLECTION_MAX = 10_000;
export const MOOD_MAX = 100;

export const ECHO_SORTS = [
  "newest",
  "oldest",
  "recently_updated",
  "recently_favorited",
  "author",
] as const;
export type EchoSort = (typeof ECHO_SORTS)[number];

const LIST_LIMIT_DEFAULT = 20;
const LIST_LIMIT_MAX = 100;
export const SEARCH_MAX = 200;

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
  tagIds: z
    .array(z.uuid({ error: "Unknown tag." }))
    .max(TAGS_PER_ECHO_MAX, `An Echo can have up to ${TAGS_PER_ECHO_MAX} tags.`)
    .optional(),
  /** Tags to create (or reuse) by name, so the form can add new tags inline. */
  tagNames: z
    .array(tagNameSchema)
    .max(TAGS_PER_ECHO_MAX, `An Echo can have up to ${TAGS_PER_ECHO_MAX} tags.`)
    .optional(),
  collectionIds: z
    .array(z.uuid({ error: "Unknown collection." }))
    .max(
      COLLECTIONS_PER_ECHO_MAX,
      `An Echo can be in up to ${COLLECTIONS_PER_ECHO_MAX} collections.`,
    )
    .optional(),
  /**
   * Schedules (or, on update, replaces) the Echo's Revisit as an ISO date-time; null on update
   * cancels it. Kept as a string so the client forms can send the parsed values as JSON.
   */
  revisitAt: z.iso.datetime({ offset: true, error: "Pick a valid date." }).nullable().optional(),
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
  tag: z.uuid().optional(),
  collection: z.uuid().optional(),
  search: z
    .string()
    .trim()
    .max(SEARCH_MAX)
    .transform((value) => (value === "" ? undefined : value))
    .optional(),
});

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(SEARCH_MAX, `Search must be ${SEARCH_MAX} characters or fewer.`)
    .default(""),
  page: echoListQuerySchema.shape.page,
  limit: echoListQuerySchema.shape.limit,
});

export const echoIdSchema = z.uuid();

/** `?exclude=` for Echo Me Something: comma-separated IDs; anything that isn't a UUID is ignored. */
export const randomQuerySchema = z.object({
  exclude: z
    .string()
    .max(1_000)
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => echoIdSchema.safeParse(id).success)
        .slice(-RANDOM_EXCLUDE_MAX),
    ),
});

/** Raw form values, before parsing. */
export type EchoCreateInput = z.input<typeof echoCreateSchema>;
export type EchoCreate = z.output<typeof echoCreateSchema>;
export type EchoUpdate = z.output<typeof echoUpdateSchema>;
export type EchoListQuery = z.output<typeof echoListQuerySchema>;
export type SearchQuery = z.output<typeof searchQuerySchema>;
