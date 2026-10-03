"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertIcon, PlusIcon } from "@/components/ui/icons";
import { ApiError, api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { COLLECTION_NAME_MAX } from "@/server/validation/collection";
import type { CollectionDto } from "@/types/echo";
import { AccentDot } from "./accent-dot";

type CollectionChecklistProps = {
  collections: CollectionDto[];
  selected: readonly string[];
  onToggle: (collection: CollectionDto, checked: boolean) => void;
  /** Called with a collection made through the inline "New collection" row. */
  onCreated: (collection: CollectionDto) => void;
  status: "idle" | "loading" | "ready" | "error";
  onRetry: () => void;
  /** Collections whose change is still saving. */
  busy?: ReadonlySet<string>;
};

/**
 * The collection choices: a checkbox per collection (accent dot, name, count), then an inline
 * "New collection" row.
 */
export function CollectionChecklist({
  collections,
  selected,
  onToggle,
  onCreated,
  status,
  onRetry,
  busy,
}: CollectionChecklistProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const stopCreating = () => {
    setCreating(false);
    setName("");
    setError(null);
    requestAnimationFrame(() => newButtonRef.current?.focus());
  };

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Name your collection.");
    if (trimmed.length > COLLECTION_NAME_MAX) {
      return setError(`Name must be ${COLLECTION_NAME_MAX} characters or fewer.`);
    }
    setSaving(true);
    try {
      const collection = await api.createCollection({ name: trimmed });
      onCreated(collection);
      stopCreating();
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.fields.name?.[0]
          ? failure.fields.name[0]
          : "Couldn't create the collection. Try again.",
      );
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      {status === "loading" || status === "idle" ? (
        <div aria-busy="true" className="flex flex-col gap-2 px-4 py-2">
          <p className="sr-only" role="status">
            Loading your collections
          </p>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-6 animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : status === "error" ? (
        <div className="flex flex-col items-start gap-2 px-4 py-2">
          <p className="text-body-sm text-body">Couldn&apos;t load your collections.</p>
          <Button variant="tertiary" onClick={onRetry} className="text-button-sm">
            Try again
          </Button>
        </div>
      ) : collections.length === 0 ? (
        <p className="px-4 py-2 text-body-sm text-muted">No collections yet.</p>
      ) : (
        <fieldset className="min-w-0">
          <legend className="sr-only">Collections</legend>
          <ul className="grid grid-cols-1">
            {collections.map((collection) => {
              const checked = selected.includes(collection.id);
              return (
                <li key={collection.id} className="min-w-0">
                  <label
                    className={cn(
                      "flex h-11 cursor-pointer items-center gap-3 px-4 text-body-md text-ink transition-colors duration-fast ease-standard hover:bg-surface-soft",
                      busy?.has(collection.id) && "opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={busy?.has(collection.id)}
                      onChange={(event) => onToggle(collection, event.target.checked)}
                      className="h-4 w-4 shrink-0 accent-ink"
                    />
                    <AccentDot accent={collection.accent} />
                    <span className="min-w-0 flex-1 truncate" title={collection.name}>
                      {collection.name}
                    </span>
                    <span className="text-body-sm text-muted tabular-nums">
                      {collection.echoCount}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <div className="mt-1 border-t border-hairline-soft px-2 pt-2">
        {creating ? (
          <div className="flex flex-col gap-1.5 px-2 pb-1">
            <label htmlFor={`${id}-new`} className="text-caption text-muted">
              New collection
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id={`${id}-new`}
                autoFocus
                value={name}
                maxLength={COLLECTION_NAME_MAX + 20}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? `${id}-new-error` : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    void create();
                  } else if (event.key === "Escape") {
                    // Cancel the new row only; the popup or dialog stays open.
                    event.preventDefault();
                    event.stopPropagation();
                    stopCreating();
                  }
                }}
                placeholder="e.g. Morning pages"
                className={cn(
                  "h-10 min-w-0 flex-1 rounded-sm border bg-canvas px-3 text-body-md text-ink placeholder:text-muted focus:border-ink focus:outline-1 focus:-outline-offset-2 focus:outline-ink",
                  error ? "border-primary-error-text" : "border-border-input",
                )}
              />
              <Button size="sm" variant="secondary" loading={saving} onClick={() => void create()}>
                Create
              </Button>
            </div>
            {error && (
              <p
                id={`${id}-new-error`}
                className="flex items-start gap-1.5 text-body-sm text-primary-error-text"
              >
                <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        ) : (
          <button
            ref={newButtonRef}
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-11 w-full items-center gap-3 rounded-sm px-2 text-left text-body-md text-ink transition-colors duration-fast ease-standard hover:bg-surface-soft"
          >
            <PlusIcon className="h-4 w-4 shrink-0 text-muted" />
            New collection
          </button>
        )}
      </div>
    </div>
  );
}
