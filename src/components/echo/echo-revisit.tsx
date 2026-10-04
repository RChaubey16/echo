"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { ApiError, api } from "@/lib/api";
import { shortRevisitDate } from "@/lib/revisit-dates";
import { RevisitPicker } from "./revisit-picker";

type EchoRevisitProps = {
  echoId: string;
  /** The pending Revisit, if one is scheduled. */
  revisit: { id: string; scheduledFor: string } | null;
  timeZone?: string;
  labelledBy?: string;
};

/** The detail page's Revisit control: schedules, moves or cancels the Echo's Revisit straight away. */
export function EchoRevisit({ echoId, revisit, timeZone, labelledBy }: EchoRevisitProps) {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState(revisit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onChange = async (value: string | null) => {
    if (saving) return;
    setError(undefined);
    setSaving(true);
    const previous = current;
    try {
      if (value) {
        const saved = await api.createRevisit(echoId, value);
        setCurrent({ id: saved.id, scheduledFor: saved.scheduledFor });
        toast({ message: `Revisit set for ${shortRevisitDate(saved.scheduledFor)}` });
      } else if (previous) {
        setCurrent(null);
        await api.deleteRevisit(previous.id);
        toast({ message: "Revisit cancelled" });
      }
      router.refresh();
    } catch (failure) {
      setCurrent(previous);
      setError(
        failure instanceof ApiError && failure.fields.scheduledFor?.[0]
          ? failure.fields.scheduledFor[0]
          : "Couldn't update the Revisit. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <RevisitPicker
      value={current?.scheduledFor ?? null}
      onChange={(value) => void onChange(value)}
      timeZone={timeZone}
      disabled={saving}
      labelledBy={labelledBy}
      error={error}
    />
  );
}
