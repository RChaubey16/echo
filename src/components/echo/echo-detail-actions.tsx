"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { Dropdown } from "@/components/ui/dropdown";
import { CalendarIcon, EditIcon, LayersIcon, MoreIcon, TrashIcon } from "@/components/ui/icons";
import { AddToCollection } from "./add-to-collection";
import { DeleteEchoDialog } from "./delete-echo-dialog";
import { FavoriteButton } from "./favorite-button";

type EchoDetailActionsProps = {
  echoId: string;
  isFavorite: boolean;
  collectionIds: string[];
};

/**
 * Brings the page's Revisit row into view and moves focus to its first control.
 *
 * @returns Nothing.
 */
function goToRevisit(): void {
  const row = document.getElementById("revisit-controls");
  row?.scrollIntoView({ block: "center" });
  row?.querySelector<HTMLElement>("button, a, input")?.focus({ preventScroll: true });
}

/**
 * The Echo detail toolbar's actions. From tablet up: the heart, Revisit, Add to collection, Edit
 * and Delete. On phones: the heart, Edit and a "More" menu holding the rest, so the row fits at
 * 320px. Each dialog exists once and opens from either place.
 */
export function EchoDetailActions({ echoId, isFavorite, collectionIds }: EchoDetailActionsProps) {
  const [dialog, setDialog] = useState<"collections" | "delete" | null>(null);
  const opener = (name: "collections" | "delete") => (open: boolean) =>
    setDialog(open ? name : null);

  return (
    <div className="flex items-center gap-0.5 tablet:gap-1">
      <FavoriteButton echoId={echoId} isFavorite={isFavorite} />
      {/* The wrappers own visibility: `hidden` on a button itself loses to its inline-flex. */}
      <span className="hidden tablet:contents">
        <button type="button" onClick={goToRevisit} className={buttonClasses("tertiary", "gap-2")}>
          <CalendarIcon className="h-4.5 w-4.5 shrink-0" />
          Revisit
        </button>
      </span>
      <AddToCollection
        echoId={echoId}
        collectionIds={collectionIds}
        open={dialog === "collections"}
        onOpenChange={opener("collections")}
        triggerWrapperClassName="hidden tablet:contents"
      />
      <Link
        href={`/app/echoes/${echoId}/edit`}
        className={buttonClasses("tertiary", "min-w-11 gap-2")}
      >
        <EditIcon className="h-4.5 w-4.5 shrink-0" />
        <span className="sr-only tablet:not-sr-only">Edit</span>
      </Link>
      <DeleteEchoDialog
        echoId={echoId}
        trigger="icon"
        open={dialog === "delete"}
        onOpenChange={opener("delete")}
        triggerWrapperClassName="hidden tablet:contents"
      />
      <span className="tablet:hidden">
        <Dropdown
          label="More actions for this Echo"
          triggerClassName={buttonClasses("tertiary", "w-11 px-0")}
          trigger={<MoreIcon className="h-5 w-5" />}
          items={[
            { label: "Revisit", icon: CalendarIcon, onSelect: goToRevisit },
            {
              label: collectionIds.length > 0 ? "Change collections" : "Add to collection",
              icon: LayersIcon,
              onSelect: () => setDialog("collections"),
            },
            {
              label: "Delete",
              icon: TrashIcon,
              danger: true,
              onSelect: () => setDialog("delete"),
            },
          ]}
        />
      </span>
    </div>
  );
}
