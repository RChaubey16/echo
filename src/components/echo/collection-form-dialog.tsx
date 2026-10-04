"use client";

import { useId, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CharacterCount, FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { AlertIcon } from "@/components/ui/icons";
import { ApiError, api, failureMessage } from "@/lib/api";
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_NAME_MAX,
  collectionCreateSchema,
} from "@/server/validation/collection";
import type { CollectionDto } from "@/types/echo";

type CollectionFormDialogProps = {
  open: boolean;
  onClose: () => void;
  /** The collection being renamed; omit to create a new one. */
  collection?: Pick<CollectionDto, "id" | "name" | "description">;
  /** Called with the saved collection before the dialog closes. */
  onSaved: (collection: CollectionDto) => void;
};

type Errors = { name?: string; description?: string };

/** New collection / Rename collection: a name and an optional description. */
export function CollectionFormDialog({ open, onClose, ...rest }: CollectionFormDialogProps) {
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog open={open} onRequestClose={onClose} labelledBy={titleId} initialFocusRef={nameRef}>
      {/* Mounted only while open, so every opening starts from the collection's saved values. */}
      <CollectionForm titleId={titleId} nameRef={nameRef} onClose={onClose} {...rest} />
    </Dialog>
  );
}

/**
 * The form inside CollectionFormDialog.
 *
 * @param props - The dialog's props plus the title id and the name field's ref.
 * @returns The form.
 */
function CollectionForm({
  titleId,
  nameRef,
  onClose,
  collection,
  onSaved,
}: Omit<CollectionFormDialogProps, "open"> & {
  titleId: string;
  nameRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (saving) return;
    setFailure(null);
    const parsed = collectionCreateSchema.safeParse({ name, description });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      requestAnimationFrame(() => (next.name ? nameRef : descriptionRef).current?.focus());
      return;
    }
    setSaving(true);
    try {
      const saved = collection
        ? await api.updateCollection(collection.id, parsed.data)
        : await api.createCollection(parsed.data);
      onSaved(saved);
      onClose();
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && (error.fields.name || error.fields.description)) {
        setErrors({ name: error.fields.name?.[0], description: error.fields.description?.[0] });
        requestAnimationFrame(() => nameRef.current?.focus());
        return;
      }
      setFailure(failureMessage(error, "Couldn't save this collection."));
    }
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        // Stop the submit from reaching a form this dialog was opened from (e.g. EchoForm).
        event.stopPropagation();
        void onSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <h2 id={titleId} className="text-display-sm text-ink">
        {collection ? "Rename collection" : "New collection"}
      </h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-name`}>Name</Label>
          <Input
            ref={nameRef}
            id={`${id}-name`}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
            placeholder="e.g. For difficult days"
            invalid={Boolean(errors.name)}
            errorId={`${id}-name-error`}
            autoComplete="off"
          />
          <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>
          <CharacterCount length={name.trim().length} max={COLLECTION_NAME_MAX} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-description`}>Description (optional)</Label>
          <Textarea
            ref={descriptionRef}
            id={`${id}-description`}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setErrors((current) => ({ ...current, description: undefined }));
            }}
            placeholder="What gathers these Echoes together?"
            invalid={Boolean(errors.description)}
            errorId={`${id}-description-error`}
            className="min-h-24"
          />
          <FieldError id={`${id}-description-error`}>{errors.description}</FieldError>
          <CharacterCount length={description.trim().length} max={COLLECTION_DESCRIPTION_MAX} />
        </div>
      </div>
      {failure && (
        <p role="alert" className="flex items-start gap-1.5 text-body-sm text-primary-error-text">
          <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {failure}
        </p>
      )}
      <div className="flex gap-3 tablet:justify-end">
        <Button
          variant="secondary"
          className="flex-1 tablet:flex-none"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={saving}
          loadingLabel="Saving…"
          className="flex-1 tablet:flex-none"
        >
          {collection ? "Save changes" : "Create collection"}
        </Button>
      </div>
    </form>
  );
}
