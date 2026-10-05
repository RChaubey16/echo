import { z } from "zod";

// Shared by the route handlers and the client TagInput, so this module must stay free of
// server-only imports.

export const TAG_NAME_MAX = 50;
export const TAGS_PER_ECHO_MAX = 50;

/**
 * Normalizes a tag name the way it is stored: trimmed, inner whitespace collapsed, lowercased.
 *
 * @param name - The tag name as typed.
 * @returns The normalized tag name.
 */
export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export const tagNameSchema = z
  .string({ error: "Add a tag name." })
  .transform(normalizeTagName)
  .pipe(
    z
      .string()
      .min(1, "Add a tag name.")
      .max(TAG_NAME_MAX, `Tags must be ${TAG_NAME_MAX} characters or fewer.`),
  );

export const tagCreateSchema = z.object({ name: tagNameSchema });
export const tagUpdateSchema = tagCreateSchema;
