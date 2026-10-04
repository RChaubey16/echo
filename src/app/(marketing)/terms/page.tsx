import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalList, LegalPage, LegalSection } from "@/components/echo/legal-page";
import { publicPageMetadata } from "@/lib/site";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms of use",
  description: "The simple rules for using Echo.",
  path: "/terms",
});

const inlineLink = "text-primary underline underline-offset-4 hover:decoration-2";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="October 4, 2026">
      <p className="text-body-md text-body">
        By signing in to Echo you agree to these terms. They are short on purpose.
      </p>

      <LegalSection title="Your account">
        <p>
          You sign in with your Google account and are responsible for keeping it secure. One person
          per account.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          Everything you save stays yours. Echo stores it only to show it back to you, as described
          in the{" "}
          <Link href="/privacy" className={inlineLink}>
            privacy policy
          </Link>
          . Quotes belong to their authors; Echo is a personal library, not a place to publish them.
        </p>
      </LegalSection>

      <LegalSection title="Fair use">
        <LegalList
          items={[
            "Don't try to access other people's accounts or data.",
            "Don't overload, probe or attack the service. Requests are rate limited.",
            "Don't use Echo for anything illegal.",
          ]}
        />
      </LegalSection>

      <LegalSection title="The service">
        <p>
          Echo is provided as is, without warranties. Echo keeps no backups, so keep your own copy
          of anything you can&apos;t lose: you can export your data from Settings at any time. Echo
          may change or end; if it ends, you will have time to export first.
        </p>
      </LegalSection>

      <LegalSection title="Ending your account">
        <p>
          You can delete your account at any time from Settings, which permanently deletes
          everything you&apos;ve saved. An account used to break these terms may be closed.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
