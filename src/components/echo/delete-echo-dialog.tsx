"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AlertIcon, TrashIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, failureMessage } from "@/lib/api";
import { cn } from "@/lib/cn";

type DeleteEchoDialogProps = {
  echoId: string;
  /** Classes for the trigger button (layout only). */
  className?: string;
};

/** The Delete action and its confirmation (spec §25). Cancel gets initial focus. */
export function DeleteEchoDialog({ echoId, className }: DeleteEchoDialogProps) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setFailure(null);
  };

  const onDelete = async () => {
    setDeleting(true);
    setFailure(null);
    try {
      await api.deleteEcho(echoId);
    } catch (error) {
      // Already gone (e.g. deleted in another tab) counts as done.
      if (!(error instanceof ApiError && error.status === 404)) {
        setDeleting(false);
        setFailure(failureMessage(error, "Couldn't delete this Echo."));
        return;
      }
    }
    toast({ message: "Echo deleted" });
    router.push("/app/echoes");
    router.refresh();
  };

  return (
    <>
      <Button variant="secondary" className={cn("gap-2", className)} onClick={() => setOpen(true)}>
        <TrashIcon className="h-5 w-5 shrink-0" />
        Delete
      </Button>
      <Dialog open={open} onRequestClose={close} labelledBy={titleId} initialFocusRef={cancelRef}>
        <h2 id={titleId} className="text-display-sm text-ink">
          Delete this Echo?
        </h2>
        <p className="mt-2 text-body-md text-body">This cannot be undone.</p>
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
            Delete Echo
          </Button>
        </div>
      </Dialog>
    </>
  );
}
