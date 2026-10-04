"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { AlertIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { ApiError, api } from "@/lib/api";
import { useHydrated } from "@/lib/use-hydrated";
import type { EchoDto } from "@/types/echo";
import { EchoFields } from "./echo-fields";
import { isDirty, linksFromEcho, valuesFromEcho } from "./echo-values";
import { useEchoDraft } from "./use-echo-draft";

type EchoFormProps = {
  /** The Echo being edited; omit to create a new one. */
  echo?: EchoDto;
  cancelHref: string;
};

/**
 * Submits a form with the keyboard shortcut Cmd/Ctrl+Enter.
 *
 * @param event - The keydown event from inside the form.
 * @returns Nothing.
 */
export function submitOnModEnter(event: KeyboardEvent<HTMLFormElement>): void {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    event.currentTarget.requestSubmit();
  }
}

/** The full Echo form, for /app/echoes/new and /app/echoes/:id/edit. */
export function EchoForm({ echo, cancelHref }: EchoFormProps) {
  const router = useRouter();
  const toast = useToast();
  const initial = valuesFromEcho(echo);
  const initialLinks = linksFromEcho(echo);
  const formRef = useRef<HTMLFormElement>(null);
  const draft = useEchoDraft(initial, initialLinks, Boolean(echo), formRef);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLTextAreaElement>(null);
  // Typing into a controlled field before hydration can be lost or garbled, so the fields stay
  // read-only until React is running, then the quote gets focus.
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated) quoteRef.current?.focus();
  }, [hydrated]);
  const dirty = isDirty(draft.values, initial, draft.links, initialLinks) && !saving;

  // Warn before leaving the page with unsaved text, so a draft quote is never lost.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const onSubmit = async () => {
    if (saving) return;
    setSummary(null);
    const data = draft.validate();
    if (!data) return;
    setSaving(true);
    try {
      const saved = echo ? await api.updateEcho(echo.id, data) : await api.createEcho(data);
      toast({ message: echo ? "Changes saved" : "Echo saved" });
      router.push(`/app/echoes/${saved.id}`);
      router.refresh();
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && draft.applyServerErrors(error.fields)) return;
      setSummary(
        error instanceof ApiError && error.status === 404
          ? "This Echo no longer exists."
          : "Couldn't save your Echo. Check your connection and try again.",
      );
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  };

  return (
    <form
      ref={formRef}
      noValidate
      onKeyDown={submitOnModEnter}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
      className="flex flex-col gap-6"
    >
      {summary && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-primary-error-text bg-canvas p-4 text-body-sm text-primary-error-text"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{summary}</p>
        </div>
      )}
      <EchoFields
        values={draft.values}
        errors={draft.errors}
        onChange={draft.setField}
        links={draft.links}
        onLinkChange={draft.setLink}
        onBlur={draft.blurField}
        detailsOpen={draft.detailsOpen}
        onDetailsOpenChange={draft.setDetailsOpen}
        quoteRef={quoteRef}
        readOnly={!hydrated}
      />
      <div className="sticky bottom-16 -mx-4 flex gap-3 border-t border-hairline bg-canvas p-4 tablet:static tablet:mx-0 tablet:justify-end tablet:border-0 tablet:bg-transparent tablet:p-0">
        <Link href={cancelHref} className={buttonClasses("secondary", "flex-1 tablet:flex-none")}>
          Cancel
        </Link>
        <Button
          type="submit"
          loading={saving}
          loadingLabel="Saving…"
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className="flex-1 tablet:flex-none"
        >
          {echo ? "Save changes" : "Save Echo"}
        </Button>
      </div>
    </form>
  );
}
