"use client";

import { useState } from "react";
import { Button } from "./button";
import { buttonClasses } from "./button-classes";
import { EmptyState } from "./empty-state";

type ErrorStateProps = {
  title?: string;
  body?: string;
  /** Shown as "Error ID: …" with a copy button, so support can find the server log. */
  errorId?: string;
  /** Retries in place (an error boundary's `retry`). */
  onRetry?: () => void;
  /** Or reloads a page, when there is no boundary to retry. */
  retryHref?: string;
  /** "h1" when the state replaces the whole page. */
  headingLevel?: "h1" | "h2";
  className?: string;
};

/**
 * The friendly failure block: what happened, a Try again action and an error ID for support.
 * Technical details stay in the logs.
 */
export function ErrorState({
  title = "Something went wrong.",
  body = "We couldn't load this page. Your Echoes are safe.",
  errorId,
  onRetry,
  retryHref,
  headingLevel = "h1",
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      headingLevel={headingLevel}
      title={title}
      body={body}
      className={className}
      action={
        <div className="flex flex-col items-center gap-4">
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : retryHref ? (
            // A full load on purpose: a client navigation could reuse the broken render.
            <a href={retryHref} className={buttonClasses("secondary")}>
              Try again
            </a>
          ) : null}
          {errorId && <ErrorId id={errorId} />}
        </div>
      }
    />
  );
}

/**
 * "Error ID: …" with a Copy button and a polite announcement once copied.
 *
 * @param props - The error ID.
 * @returns The error ID line.
 */
function ErrorId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 text-caption-sm text-muted">
      <span className="[overflow-wrap:anywhere]">Error ID: {id}</span>
      <button
        type="button"
        className="inline-flex h-11 items-center rounded-sm px-2 underline underline-offset-4 hover:text-ink"
        onClick={() => {
          void navigator.clipboard?.writeText(id).then(() => setCopied(true));
        }}
      >
        {copied ? "Copied" : "Copy"}
        <span className="sr-only"> error ID</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Error ID copied" : ""}
      </span>
    </p>
  );
}

/**
 * The inline message a section shows in its own place when its data couldn't load, so the rest of
 * the page keeps working.
 *
 * @param props - What failed to load, and the page to reload for a retry.
 * @returns The inline error.
 */
export function SectionError({ what, retryHref }: { what: string; retryHref: string }) {
  return (
    <p role="alert" className="mt-4 text-body-sm text-body">
      Couldn&apos;t load {what}.{" "}
      <a
        href={retryHref}
        className="inline-flex min-h-6 items-center text-primary underline underline-offset-4 hover:decoration-2"
      >
        Try again
      </a>
    </p>
  );
}
