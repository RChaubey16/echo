"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const errorId = error.digest;

  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <EmptyState
        headingLevel="h1"
        title="Something went wrong."
        body="We couldn't load this page. Your Echoes are safe."
        action={
          <div className="flex flex-col items-center gap-4">
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
            {errorId && (
              <p className="flex items-center gap-2 text-caption-sm text-muted">
                <span>Error ID: {errorId}</span>
                <button
                  type="button"
                  className="rounded-xs underline underline-offset-4 hover:text-ink"
                  onClick={() => {
                    void navigator.clipboard?.writeText(errorId).then(() => setCopied(true));
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <span className="sr-only" aria-live="polite">
                  {copied ? "Error ID copied" : ""}
                </span>
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
