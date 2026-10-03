import type { Metadata } from "next";
import Link from "next/link";
import { EchoRow } from "@/components/echo/echo-row";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { buttonClasses } from "@/components/ui/button-classes";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteMarksIcon } from "@/components/ui/icons";
import { requireUserPage } from "@/server/auth";
import { listEchoes } from "@/server/services/echoes";

export const metadata: Metadata = { title: "Home" };

// The full dashboard (Today's Echo, revisits, favorites) arrives in Phase 4. Until then Home shows
// the first-run state, or the five most recent Echoes.
export default async function HomePage() {
  const user = await requireUserPage();
  const recent = await listEchoes(user.id, { page: 1, limit: 5, sort: "newest" });

  if (recent.total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <EmptyState
          headingLevel="h1"
          icon={<QuoteMarksIcon className="h-12 w-12" />}
          title="Welcome to Echo."
          body="Save the words you don't want to forget."
          action={
            <AddEchoLink className={buttonClasses("primary")}>Add your first Echo</AddEchoLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-8 tablet:py-12">
      <h1 className="text-display-lg text-ink">Home</h1>
      <section
        aria-labelledby="recent-heading"
        className="rounded-md border border-hairline-soft bg-canvas p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-heading" className="text-title-md text-ink">
            Recently added
          </h2>
          <Link
            href="/app/echoes"
            className="text-body-sm text-primary underline-offset-4 hover:underline"
          >
            View library
          </Link>
        </div>
        <ul className="mt-2 grid grid-cols-1">
          {recent.items.map((echo) => (
            <li key={echo.id} className="min-w-0">
              <EchoRow echo={echo} monogram />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
