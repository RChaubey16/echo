"use client";

import { ErrorState } from "@/components/ui/error-state";
import { useReportError } from "@/lib/use-report-error";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useReportError(error);
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <ErrorState errorId={error.digest} onRetry={retry} />
    </div>
  );
}
