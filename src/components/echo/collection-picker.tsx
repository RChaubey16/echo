"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/use-dismiss";
import type { CollectionDto } from "@/types/echo";
import { AccentDot } from "./accent-dot";
import { CollectionChecklist } from "./collection-checklist";
import type { LibraryOptions } from "./use-library-options";

type CollectionPickerProps = {
  /** The id of the field's visible label, which names the trigger. */
  labelId: string;
  value: string[];
  onChange: (next: string[]) => void;
  options: LibraryOptions;
  disabled?: boolean;
};

/** The Collections field: a trigger listing the chosen collections, opening a checklist popover. */
export function CollectionPicker({
  labelId,
  value,
  onChange,
  options,
  disabled,
}: CollectionPickerProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => [triggerRef, panelRef], []);
  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);
  useDismiss(open, refs, close);

  const chosen = options.collections.filter((collection) => value.includes(collection.id));

  const toggle = (collection: CollectionDto, checked: boolean) =>
    onChange(checked ? [...value, collection.id] : value.filter((id) => id !== collection.id));

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-labelledby={`${labelId} ${panelId}-summary`}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center gap-2 rounded-sm border border-border-input bg-canvas px-3 py-2 text-left text-body-md text-ink focus-visible:border-ink focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-ink disabled:bg-surface-soft disabled:text-muted-soft"
      >
        <span id={`${panelId}-summary`} className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1">
          {chosen.length === 0 ? (
            <span className="text-muted">
              {value.length > 0 ? `${value.length} selected` : "Choose collections"}
            </span>
          ) : (
            chosen.map((collection) => (
              <span key={collection.id} className="flex max-w-full min-w-0 items-center gap-2">
                <AccentDot accent={collection.accent} />
                <span className="truncate" title={collection.name}>
                  {collection.name}
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform duration-base ease-standard motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="group"
          aria-labelledby={labelId}
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-80 origin-top animate-menu-in overflow-y-auto rounded-md bg-canvas py-2 shadow-float motion-reduce:animate-fade-in" // audit-ignore: 80 caps the panel at about six rows
        >
          <CollectionChecklist
            collections={options.collections}
            selected={value}
            onToggle={toggle}
            onCreated={(collection) => {
              options.addCollection(collection);
              onChange([...value, collection.id]);
            }}
            status={options.status}
            onRetry={options.retry}
          />
        </div>
      )}
    </div>
  );
}
