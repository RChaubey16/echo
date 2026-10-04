import "server-only";
import { after } from "next/server";

/**
 * Schedules work to run after the response is sent, or right away outside a Next.js request
 * (scripts and integration tests).
 *
 * @param task - The work to run; it must handle its own errors.
 * @returns Nothing.
 */
export function runAfterResponse(task: () => Promise<void>): void {
  try {
    after(task);
  } catch {
    void task();
  }
}
