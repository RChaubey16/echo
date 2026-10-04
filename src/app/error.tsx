"use client";

import { ErrorState } from "@/components/ui/error-state";

/** The error boundary for pages outside the app shell: the landing page and sign-in. */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center bg-surface-soft px-4 py-12 text-ink"
    >
      <ErrorState
        body="We couldn't load this page. Try again in a moment."
        errorId={error.digest}
        onRetry={retry}
      />
    </main>
  );
}
