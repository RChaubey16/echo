import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/echo/marketing-footer";
import { MarketingNav } from "@/components/echo/marketing-nav";
import { GoogleButton } from "@/components/echo/google-button";
import {
  CheckIcon,
  ClockIcon,
  LayersIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { SkipLink } from "@/components/ui/skip-link";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...publicPageMetadata({ description: SITE_DESCRIPTION, path: "/" }),
  title: { absolute: `${SITE_NAME} · ${SITE_TAGLINE}` },
};

const FEATURES = [
  {
    title: "Save in seconds",
    body: "Paste the words and go. Author, source and why it mattered can come later.",
    icon: PlusIcon,
  },
  {
    title: "Organize",
    body: "Gather Echoes into collections and tags that make sense to you.",
    icon: LayersIcon,
  },
  {
    title: "Find anything",
    body: "Search every word, including what you wrote about it.",
    icon: SearchIcon,
  },
  {
    title: "Rediscover",
    body: "Today's Echo and Revisits bring old words back when you might need them.",
    icon: ClockIcon,
  },
];

const PRIVACY_POINTS = [
  "Only you can see your Echoes and reflections.",
  "No profiles, followers, feeds or likes.",
  "Export everything, or delete it, whenever you like.",
];

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
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 py-14 tablet:px-10 tablet:py-24 desktop:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] desktop:gap-20 desktop:px-20 desktop:py-30">
          <div className="flex flex-col items-start gap-6 tablet:gap-8">
            {/* The tagline is set like a quote: the one place the serif appears outside a saved Echo. */}
            <h1 className="font-quote text-quote-display-sm text-balance text-ink tablet:text-quote-display">
              Words worth coming back to.
            </h1>
            <p className="max-w-130 text-body-md text-pretty text-body tablet:text-display-sm tablet:font-normal">
              A private library for the quotes that stay with you, and what they meant to you at the
              time.
            </p>
            <div className="flex flex-col items-start gap-3">
              <GoogleButton />
              <p className="text-body-sm text-muted">Private by design. No feed.</p>
            </div>
          </div>
          {/* An example of the product, not a real person's library. */}
          <figure
            aria-label="Example: Today's Echo"
            className="flex flex-col gap-5 rounded-lg bg-surface-soft p-6 tablet:p-10"
          >
            <p className="text-caption-sm font-semibold text-muted">Today&apos;s Echo</p>
            <blockquote className="font-quote text-quote-hero-sm text-ink tablet:text-quote-hero">
              &ldquo;Begin anywhere.&rdquo;
            </blockquote>
            <figcaption className="text-body-md font-semibold text-ink">John Cage</figcaption>
            <div className="rounded-md bg-canvas px-4 py-3.5 text-body-md text-body">
              <span className="mb-1 block text-label text-muted uppercase">You wrote</span>
              Maybe I should finally start.
            </div>
            <p className="text-caption-sm text-muted">Saved a year ago. Back today.</p>
          </figure>
        </section>

        <section aria-labelledby="features-heading" className="border-t border-hairline-soft">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-14 tablet:gap-12 tablet:px-10 tablet:py-20 desktop:px-20">
            <h2
              id="features-heading"
              className="max-w-160 text-display-lg text-ink tablet:text-display-xl"
            >
              Somewhere to keep them, and a way back to them.
            </h2>
            <ul className="grid grid-cols-1 gap-8 tablet:grid-cols-2 desktop:grid-cols-4 desktop:gap-10">
              {FEATURES.map(({ title, body, icon: Icon }) => (
                <li key={title} className="flex flex-col gap-3 border-t border-ink pt-5">
                  <Icon aria-hidden className="h-6 w-6 text-ink" />
                  <h3 className="text-title-md text-ink">{title}</h3>
                  <p className="text-body-md text-body">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="privacy"
          aria-labelledby="privacy-heading"
          className="px-5 pb-14 tablet:px-10 tablet:pb-20 desktop:px-20"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 rounded-lg bg-tint-moss p-7 tablet:p-14 desktop:grid-cols-2 desktop:gap-14">
            <div className="flex flex-col gap-3.5">
              <LockIcon aria-hidden className="h-7 w-7 text-mark-moss" />
              <h2 id="privacy-heading" className="text-display-lg text-ink tablet:text-display-xl">
                Private by design
              </h2>
            </div>
            <div className="flex flex-col gap-5">
              <ul className="flex flex-col gap-4 text-body-md text-body">
                {PRIVACY_POINTS.map((point) => (
                  <li key={point} className="flex gap-3">
                    <CheckIcon aria-hidden className="mt-1 h-5 w-5 shrink-0 text-mark-moss" />
                    {point}
                  </li>
                ))}
              </ul>
              <p className="text-body-sm text-body">
                Echo uses your Google account only to sign you in: your name, email address and
                profile picture, and nothing else.{" "}
                <Link href="/privacy" className="text-primary underline underline-offset-4">
                  Read the privacy policy
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
