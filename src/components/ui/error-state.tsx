"use client";

import { useState } from "react";
import { Button } from "./button";
import { AlertIcon } from "./icons";
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
        <div className="flex flex-col items-start gap-4">
          {onRetry ? (
            <Button onClick={onRetry}>Try again</Button>
          ) : retryHref ? (
            // A full load on purpose: a client navigation could reuse the broken render.
            <a href={retryHref} className={buttonClasses("primary")}>
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
    <p className="flex flex-wrap items-center gap-x-2 text-caption-sm text-muted">
      <span className="[overflow-wrap:anywhere]">Error ID: {id}</span>
      <button
        type="button"
        className="inline-flex h-11 items-center rounded-md px-2 underline underline-offset-4 hover:text-ink"
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
    <div
      role="alert"
      className="mt-4 flex items-center gap-3 rounded-md bg-error-tint py-2 pr-2 pl-4 text-body-md text-ink"
    >
      <AlertIcon className="h-4 w-4 shrink-0 text-error" />
      <span className="min-w-0 flex-1">Couldn&apos;t load {what}.</span>
      {/* A full load on purpose, like the route-level retry. */}
      <a href={retryHref} className={buttonClasses("secondary", "h-11", "sm")}>
        Try again
      </a>
    </div>
  );
}
