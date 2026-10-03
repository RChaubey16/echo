import {
  AUTHOR_MAX,
  MOOD_MAX,
  QUOTE_MAX,
  REFLECTION_MAX,
  SOURCE_MAX,
  echoCreateSchema,
  type EchoCreate,
} from "@/server/validation/echo";
import type { EchoDto } from "@/types/echo";

export type EchoField = "quote" | "author" | "source" | "reflection" | "mood";
export type EchoValues = Record<EchoField, string>;
export type EchoErrors = Partial<Record<EchoField, string>>;

export const DETAIL_FIELDS: Array<{
  name: Exclude<EchoField, "quote">;
  label: string;
  max: number;
  multiline?: boolean;
  placeholder: string;
}> = [
  { name: "author", label: "Author", max: AUTHOR_MAX, placeholder: "e.g. Mary Oliver" },
  {
    name: "source",
    label: "Source",
    max: SOURCE_MAX,
    placeholder: "e.g. a book, a talk, a friend",
  },
  {
    name: "reflection",
    label: "Reflection",
    max: REFLECTION_MAX,
    multiline: true,
    placeholder: "Why does this stay with you?",
  },
  { name: "mood", label: "Mood", max: MOOD_MAX, placeholder: "e.g. hopeful" },
];

export const FIELD_MAX: Record<EchoField, number> = {
  quote: QUOTE_MAX,
  author: AUTHOR_MAX,
  source: SOURCE_MAX,
  reflection: REFLECTION_MAX,
  mood: MOOD_MAX,
};

export const EMPTY_VALUES: EchoValues = {
  quote: "",
  author: "",
  source: "",
  reflection: "",
  mood: "",
};

/**
 * Builds form values from a saved Echo, turning nulls into empty strings.
 *
 * @param echo - The saved Echo, or undefined for a new one.
 * @returns The form values.
 */
export function valuesFromEcho(echo?: EchoDto): EchoValues {
  if (!echo) return EMPTY_VALUES;
  return {
    quote: echo.quote,
    author: echo.author ?? "",
    source: echo.source ?? "",
    reflection: echo.reflection ?? "",
    mood: echo.mood ?? "",
  };
}

/**
 * Validates form values with the same schema the API uses, keeping the first message per field.
 *
 * @param values - The current form values.
 * @returns The parsed Echo on success, or the per-field errors.
 */
export function validateEcho(values: EchoValues): { data: EchoCreate } | { errors: EchoErrors } {
  const result = echoCreateSchema.safeParse(values);
  if (result.success) return { data: result.data };
  return {
    errors: errorsFromFields(
      Object.fromEntries(
        result.error.issues.map((issue) => [String(issue.path[0]), [issue.message]]),
      ),
    ),
  };
}

/**
 * Converts the API's per-field messages into form errors, ignoring unknown fields.
 *
 * @param fields - Messages keyed by field name.
 * @returns The first message for each known field.
 */
export function errorsFromFields(fields: Record<string, string[]>): EchoErrors {
  const errors: EchoErrors = {};
  for (const name of Object.keys(FIELD_MAX) as EchoField[]) {
    const message = fields[name]?.[0];
    if (message && !errors[name]) errors[name] = message;
  }
  return errors;
}

/**
 * Reports whether any field has text, so a draft is never discarded silently.
 *
 * @param values - The current form values.
 * @param initial - The values the form started from.
 * @returns True when the values differ from where the form started.
 */
export function isDirty(values: EchoValues, initial: EchoValues = EMPTY_VALUES): boolean {
  return (Object.keys(values) as EchoField[]).some(
    (name) => values[name].trim() !== initial[name].trim(),
  );
}
