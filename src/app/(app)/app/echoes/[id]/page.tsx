import type { Metadata } from "next";
import Link from "next/link";
import { AccentDot } from "@/components/echo/accent-dot";
import { AddToCollection } from "@/components/echo/add-to-collection";
import { DeleteEchoDialog } from "@/components/echo/delete-echo-dialog";
import { EchoRevisit } from "@/components/echo/echo-revisit";
import { FavoriteButton } from "@/components/echo/favorite-button";
import { FirstReflectionPrompt } from "@/components/echo/first-reflection-prompt";
import { QuoteText, attribution } from "@/components/echo/quote-text";
import { SavedDate } from "@/components/echo/saved-date";
import { buttonClasses } from "@/components/ui/button-classes";
import { ChipLink } from "@/components/ui/chip";
import { ArrowLeftIcon, EditIcon } from "@/components/ui/icons";
import { fullDate } from "@/lib/dates";
import { requireUserPage } from "@/server/auth";
import { getEchoOrNotFound } from "@/server/echo-pages";
import { getPendingRevisit } from "@/server/services/revisits";
import { shouldPromptFirstReflection } from "@/server/services/users";

export const metadata: Metadata = { title: "Echo" };

export default async function EchoDetailPage({ params }: PageProps<"/app/echoes/[id]">) {
  const [user, { id }] = await Promise.all([requireUserPage(), params]);
  const [echo, revisit] = await Promise.all([
    getEchoOrNotFound(user.id, id),
    getPendingRevisit(user.id, id),
  ]);
  const promptReflection = await shouldPromptFirstReflection(user.id, echo, user.onboardedAt);
  const credit = attribution(echo);
  const meta = [
    { label: "Author", value: echo.author },
    { label: "Source", value: echo.source },
    { label: "Mood", value: echo.mood },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col py-8 tablet:py-12">
      <Link
        href="/app/echoes"
        className="-ml-1 inline-flex h-11 items-center gap-1.5 self-start rounded-sm px-1 text-body-sm text-muted transition-colors duration-fast ease-standard hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Library
      </Link>

      <figure className="mt-6">
        <h1 className="sr-only">Echo</h1>
        <QuoteText size="hero">{echo.quote}</QuoteText>
        {credit && <figcaption className="mt-4 text-body-md text-muted">— {credit}</figcaption>}
      </figure>

      {promptReflection && <FirstReflectionPrompt echoId={echo.id} />}

      {echo.reflection && (
        <section
          aria-labelledby="reflection-heading"
          className="mt-8 rounded-md bg-tint-lagoon p-6"
        >
          <h2 id="reflection-heading" className="text-caption text-muted">
            Your reflection
          </h2>
          <p className="mt-2 text-body-md [overflow-wrap:anywhere] whitespace-pre-wrap text-body">
            {echo.reflection}
          </p>
        </section>
      )}

      {echo.tags.length > 0 && (
        <ul aria-label="Tags" className="mt-8 flex flex-wrap gap-2">
          {echo.tags.map((tag) => (
            <li key={tag.id} className="max-w-full min-w-0">
              <ChipLink href={`/app/echoes?tag=${tag.id}`} title={tag.name}>
                <span className="truncate">{tag.name}</span>
              </ChipLink>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-8 border-t border-hairline">
        {meta.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[6rem_1fr] gap-4 border-b border-hairline-soft py-3 text-body-md tablet:grid-cols-[8rem_1fr]"
          >
            <dt className="text-muted">{row.label}</dt>
            <dd className="min-w-0 [overflow-wrap:anywhere] text-ink">{row.value}</dd>
          </div>
        ))}
        <div className="grid grid-cols-[6rem_1fr] gap-4 border-b border-hairline-soft py-3 text-body-md tablet:grid-cols-[8rem_1fr]">
          <dt className="text-muted">Collections</dt>
          <dd className="flex min-w-0 flex-col items-start gap-2">
            {echo.collections.length > 0 && (
              <ul className="grid grid-cols-1 gap-1">
                {echo.collections.map((collection) => (
                  <li key={collection.id} className="min-w-0">
                    <Link
                      href={`/app/collections/${collection.id}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-xs text-ink underline-offset-4 hover:underline"
                    >
                      <AccentDot accent={collection.accent} />
                      <span className="truncate" title={collection.name}>
                        {collection.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <AddToCollection
              echoId={echo.id}
              collectionIds={echo.collections.map((collection) => collection.id)}
            />
          </dd>
        </div>
        {/* Stacked on phones so the calendar gets the full width. */}
        <div className="grid grid-cols-1 gap-2 border-b border-hairline-soft py-3 text-body-md tablet:grid-cols-[8rem_1fr] tablet:gap-4">
          <dt id="revisit-label" className="text-muted">
            Revisit
          </dt>
          <dd className="min-w-0">
            <EchoRevisit
              echoId={echo.id}
              revisit={revisit}
              timeZone={user.timezone ?? undefined}
              labelledBy="revisit-label"
            />
          </dd>
        </div>
        <div className="grid grid-cols-[6rem_1fr] gap-4 py-3 text-body-md tablet:grid-cols-[8rem_1fr]">
          <dt className="text-muted">Saved</dt>
          <dd className="text-ink">
            <time dateTime={echo.savedAt}>{fullDate(new Date(echo.savedAt))}</time>
            <SavedDate savedAt={echo.savedAt} className="sr-only" />
          </dd>
        </div>
      </dl>

      <div className="sticky bottom-16 -mx-4 mt-8 grid grid-cols-3 gap-2 border-t border-hairline bg-canvas p-4 tablet:static tablet:mx-0 tablet:flex tablet:gap-3 tablet:border-0 tablet:bg-transparent tablet:p-0">
        <FavoriteButton
          echoId={echo.id}
          isFavorite={echo.isFavorite}
          variant="labelled"
          className="justify-center px-3 tablet:px-5"
        />
        <Link
          href={`/app/echoes/${echo.id}/edit`}
          className={buttonClasses("secondary", "px-3 tablet:px-6")}
        >
          <EditIcon className="h-5 w-5 shrink-0" />
          Edit
        </Link>
        <DeleteEchoDialog echoId={echo.id} className="px-3 tablet:px-6" />
      </div>
    </article>
  );
}
