"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import {
  AlertIcon,
  CheckIcon,
  EditIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, failureMessage } from "@/lib/api";
import type { CollectionDto, EchoDto } from "@/types/echo";
import { CollectionFormDialog } from "./collection-form-dialog";
import { QuoteText, attribution } from "./quote-text";

type CollectionActionsProps = {
  collection: Pick<CollectionDto, "id" | "name" | "description">;
};

/** The collection page's actions: Add Echoes, and Rename / Delete in a "More" menu. */
export function CollectionActions({ collection }: CollectionActionsProps) {
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const router = useRouter();
  const toast = useToast();
  const close = () => setDialog(null);

  return (
    <div className="flex items-center gap-2">
      <AddEchoesButton collectionId={collection.id} />
      <Dropdown
        label="More actions for this collection"
        triggerClassName="flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-canvas text-ink transition-colors duration-fast ease-standard hover:bg-surface-soft"
        trigger={<MoreIcon className="h-5 w-5" />}
        items={[
          { label: "Rename", icon: EditIcon, onSelect: () => setDialog("rename") },
          {
            label: "Delete collection",
            icon: TrashIcon,
            danger: true,
            onSelect: () => setDialog("delete"),
          },
        ]}
      />
      <CollectionFormDialog
        open={dialog === "rename"}
        onClose={close}
        collection={collection}
        onSaved={() => {
          toast({ message: "Changes saved" });
          router.refresh();
        }}
      />
      <DeleteCollectionDialog
        collectionId={collection.id}
        open={dialog === "delete"}
        onClose={close}
      />
    </div>
  );
}

/**
 * The delete confirmation. Deleting a collection keeps its Echoes, and the copy says so.
 *
 * @param props - The collection id, whether the dialog is open, and its close handler.
 * @returns The dialog.
 */
function DeleteCollectionDialog({
  collectionId,
  open,
  onClose,
}: {
  collectionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const close = () => {
    if (deleting) return;
    setFailure(null);
    onClose();
  };

  const onDelete = async () => {
    setDeleting(true);
    setFailure(null);
    try {
      await api.deleteCollection(collectionId);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) {
        setDeleting(false);
        setFailure(failureMessage(error, "Couldn't delete this collection."));
        return;
      }
    }
    toast({ message: "Collection deleted. Its Echoes are still in your library." });
    router.push("/app/collections");
    router.refresh();
  };

  return (
    <Dialog open={open} onRequestClose={close} labelledBy={titleId} initialFocusRef={cancelRef}>
      <h2 id={titleId} className="text-display-sm text-ink">
        Delete this collection?
      </h2>
      <p className="mt-2 text-body-md text-body">
        Its Echoes are kept in your library. Only the collection goes.
      </p>
      {failure && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-1.5 text-body-sm text-primary-error-text"
        >
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {failure}
        </p>
      )}
      <div className="mt-6 flex gap-3 tablet:justify-end">
        <Button
          ref={cancelRef}
          variant="secondary"
          className="flex-1 tablet:flex-none"
          onClick={close}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          className="flex-1 tablet:flex-none"
          loading={deleting}
          loadingLabel="Deleting…"
          onClick={onDelete}
        >
          Delete collection
        </Button>
      </div>
    </Dialog>
  );
}

