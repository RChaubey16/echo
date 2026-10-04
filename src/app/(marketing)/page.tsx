import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/echo/marketing-footer";
import { MarketingNav } from "@/components/echo/marketing-nav";
import { buttonClasses } from "@/components/ui/button-classes";
import { SkipLink } from "@/components/ui/skip-link";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...publicPageMetadata({ description: SITE_DESCRIPTION, path: "/" }),
  title: { absolute: `${SITE_NAME} · ${SITE_TAGLINE}` },
};

export default async function LandingPage({ searchParams }: PageProps<"/">) {
  // Set by the Delete account dialog after the account is gone.
  const goodbye = (await searchParams).goodbye === "1";
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <SkipLink />
      <MarketingNav />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col focus-visible:outline-none">
        {goodbye && (
          <div className="border-b border-hairline bg-surface-soft">
            <p
              role="status"
              className="mx-auto max-w-3xl px-4 py-4 text-center text-body-md text-ink tablet:px-6"
            >
              Your account and everything in it have been deleted. Thank you for using Echo.
            </p>
          </div>
        )}
        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center tablet:px-6">
          <h1 className="font-quote text-quote-hero text-ink">Words worth coming back to.</h1>
          <p className="mt-4 max-w-md text-body-md text-body">
            Echo is a private library for the quotes that stay with you, and what they meant to you
            at the time.
          </p>
          <Link href="/login" className={buttonClasses("primary", "mt-8")}>
            Sign in to Echo
          </Link>
        </section>
        <section
          id="privacy"
          aria-labelledby="privacy-heading"
          className="border-t border-hairline bg-surface-soft"
        >
          <div className="mx-auto max-w-3xl px-4 py-12 tablet:px-6 tablet:py-16">
            <h2 id="privacy-heading" className="text-display-sm text-ink">
              Private by default
            </h2>
            <p className="mt-2 text-body-md text-body">
              Your Echoes are visible only to you. Echo uses your Google account only to sign you
              in: we read your name, email address and profile picture, and nothing else. We never
              sell or share your library.{" "}
              <Link
                href="/privacy"
                className="text-primary underline underline-offset-4 hover:decoration-2"
              >
                Read the privacy policy
              </Link>
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
