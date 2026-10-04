"use server";

import { signIn } from "@/server/auth";

/**
 * Starts the Google OAuth flow and lands the user on /app afterwards. Shared by the landing page
 * and the sign-in page.
 *
 * @returns Nothing; redirects to Google.
 */
export async function signInWithGoogle(): Promise<void> {
  await signIn("google", { redirectTo: "/app" });
}
