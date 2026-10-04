"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <ErrorState errorId={error.digest} onRetry={retry} />
    </div>
  );
}
