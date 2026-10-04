"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { CheckIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";

/**
 * "Mark as reflected" on a due Revisit. It shows "Reflected" at once (optimistic) and keeps it
 * until the refreshed list drops the row; a failure reverts it and explains with a toast.
 */
export function MarkReflectedButton({
  revisitId,
  className,
  size = "sm",
}: {
  revisitId: string;
  /** Layout only, e.g. `w-full` on phones. */
  className?: string;
  /** "sm" (40px, panels) or "md" (48px, Revisit cards). */
  size?: "sm" | "md";
}) {
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
      className={buttonClasses(
        "secondary",
        `whitespace-nowrap aria-disabled:cursor-default aria-disabled:border-hairline aria-disabled:bg-transparent ${className ?? ""}`,
        size,
      )}
    >
      <CheckIcon
        className={
          done ? "h-4 w-4 animate-heart-pop text-primary motion-reduce:animate-none" : "h-4 w-4"
        }
      />
      {done ? "Reflected" : "Mark as reflected"}
    </button>
  );
}
