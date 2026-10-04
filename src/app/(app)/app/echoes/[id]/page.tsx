import type { Metadata } from "next";
import Link from "next/link";
import { AccentDot } from "@/components/echo/accent-dot";
import { AddToCollection } from "@/components/echo/add-to-collection";
import { DeleteEchoDialog } from "@/components/echo/delete-echo-dialog";
import { EchoRevisit } from "@/components/echo/echo-revisit";
import { FavoriteButton } from "@/components/echo/favorite-button";
import { FirstReflectionPrompt } from "@/components/echo/first-reflection-prompt";
import { QuoteText } from "@/components/echo/quote-text";
import { SavedDate } from "@/components/echo/saved-date";
import { buttonClasses } from "@/components/ui/button-classes";
import { ChipLink } from "@/components/ui/chip";
import { ArrowLeftIcon, CalendarIcon, EditIcon } from "@/components/ui/icons";
import { fullDate, relativeDate } from "@/lib/dates";
import { daysSince, track } from "@/server/analytics";
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
  track(user.id, "echo_opened", { daysSinceSaved: daysSince(echo.savedAt) });
  const promptReflection = await shouldPromptFirstReflection(user.id, echo, user.onboardedAt);
  const updated = echo.updatedAt.slice(0, 10) !== echo.savedAt.slice(0, 10);

  return (
    <div className="-mx-4 flex flex-col tablet:-mx-6 desktop:-mx-8">
      {/* The page toolbar: back to the Library, and the Echo's actions. */}
      <div className="flex items-center justify-between gap-2 border-b border-hairline-soft px-2 py-2 tablet:px-6 tablet:py-4 desktop:px-8">
        <Link
          href="/app/echoes"
          className="inline-flex h-11 min-w-11 items-center gap-1.5 rounded-md px-2 text-body-md font-medium text-body transition-colors duration-fast ease-standard hover:bg-surface-strong hover:text-ink"
        >
          <ArrowLeftIcon className="h-5 w-5 shrink-0" />
          <span className="sr-only tablet:not-sr-only">Library</span>
        </Link>
        <div className="flex items-center gap-0.5 tablet:gap-1">
          <FavoriteButton echoId={echo.id} isFavorite={echo.isFavorite} />
          {/* The wrapper owns visibility: `hidden` on the link itself loses to its inline-flex. */}
          <span className="hidden tablet:contents">
            <a href="#revisit" className={buttonClasses("tertiary", "gap-2")}>
              <CalendarIcon className="h-4.5 w-4.5 shrink-0" />
              Revisit
            </a>
          </span>
          <AddToCollection
            echoId={echo.id}
            collectionIds={echo.collections.map((collection) => collection.id)}
            className="min-w-11"
          />
          <Link
            href={`/app/echoes/${echo.id}/edit`}
            className={buttonClasses("tertiary", "min-w-11 gap-2")}
          >
            <EditIcon className="h-4.5 w-4.5 shrink-0" />
            <span className="sr-only tablet:not-sr-only">Edit</span>
          </Link>
          <DeleteEchoDialog echoId={echo.id} trigger="icon" />
        </div>
      </div>

      <article className="mx-auto flex w-full max-w-190 flex-col gap-7 px-6 pt-10 pb-12 tablet:gap-10 tablet:px-8 tablet:pt-20 tablet:pb-16">
        <figure className="flex flex-col gap-5 tablet:gap-7">
          <h1 className="sr-only">Echo</h1>
          <QuoteText size="hero">{echo.quote}</QuoteText>
          {(echo.author || echo.source) && (
            <figcaption className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 tablet:gap-x-3.5">
              <span aria-hidden className="h-px w-6 bg-border-input tablet:w-8" />
              <span className="text-title-md [overflow-wrap:anywhere] text-ink">
                {echo.author ?? echo.source}
              </span>
              {echo.author && echo.source && (
                <span className="col-start-2 text-body-sm [overflow-wrap:anywhere] text-muted">
                  {echo.source}
                </span>
              )}
            </figcaption>
          )}
        </figure>

        {promptReflection && <FirstReflectionPrompt echoId={echo.id} />}

        {echo.reflection && (
          <section
            aria-labelledby="reflection-heading"
            className="flex flex-col gap-2.5 rounded-lg border border-hairline bg-canvas p-6 tablet:px-8 tablet:py-7"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="reflection-heading" className="text-label text-muted uppercase">
                Reflection
              </h2>
              <time dateTime={echo.updatedAt} className="text-caption-sm text-muted">
                {fullDate(new Date(echo.updatedAt))}
              </time>
            </div>
            <p className="text-body-md user-text text-body">{echo.reflection}</p>
          </section>
        )}

        <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-3.5 text-body-md tablet:grid-cols-[8.75rem_minmax(0,1fr)] tablet:gap-x-6 tablet:gap-y-4.5">
          {echo.tags.length > 0 && (
            <>
              <dt className="pt-0.5 text-muted">Tags</dt>
              <dd>
                <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
                  {echo.tags.map((tag) => (
                    <li key={tag.id} className="max-w-full min-w-0">
                      <ChipLink size="sm" href={`/app/echoes?tag=${tag.id}`} title={tag.name}>
                        <span className="truncate">{tag.name}</span>
                      </ChipLink>
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          <dt className="text-muted">Collections</dt>
          <dd className="min-w-0">
            {echo.collections.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {echo.collections.map((collection) => (
                  <li key={collection.id} className="min-w-0">
                    <Link
                      href={`/app/collections/${collection.id}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-sm font-medium text-ink underline-offset-4 hover:underline"
                    >
                      <AccentDot accent={collection.accent} />
                      <span className="truncate" title={collection.name}>
                        {collection.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-body">None yet</span>
            )}
          </dd>
          {echo.mood && (
            <>
              <dt className="text-muted">Mood</dt>
              <dd className="min-w-0 [overflow-wrap:anywhere] text-ink">{echo.mood}</dd>
            </>
          )}
          <dt className="text-muted">Saved</dt>
          <dd className="text-ink">
            <time dateTime={echo.savedAt}>{fullDate(new Date(echo.savedAt))}</time>
            {updated && (
              <span className="text-muted">
                {" "}
                · updated {relativeDate(new Date(echo.updatedAt))}
              </span>
            )}
            <SavedDate savedAt={echo.savedAt} className="sr-only" />
          </dd>
          {/* Stacked on phones so the calendar gets the full width. */}
          <dt id="revisit-label" className="col-span-2 text-muted tablet:col-span-1">
            <span id="revisit" className="scroll-mt-24">
              Revisit
            </span>
          </dt>
          <dd className="col-span-2 min-w-0 tablet:col-span-1">
            <EchoRevisit
              echoId={echo.id}
              revisit={revisit}
              timeZone={user.timezone ?? undefined}
              labelledBy="revisit-label"
            />
          </dd>
        </dl>
      </article>
    </div>
  );
}
