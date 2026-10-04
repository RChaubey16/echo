import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountNameForm } from "@/components/echo/account-name-form";
import { AppearancePicker } from "@/components/echo/appearance-picker";
import { DeleteAccountDialog } from "@/components/echo/delete-account-dialog";
import { ExportData } from "@/components/echo/export-data";
import { UserIcon } from "@/components/ui/icons";
import { requireUserPage } from "@/server/auth";

export const metadata: Metadata = { title: "Settings" };

const SHORTCUTS: Array<{ keys: string[]; action: string }> = [
  { keys: ["N"], action: "Add an Echo" },
  { keys: ["/"], action: "Search your library" },
  { keys: ["Ctrl", "Enter"], action: "Save the Echo you're writing (⌘ Enter on a Mac)" },
  { keys: ["Esc"], action: "Close a dialog or menu" },
];

/** One Settings section: a heading and its content, separated from the next by a hairline. */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-hairline py-8">
      <h2 id={id} className="text-display-sm text-ink">
        {title}
      </h2>
      {description && <p className="mt-1 text-body-md text-body">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUserPage();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col py-8 tablet:py-12">
      <h1 className="pb-8 text-display-lg text-ink">Settings</h1>

      <Section id="account-heading" title="Account">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={56}
              height={56}
              unoptimized
              referrerPolicy="no-referrer"
              className="h-14 w-14 shrink-0 rounded-full bg-surface-strong"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-strong text-muted">
              <UserIcon className="h-6 w-6" />
            </span>
          )}
          <p className="min-w-0 text-body-sm text-muted">
            Your photo and email come from your Google account. Change them there.
          </p>
        </div>
        <div className="mt-6">
          <AccountNameForm name={user.name} />
        </div>
        <dl className="mt-6 grid grid-cols-1 gap-1.5">
          <dt className="text-caption text-muted">Email</dt>
          <dd className="text-body-md [overflow-wrap:anywhere] text-ink">{user.email}</dd>
        </dl>
      </Section>

      <Section
        id="appearance-heading"
        title="Appearance"
        description="Choose how Echo looks. System follows your device's light or dark setting."
      >
        <AppearancePicker stored={user.theme} />
      </Section>

      <Section id="shortcuts-heading" title="Keyboard shortcuts">
        <dl className="grid grid-cols-1">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.action}
              className="grid grid-cols-[7rem_1fr] items-center gap-4 border-b border-hairline-soft py-3 last:border-b-0"
            >
              <dt className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-xs border border-hairline bg-surface-soft px-2 font-sans text-caption text-ink"
                  >
                    {key}
                  </kbd>
                ))}
              </dt>
              <dd className="text-body-md text-body">{shortcut.action}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-body-sm text-muted">
          Shortcuts don&apos;t fire while you&apos;re typing in a field.
        </p>
      </Section>

      <Section id="privacy-heading" title="Privacy">
        <div className="flex flex-col gap-3 text-body-md text-body">
          <p>
            Echo stores what you save: each quote, its author and source, your reflections, tags,
            collections and Revisit dates, plus your name, email and photo from Google.
          </p>
          <p>
            Your Echoes are never public. Only you can see them, and nothing you save is shared or
            published.
          </p>
          <p>
            Echo counts how features are used, such as &ldquo;an Echo was saved&rdquo; or how many
            results a search found, to learn what helps. These counts never include the text of your
            quotes, reflections or searches, and error reports are scrubbed of it too.
          </p>
          <p>
            <Link
              href="/privacy"
              className="text-primary underline underline-offset-4 hover:decoration-2"
            >
              Read the privacy policy
            </Link>
          </p>
        </div>
      </Section>

      <Section id="notifications-heading" title="Notifications">
        <p className="text-body-md text-body">
          Coming soon. For now, Echo doesn&apos;t send anything; Revisits wait for you in the app.
        </p>
      </Section>

      <Section id="data-heading" title="Your data">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <h3 className="text-body-md text-ink">Export your Echoes</h3>
              <p className="text-body-sm text-muted">
                Download everything you&apos;ve saved, with tags, collections, reflections and
                Revisits. JSON keeps it all; CSV opens in a spreadsheet.
              </p>
            </div>
            <ExportData />
          </div>
          <div className="flex flex-col gap-3 border-t border-hairline-soft pt-8 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="min-w-0">
              <h3 className="text-body-md text-ink">Delete your account</h3>
              <p className="text-body-sm text-muted">
                Permanently remove your account and every Echo. This can&apos;t be undone.
              </p>
            </div>
            <DeleteAccountDialog email={user.email} />
          </div>
        </div>
      </Section>
    </div>
  );
}
