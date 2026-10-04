"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";

/**
 * "Mark as reflected" on a due Revisit. It shows "Reflected" at once (optimistic) and keeps it
 * until the refreshed list drops the row; a failure reverts it and explains with a toast.
 */
export function MarkReflectedButton({ revisitId }: { revisitId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [done, setDone] = useOptimistic(false);
  const [, startTransition] = useTransition();

  const onClick = () => {
    if (done) return;
    startTransition(async () => {
      setDone(true);
      try {
        await api.completeRevisit(revisitId);
        toast({ message: "Marked as reflected" });
        // Inside the transition, so the optimistic state holds until the new list arrives.
        router.refresh();
      } catch (error) {
        toast({ message: failureMessage(error, "Couldn't update the Revisit.") });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={done || undefined}
      className="inline-flex h-11 items-center gap-2 text-button-sm whitespace-nowrap text-ink underline-offset-4 hover:underline aria-disabled:cursor-default aria-disabled:no-underline"
    >
      {done && <CheckIcon className="h-4 w-4 text-primary" />}
      {done ? "Reflected" : "Mark as reflected"}
    </button>
  );
}
