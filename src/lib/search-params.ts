import { z } from "zod";
import { ECHO_SORTS, type EchoSort } from "@/server/validation/echo";

const uuidSchema = z.uuid();

type Param = string | string[] | undefined;

/**
 * Reads a positive page number from the query string.
 *
 * @param value - The raw `page` parameter.
 * @returns The page number, or 1 when missing or invalid.
 */
export function parsePage(value: Param): number {
  const page = Number.parseInt(typeof value === "string" ? value : "", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/**
 * Reads one of the allowed sort orders from the query string.
 *
 * @param value - The raw `sort` parameter.
 * @param allowed - The sort orders this page offers; the first is the default.
 * @returns The sort order, or the default when missing or not allowed.
 */
export function parseSort<T extends EchoSort>(
  value: Param,
  allowed: readonly T[] = ECHO_SORTS as unknown as T[],
): T {
  return allowed.find((sort) => sort === value) ?? allowed[0]!;
}

/**
 * Reads a single string parameter, ignoring repeats.
 *
 * @param value - The raw parameter.
 * @returns The value, or undefined when missing or empty.
 */
export function parseString(value: Param): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Reads a UUID parameter, ignoring anything malformed.
 *
 * @param value - The raw parameter.
 * @returns The UUID, or undefined when missing or not a UUID.
 */
export function parseUuid(value: Param): string | undefined {
  const text = parseString(value);
  return text && uuidSchema.safeParse(text).success ? text : undefined;
}

/**
 * Builds a path with a query string, leaving out empty values.
 *
 * @param path - The path without a query.
 * @param params - The parameters; undefined and empty values are left out.
 * @returns The path, with `?query` when any parameter remains.
 */
export function hrefWith(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}
