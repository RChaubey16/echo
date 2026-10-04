"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

/**
 * "Mark as reflected" on a due Revisit: completes it, confirms with a toast and refreshes the page
 * so the row leaves its list.
 */
export function MarkReflectedButton({ revisitId }: { revisitId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.completeRevisit(revisitId);
      toast({ message: "Marked as reflected" });
      router.refresh();
    } catch {
      setBusy(false);
      toast({ message: "Couldn't update the Revisit. Try again." });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      aria-busy={busy || undefined}
      className="inline-flex h-11 items-center gap-2 text-button-sm whitespace-nowrap text-ink underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-soft"
    >
      {busy && <Spinner className="h-4 w-4" />}
      Mark as reflected
    </button>
  );
}
