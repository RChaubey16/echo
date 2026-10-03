import "server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AppError, type ErrorCode } from "@/server/http";

const uuidSchema = z.uuid();

/** A Prisma client or an interactive-transaction client; services accept either. */
export type DbClient = Prisma.TransactionClient;

/**
 * Throws the given not-found error when an ID from the URL isn't a UUID.
 *
 * A malformed ID can't match any row, so it gets the same 404 as a missing record instead of a
 * database error.
 *
 * @param id - The ID from the URL or body.
 * @param code - The not-found code to throw.
 * @returns Nothing.
 * @throws AppError with the given code when the ID is not a UUID.
 */
export function assertUuid(id: string, code: ErrorCode): void {
  if (!uuidSchema.safeParse(id).success) throw new AppError(code);
}

/**
 * Tells whether an error is a Postgres unique-constraint violation surfaced by Prisma.
 *
 * @param error - The thrown value.
 * @returns True for Prisma's P2002 error.
 */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Builds the validation error shown when a name is already taken.
 *
 * @param message - The message for the `name` field.
 * @returns The AppError to throw.
 */
export function nameTakenError(message: string): AppError {
  return new AppError("VALIDATION_ERROR", message, undefined, { name: [message] });
}
