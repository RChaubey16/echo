"use client";

import { ErrorState } from "@/components/ui/error-state";
import "./globals.css";

/** The last-resort boundary when the root layout itself fails; it renders its own document. */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          id="main"
          className="flex min-h-dvh flex-col items-center justify-center bg-surface-soft px-4 py-12 text-ink"
        >
          <ErrorState
            body="Echo couldn't load. Your Echoes are safe. Try again in a moment."
            errorId={error.digest}
            onRetry={retry}
          />
        </main>
      </body>
    </html>
  );
}
