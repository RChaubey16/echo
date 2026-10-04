import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/echo/google-button";
import { LogoMark } from "@/components/echo/logo";
import { SkipLink } from "@/components/ui/skip-link";
import { publicPageMetadata } from "@/lib/site";
import { getSessionUser } from "@/server/auth";

export const metadata: Metadata = publicPageMetadata({
  title: "Sign in",
  description:
    "Sign in to Echo with Google to open your private library of quotes and reflections.",
  path: "/login",
});

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/app");

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <SkipLink />
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-12 focus-visible:outline-none"
      >
        <section className="flex w-full max-w-105 flex-col items-center gap-5 rounded-lg border border-hairline bg-canvas px-6 py-10 text-center tablet:gap-6 tablet:px-10 tablet:py-12">
          <h1 className="text-display-lg tracking-tight text-ink">
            <span className="sr-only">Sign in to </span>
            <Link
              href="/"
              className="group/logo flex flex-col items-center gap-3 rounded-md"
              aria-label="Echo home"
            >
              <LogoMark size="lg" />
              Echo
            </Link>
          </h1>
          <p className="text-body-md text-body">Welcome back. Your words are waiting.</p>
          <GoogleButton className="w-full" />
          <p className="text-body-sm text-muted">
            New here? Your account is created the first time you sign in.{" "}
            <Link href="/#privacy" className="text-primary underline underline-offset-4">
              How Echo keeps your library private
            </Link>
          </p>
          <p className="text-caption-sm text-muted">
            By continuing you agree to the{" "}
            <Link href="/terms" className="text-primary underline underline-offset-4">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-4">
              Privacy policy
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
