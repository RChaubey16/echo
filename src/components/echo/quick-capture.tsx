"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AlertIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, failureMessage } from "@/lib/api";
import { EchoFields } from "./echo-fields";
import { submitOnModEnter } from "./echo-form";
import { EMPTY_LINKS, EMPTY_VALUES, isDirty } from "./echo-values";
import { useEchoDraft } from "./use-echo-draft";

export const NEW_ECHO_HREF = "/app/echoes/new";

/** How QuickCapture was opened; `firstRun` opens the new Echo afterwards for onboarding. */
export type QuickCaptureOptions = { firstRun?: boolean };
type OpenQuickCapture = (options?: QuickCaptureOptions) => void;

const QuickCaptureContext = createContext<OpenQuickCapture | null>(null);

/**
 * Returns the function that opens the Add Echo dialog.
 *
 * @returns A function that opens QuickCapture, optionally as the first-run flow.
 */
export function useQuickCapture(): OpenQuickCapture {
  const open = useContext(QuickCaptureContext);
  if (!open) throw new Error("useQuickCapture must be used inside <QuickCaptureProvider>");
  return open;
}

/**
 * Reports whether a keydown happened while the user was typing, so shortcuts stay out of the way.
 *
 * @param target - The event target.
 * @returns True for inputs, textareas, selects and editable content.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Owns the Add Echo dialog and the `n` shortcut for the whole signed-in app. */
export function QuickCaptureProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const show = useCallback<OpenQuickCapture>((options) => {
    setFirstRun(Boolean(options?.firstRun));
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "n" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      setFirstRun(false);
      setOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <QuickCaptureContext.Provider value={show}>
      {children}
      <QuickCapture open={open} firstRun={firstRun} onClose={() => setOpen(false)} />
    </QuickCaptureContext.Provider>
  );
}

/**
 * The Add Echo dialog: the quote is the only field, saving is one shortcut away, and a typed draft
 * is never discarded without asking.
 */
function QuickCapture({
  open,
  firstRun,
  onClose,
}: {
  open: boolean;
  firstRun: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();
  const quoteRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const draft = useEchoDraft(EMPTY_VALUES, EMPTY_LINKS, false, formRef);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const close = () => {
    draft.reset(EMPTY_VALUES, EMPTY_LINKS);
    setConfirmDiscard(false);
    setFailure(null);
    onClose();
  };

  const requestClose = () => {
    if (saving) return;
    if (isDirty(draft.values, EMPTY_VALUES, draft.links)) setConfirmDiscard(true);
    else close();
  };

  const onSubmit = async () => {
    if (saving) return;
    setFailure(null);
    setConfirmDiscard(false);
    const data = draft.validate();
    if (!data) return;
    setSaving(true);
    try {
      const saved = await api.createEcho(data);
      close();
      if (firstRun) {
        // Onboarding continues on the new Echo with the "Why did this speak to you?" prompt.
        toast({ message: "Echo saved" });
        router.push(`/app/echoes/${saved.id}`);
        return;
      }
      toast({ message: "Echo saved", action: { label: "View", href: `/app/echoes/${saved.id}` } });
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError && draft.applyServerErrors(error.fields))) {
        setFailure(failureMessage(error, "Couldn't save your Echo."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onRequestClose={requestClose}
      labelledBy={titleId}
      initialFocusRef={quoteRef}
      size="lg"
    >
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
        <div className="flex items-baseline justify-between gap-4">
          <h2 id={titleId} className="text-display-sm text-ink">
            Add Echo
          </h2>
          <Link
            href={NEW_ECHO_HREF}
            onClick={close}
            className="text-body-sm text-primary underline-offset-4 hover:underline"
          >
            Open full form
          </Link>
        </div>

        <EchoFields
          values={draft.values}
          errors={draft.errors}
          onChange={(name, value) => {
            setConfirmDiscard(false);
            draft.setField(name, value);
          }}
          links={draft.links}
          onLinkChange={(name, value) => {
            setConfirmDiscard(false);
            draft.setLink(name, value);
          }}
          onBlur={draft.blurField}
          detailsOpen={draft.detailsOpen}
          onDetailsOpenChange={draft.setDetailsOpen}
          quoteRef={quoteRef}
        />

        {failure && (
          <p role="alert" className="flex items-start gap-1.5 text-body-sm text-primary-error-text">
            <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {failure}
          </p>
        )}

        {confirmDiscard ? (
          <div
            role="group"
            aria-labelledby={`${titleId}-discard`}
            className="flex flex-col gap-3 rounded-sm bg-surface-soft p-4 tablet:flex-row tablet:items-center tablet:justify-between"
          >
            <p id={`${titleId}-discard`} className="text-body-md text-ink">
              Discard this quote?
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                autoFocus
                onClick={() => setConfirmDiscard(false)}
              >
                Keep editing
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={close}>
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 tablet:justify-end">
            <Button
              variant="secondary"
              className="flex-1 tablet:flex-none"
              onClick={requestClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              loadingLabel="Saving…"
              aria-keyshortcuts="Control+Enter Meta+Enter"
              className="flex-1 tablet:flex-none"
            >
              Save Echo
            </Button>
          </div>
        )}
      </form>
    </Dialog>
  );
}

type AddEchoLinkProps = {
  className: string;
  /** Opens the new Echo after saving, to continue onboarding. */
  firstRun?: boolean;
  children: ReactNode;
  "aria-label"?: string;
};

/**
 * A link to the full Add Echo page that opens QuickCapture instead on a plain click. Modified
 * clicks (new tab, new window) still follow the link.
 */
export function AddEchoLink({ className, firstRun, children, ...rest }: AddEchoLinkProps) {
  const openQuickCapture = useQuickCapture();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    openQuickCapture({ firstRun });
  };
  return (
    <Link
      href={NEW_ECHO_HREF}
      aria-keyshortcuts="n"
      onClick={onClick}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
