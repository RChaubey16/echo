"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldError, Input, Label } from "@/components/ui/field";
import { TrashIcon } from "@/components/ui/icons";
import { ApiError, api, failureMessage } from "@/lib/api";
import { DELETE_CONFIRMATION, isDeleteConfirmed } from "@/server/validation/user";

const DELETED = [
  "Every Echo, including its quote, author, source, reflection and mood",
  "Your tags, collections and Revisits",
  "Your name, email and Google sign-in",
];

/**
 * Settings › Your data: permanently deletes the account (spec §62). The final button stays
 * disabled until the user types DELETE (or their email); Cancel gets initial focus.
 */
export function DeleteAccountDialog({ email }: { email: string }) {
  const router = useRouter();
  const titleId = useId();
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const confirmed = isDeleteConfirmed(typed, email);

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setTyped("");
    setFailure(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmed) {
      setFailure(`Type ${DELETE_CONFIRMATION} to confirm.`);
      inputRef.current?.focus();
      return;
    }
    setDeleting(true);
    setFailure(null);
    try {
      await api.deleteAccount(typed.trim());
    } catch (error) {
      setDeleting(false);
      setFailure(
        error instanceof ApiError && error.fields.confirm?.[0]
          ? error.fields.confirm[0]
          : failureMessage(error, "Couldn't delete your account."),
      );
      return;
    }
    // The session cookie is gone; refresh so no cached page of the deleted account survives.
    router.replace("/?goodbye=1");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-md border border-error px-5 text-button-md text-error transition-colors duration-fast ease-standard hover:bg-error-tint focus-visible:outline-error"
      >
        <TrashIcon className="h-5 w-5 shrink-0" />
        Delete account
      </button>
      <Dialog open={open} onRequestClose={close} labelledBy={titleId} initialFocusRef={cancelRef}>
        <h2 id={titleId} className="text-display-sm text-ink">
          Delete your account?
        </h2>
        <p className="mt-2 text-body-md text-body">
          This permanently deletes everything you&apos;ve saved in Echo. It can&apos;t be undone.
        </p>
        <ul className="mt-4 flex list-disc flex-col gap-1 pl-5 text-body-sm text-body">
          {DELETED.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-body-sm text-muted">
          Want a copy first? Close this and download your data above.
        </p>
        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-1.5">
          <Label htmlFor={fieldId}>
            Type <span className="font-semibold text-ink">{DELETE_CONFIRMATION}</span> to confirm
          </Label>
          <Input
            ref={inputRef}
            id={fieldId}
            name="confirm"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={320}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            invalid={Boolean(failure)}
            errorId={errorId}
          />
          <div role="alert">
            <FieldError id={errorId}>{failure ?? undefined}</FieldError>
          </div>
          <div className="mt-4 flex gap-3 tablet:justify-end">
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
              type="submit"
              variant="danger"
              className="flex-1 tablet:flex-none"
              loading={deleting}
              loadingLabel="Deleting…"
              disabled={!confirmed}
            >
              Delete account
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
