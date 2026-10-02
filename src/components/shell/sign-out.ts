"use server";

import { signOut } from "@/server/auth";

/**
 * Ends the database session and returns the user to the sign-in page.
 *
 * @returns Nothing; redirects to /login.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
