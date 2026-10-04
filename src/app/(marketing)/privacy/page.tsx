import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalList, LegalPage, LegalSection } from "@/components/echo/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Echo stores, who can see it, and how to take it with you or delete it.",
};

const inlineLink = "text-primary underline underline-offset-4 hover:decoration-2";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="October 4, 2026">
      <p className="text-body-md text-body">
        Echo is a private library for the quotes that stay with you. Your Echoes are yours: only you
        can see them, nothing is ever published, and you can export or delete everything at any
        time.
      </p>

      <LegalSection title="Signing in with Google">
        <p>
          Echo uses Google only to sign you in. When you continue with Google we receive your name,
          email address and profile photo, and nothing else: no contacts, no files, no calendar.
          Your first sign-in creates your account.
        </p>
      </LegalSection>

      <LegalSection title="What Echo stores">
        <LegalList
          items={[
            "Your account: name, email address, profile photo link, time zone and theme choice.",
            "What you save: each quote with its author, source, mood and reflection; your tags and collections; favorites; and Revisit dates.",
            "A sign-in session, so you stay signed in. It is kept in a secure, HTTP-only cookie.",
          ]}
        />
        <p>
          Your data is stored in a PostgreSQL database hosted by Supabase and served by Vercel.
          Connections are encrypted. Echo doesn&apos;t sell or share your library, and it never
          reads your Echoes except to show them to you.
        </p>
      </LegalSection>

      <LegalSection title="Analytics">
        <p>
          Echo records simple usage events, such as &ldquo;an Echo was saved&rdquo;, &ldquo;a search
          returned 4 results&rdquo; or how many days old an opened Echo is, using PostHog (EU
          cloud). Events are tied to a random account ID, not your name or email. They never include
          the text of your quotes, reflections or searches. There is no session recording and no
          advertising tracking.
        </p>
      </LegalSection>

      <LegalSection title="Error reports">
        <p>
          When something breaks, Echo sends an error report to Sentry so it can be fixed. Reports
          are scrubbed before they leave Echo: no request bodies, cookies, quote or reflection text,
          search terms or identity.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Echo sets two cookies: your sign-in session and your Appearance choice. There are no
          advertising or third-party tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="No backups">
        <p>
          Echo doesn&apos;t keep backups of your library. When you delete an Echo or your account,
          it is gone at once and no copy remains anywhere. It also means that if the database ever
          failed, your library couldn&apos;t be recovered, so download your data from Settings from
          time to time if you want to keep it safe.
        </p>
      </LegalSection>

      <LegalSection title="Exporting and deleting your data">
        <p>
          In{" "}
          <Link href="/app/settings" className={inlineLink}>
            Settings
          </Link>{" "}
          › Your data you can download everything you&apos;ve saved as JSON or CSV, and permanently
          delete your account. Deleting your account removes your Echoes (including ones you deleted
          earlier), tags, collections, Revisits and sign-in right away, asks PostHog to delete your
          usage events, and revokes Echo&apos;s access to your Google account.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          If this policy changes in a way that matters, the date at the top changes and Echo will
          tell you in the app.
        </p>
        <ContactLine />
      </LegalSection>
    </LegalPage>
  );
}
