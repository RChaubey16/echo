import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/echo/marketing-footer";
import { MarketingNav } from "@/components/echo/marketing-nav";
import { SkipLink } from "@/components/ui/skip-link";

/** The contact address shown on the legal pages; set NEXT_PUBLIC_CONTACT_EMAIL in production. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null;

/** A long-form legal page (privacy, terms) at reading width, with the marketing nav and footer. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  /** The date the text last changed, e.g. "October 4, 2026". */
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <SkipLink />
      <MarketingNav />
      <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
        <article className="mx-auto w-full max-w-3xl px-4 py-12 tablet:px-6 tablet:py-16">
          <h1 className="text-display-xl text-ink">{title}</h1>
          <p className="mt-2 text-body-sm text-muted">Last updated {updated}</p>
          <div className="mt-8 flex flex-col gap-12">{children}</div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}

/** One titled section of a legal page. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-body-md text-body">
      <h2 className="text-display-sm text-ink">{title}</h2>
      {children}
    </section>
  );
}

/** A bulleted list inside a legal section. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/** How to reach the person who runs Echo, or the in-app route when no address is set. */
export function ContactLine() {
  return CONTACT_EMAIL ? (
    <p>
      Questions or requests:{" "}
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="text-primary underline underline-offset-4 hover:decoration-2"
      >
        {CONTACT_EMAIL}
      </a>
      .
    </p>
  ) : (
    <p>Questions or requests: use the contact address on Echo&apos;s Google sign-in screen.</p>
  );
}