/** "Add Echoes": a dialog that searches the library and adds or removes each Echo at once. */
export function AddEchoesButton({ collectionId }: { collectionId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EchoDto[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [inCollection, setInCollection] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const changed = useRef(false);
  const inflight = useRef(new Set<Promise<unknown>>());

  // Searches as the user types, 250ms after the last keystroke; the latest query wins.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(
      () => {
        const params: Record<string, string> = { limit: "20" };
        if (query.trim()) params.search = query.trim();
        api
          .listEchoes(params)
          .then((page) => {
            if (cancelled) return;
            setFailed(false);
            setResults(page.items);
            setInCollection((current) => {
              const next = new Set(current);
              for (const echo of page.items) {
                if (echo.collections.some((c) => c.id === collectionId)) next.add(echo.id);
              }
              return next;
            });
          })
          .catch(() => !cancelled && setFailed(true));
      },
      query ? 250 : 0,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query, collectionId]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults(null);
    if (changed.current) {
      changed.current = false;
      // Refresh once the last add or remove has reached the server.
      void Promise.allSettled([...inflight.current]).then(() => router.refresh());
    }
  };

  const toggle = async (echo: EchoDto) => {
    const adding = !inCollection.has(echo.id);
    const flip = (set: ReadonlySet<string>, add: boolean) => {
      const next = new Set(set);
      if (add) next.add(echo.id);
      else next.delete(echo.id);
      return next;
    };
    setBusy((current) => flip(current, true));
    setInCollection((current) => flip(current, adding));
    // Marked up front: Done may be pressed before the request settles, and must still refresh.
    changed.current = true;
    const call = adding
      ? api.addToCollection(collectionId, echo.id)
      : api.removeFromCollection(collectionId, echo.id);
    inflight.current.add(call);
    try {
      await call;
    } catch (error) {
      setInCollection((current) => flip(current, !adding));
      toast({ message: failureMessage(error, "Couldn't update this collection.") });
    } finally {
      inflight.current.delete(call);
      setBusy((current) => flip(current, false));
    }
  };

  return (
    <>
      <button
        type="button"
        className={buttonClasses("secondary", "gap-2")}
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="h-5 w-5 shrink-0" />
        Add Echoes
      </button>
      <Dialog
        open={open}
        onRequestClose={close}
        labelledBy={titleId}
        initialFocusRef={searchRef}
        size="lg"
      >
        <h2 id={titleId} className="text-display-sm text-ink">
          Add Echoes
        </h2>
        <div role="search" className="mt-4">
          <label htmlFor={`${titleId}-search`} className="sr-only">
            Search your library
          </label>
          <div className="flex h-12 items-center gap-2 rounded-full border border-border-input bg-canvas px-4 focus-within:border-ink focus-within:outline-1 focus-within:-outline-offset-2 focus-within:outline-ink">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
            <input
              ref={searchRef}
              id={`${titleId}-search`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by words, author or tag"
              className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted focus-visible:outline-none" // audit-ignore: the wrapper draws the focus outline (focus-within)
            />
          </div>
        </div>

        <div className="mt-4 min-h-48" aria-live="polite" aria-busy={results === null && !failed}>
          {failed ? (
            <p className="py-8 text-center text-body-md text-body">
              Couldn&apos;t load your library. Check your connection and try again.
            </p>
          ) : results === null ? (
            <div className="flex flex-col gap-4 py-2">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-10" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-body-md text-body">
              {query.trim() ? `No Echoes match "${query.trim()}".` : "Your library is empty."}
            </p>
          ) : (
            <ul className="grid grid-cols-1 divide-y divide-hairline-soft">
              {results.map((echo) => {
                const added = inCollection.has(echo.id);
                const credit = attribution(echo);
                return (
                  <li key={echo.id} className="flex min-w-0 items-center gap-4 py-3">
                    <figure className="min-w-0 flex-1">
                      <QuoteText size="compact" className="line-clamp-2">
                        {echo.quote}
                      </QuoteText>
                      {credit && (
                        <figcaption
                          className="mt-1 truncate text-body-sm text-muted"
                          title={credit}
                        >
                          — {credit}
                        </figcaption>
                      )}
                    </figure>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-pressed={added}
                      disabled={busy.has(echo.id)}
                      onClick={() => void toggle(echo)}
                      aria-label={
                        added ? "Added. Remove from this collection" : "Add to this collection"
                      }
                      className="w-28 shrink-0"
                    >
                      {added ? (
                        <>
                          <CheckIcon className="h-4 w-4 shrink-0" />
                          Added
                        </>
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-6 flex tablet:justify-end">
          <Button variant="secondary" className="flex-1 tablet:flex-none" onClick={close}>
            Done
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** The "Remove" action on an Echo card inside a collection; the Echo stays in the library. */
export function RemoveFromCollectionButton({
  collectionId,
  echoId,
}: {
  collectionId: string;
  echoId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [removing, setRemoving] = useState(false);
  return (
    <Button
      variant="tertiary"
      aria-label="Remove from this collection"
      className="h-11 px-1"
      loading={removing}
      loadingLabel="Removing…"
      onClick={async () => {
        setRemoving(true);
        try {
          await api.removeFromCollection(collectionId, echoId);
          toast({ message: "Removed from this collection" });
          router.refresh();
        } catch (error) {
          setRemoving(false);
          toast({ message: failureMessage(error, "Couldn't remove this Echo.") });
        }
      }}
    >
      Remove
    </Button>
  );
}
