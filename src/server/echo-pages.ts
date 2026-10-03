import "server-only";
import { notFound } from "next/navigation";
import { AppError } from "@/server/http";
import { getEcho } from "@/server/services/echoes";
import type { EchoDto } from "@/types/echo";

/**
 * Loads one of the user's Echoes for a page, showing the 404 page when it is missing, deleted or
 * owned by someone else.
 *
 * @param userId - The signed-in user's ID.
 * @param id - The Echo ID from the URL.
 * @returns The Echo.
 */
export async function getEchoOrNotFound(userId: string, id: string): Promise<EchoDto> {
  try {
    return await getEcho(userId, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "ECHO_NOT_FOUND") notFound();
    throw error;
  }
}
