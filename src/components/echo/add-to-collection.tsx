"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { LayersIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { CollectionDto } from "@/types/echo";
import { CollectionChecklist } from "./collection-checklist";
import { useLibraryOptions } from "./use-library-options";

type AddToCollectionProps = {
  echoId: string;
  /** The collections the Echo is in now. */
  collectionIds: string[];
  className?: string;
  /** Opens the dialog from outside (e.g. a menu); pair with onOpenChange. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Classes for a wrapper around the trigger only, e.g. to hide it on phones. */
  triggerWrapperClassName?: string;
};

/** "Add to collection" on the Echo detail page: each checkbox adds or removes the Echo at once. */
export function AddToCollection({
  echoId,
  collectionIds,
  className,
  open: openProp,
  onOpenChange,
  triggerWrapperClassName,
}: AddToCollectionProps) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const doneRef = useRef<HTMLButtonElement>(null);
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => (onOpenChange ? onOpenChange(next) : setInnerOpen(next));
  const [selected, setSelected] = useState(collectionIds);
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const changed = useRef(false);
  const inflight = useRef(new Set<Promise<unknown>>());
  const options = useLibraryOptions(open);

  const close = () => {
    setOpen(false);
    if (changed.current) {
      changed.current = false;
      // Refresh once the last add or remove has reached the server.
      void Promise.allSettled([...inflight.current]).then(() => router.refresh());
    }
  };

  const toggle = async (collection: CollectionDto, checked: boolean) => {
    setBusy((current) => new Set(current).add(collection.id));
    setSelected((current) =>
      checked ? [...current, collection.id] : current.filter((id) => id !== collection.id),
    );
    // Marked up front: Done may be pressed before the request settles, and must still refresh.
    changed.current = true;
    const call = checked
      ? api.addToCollection(collection.id, echoId)
      : api.removeFromCollection(collection.id, echoId);
    inflight.current.add(call);
    try {
      options.addCollection(await call);
    } catch (error) {
      setSelected((current) =>
        checked ? current.filter((id) => id !== collection.id) : [...current, collection.id],
      );
      toast({ message: failureMessage(error, `Couldn't update ${collection.name}.`) });
    } finally {
      inflight.current.delete(call);
      setBusy((current) => {
        const next = new Set(current);
        next.delete(collection.id);
        return next;
      });
    }
  };

  return (
    <>
      <span className={triggerWrapperClassName}>
        <Button variant="tertiary" className={cn("gap-2", className)} onClick={() => setOpen(true)}>
          <LayersIcon className="h-4.5 w-4.5 shrink-0" />
          {collectionIds.length > 0 ? "Change collections" : "Add to collection"}
        </Button>
      </span>
      <Dialog open={open} onRequestClose={close} labelledBy={titleId} initialFocusRef={doneRef}>
        <h2 id={titleId} className="text-display-sm text-ink">
          Add to collection
        </h2>
        <p className="mt-2 text-body-md text-body">Changes save as you tick each one.</p>
        <div className="-mx-4 mt-4">
          <CollectionChecklist
            collections={options.collections}
            selected={selected}
            onToggle={(collection, checked) => void toggle(collection, checked)}
            onCreated={(collection) => {
              options.addCollection(collection);
              void toggle(collection, true);
            }}
            status={options.status}
            onRetry={options.retry}
            busy={busy}
          />
        </div>
        <div className="mt-6 flex tablet:justify-end">
          <Button
            ref={doneRef}
            variant="secondary"
            className="flex-1 tablet:flex-none"
            onClick={close}
          >
            Done
          </Button>
        </div>
      </Dialog>
    </>
  );
}
