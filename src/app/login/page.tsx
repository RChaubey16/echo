import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/echo/logo";
import { buttonClasses } from "@/components/ui/button-classes";
import { GoogleIcon } from "@/components/ui/icons";
import { SkipLink } from "@/components/ui/skip-link";
import { publicPageMetadata } from "@/lib/site";
import { getSessionUser, signIn } from "@/server/auth";

export const metadata: Metadata = publicPageMetadata({
  title: "Sign in",
  description:
    "Sign in to Echo with Google to open your private library of quotes and reflections.",
  path: "/login",
});

/**
 * Starts the Google OAuth flow and lands the user on /app afterwards.
 *
 * @returns Nothing; redirects to Google.
 */
async function signInWithGoogle(): Promise<void> {
  "use server";
  await signIn("google", { redirectTo: "/app" });
}

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/app");

  return (
    <div className="flex min-h-dvh flex-col bg-surface-soft text-ink">
      <SkipLink />
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-12 focus-visible:outline-none"
      >
        <section className="w-full max-w-sm rounded-md border border-hairline-soft bg-canvas px-6 py-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm text-ink"
            aria-label="Echo home"
          >
            <LogoMark className="h-12 w-12" />
          </Link>
          <h1 className="mt-6 text-display-lg text-ink">Sign in to Echo</h1>
          <p className="mt-2 text-body-md text-body">Words worth coming back to.</p>
          <form action={signInWithGoogle} className="mt-8">
            <button type="submit" className={buttonClasses("secondary", "w-full")}>
              <GoogleIcon className="h-5 w-5 shrink-0" />
              Continue with Google
            </button>
          </form>
          <p className="mt-6 text-body-sm text-muted">
            New here? Your account is created the first time you sign in.{" "}
            <Link
              href="/#privacy"
              className="text-primary underline underline-offset-4 hover:decoration-2"
            >
              How Echo keeps your library private
            </Link>
          </p>
          <p className="mt-4 text-caption text-muted">
            By continuing you agree to the{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-ink">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
              privacy policy
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
