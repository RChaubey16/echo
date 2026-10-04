"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";

const FORMATS = [
  { format: "json", label: "Download JSON" },
  { format: "csv", label: "Download CSV" },
] as const;

/** Settings › Your data: downloads the whole library as JSON (complete) or CSV (spreadsheets). */
export function ExportData() {
  const toast = useToast();
  const [pending, setPending] = useState<"json" | "csv" | null>(null);

  const onExport = async (format: "json" | "csv") => {
    setPending(format);
    try {
      await api.downloadExport(format);
    } catch (error) {
      toast({ message: failureMessage(error, "Couldn't export your Echoes.") });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 tablet:flex-row">
      {FORMATS.map(({ format, label }) => (
        <Button
          key={format}
          variant="secondary"
          className="gap-2"
          loading={pending === format}
          loadingLabel="Preparing…"
          disabled={pending !== null && pending !== format}
          onClick={() => onExport(format)}
        >
          <DownloadIcon className="h-5 w-5 shrink-0" />
          {label}
        </Button>
      ))}
    </div>
  );
}
