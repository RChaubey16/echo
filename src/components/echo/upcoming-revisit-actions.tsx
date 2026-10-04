"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, failureMessage } from "@/lib/api";
import { shortRevisitDate } from "@/lib/revisit-dates";
import { RevisitPicker } from "./revisit-picker";

type UpcomingRevisitActionsProps = {
  revisitId: string;
  echoId: string;
  timeZone?: string;
};

/**
 * Change and Cancel on an upcoming Revisit, the same actions the Echo detail page offers. Change
 * picks a new day in a dialog; Cancel removes the Revisit at once.
 */
export function UpcomingRevisitActions({
  revisitId,
  echoId,
  timeZone,
}: UpcomingRevisitActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reschedule = async (value: string | null) => {
    if (!value || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      // Scheduling replaces the Echo's pending Revisit.
      const saved = await api.createRevisit(echoId, value);
      setOpen(false);
      toast({ message: `Revisit moved to ${shortRevisitDate(saved.scheduledFor, timeZone)}` });
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.fields.scheduledFor?.[0]
          ? failure.fields.scheduledFor[0]
          : failureMessage(failure, "Couldn't move the Revisit."),
      );
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.deleteRevisit(revisitId);
      toast({ message: "Revisit cancelled" });
      router.refresh();
    } catch (failure) {
      toast({ message: failureMessage(failure, "Couldn't cancel the Revisit.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex shrink-0 gap-1">
      <Button variant="tertiary" size="sm" disabled={busy} onClick={() => setOpen(true)}>
        Change
      </Button>
      <Button
        variant="tertiary"
        size="sm"
        disabled={busy}
        className="font-medium"
        onClick={() => void cancel()}
      >
        Cancel
      </Button>
      <Dialog open={open} onRequestClose={() => !busy && setOpen(false)} labelledBy={titleId}>
        <h2 id={titleId} className="text-display-sm text-ink">
          Change the Revisit
        </h2>
        <p className="mt-2 mb-5 text-body-md text-body">Choose when to see this Echo again.</p>
        <RevisitPicker
          value={null}
          onChange={(value) => void reschedule(value)}
          timeZone={timeZone}
          disabled={busy}
          labelledBy={titleId}
          error={error}
        />
        <div className="mt-6 flex tablet:justify-end">
          <Button
            variant="secondary"
            className="flex-1 tablet:flex-none"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Keep the date
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
