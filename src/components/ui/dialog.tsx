"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  /** Called for Esc and backdrop clicks; the owner decides whether to actually close. */
  onRequestClose: () => void;
  /** The id of the dialog's title element, for aria-labelledby. */
  labelledBy: string;
  /** The element to focus on open; defaults to the browser's first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  size?: "md" | "lg";
  children: ReactNode;
};

/** How long the exit runs: `duration-fast`, faster than the 250ms entrance (motion.md). */
const EXIT_MS = 150;

/**
 * A modal dialog on native `<dialog>`: `showModal()` traps focus and makes the page inert. Below
 * 744px it becomes a bottom sheet. It rises in, and on close sinks out over 150ms (a fade with
 * reduced motion) before focus returns to whatever opened it.
 */
export function Dialog({
  open,
  onRequestClose,
  labelledBy,
  initialFocusRef,
  size = "md",
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  // True while the exit animation plays: the contents stay mounted until the dialog has gone.
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      initialFocusRef?.current?.focus();
      return;
    }
    if (open || !dialog.open) return;
    // Closing: let the exit play, then close and return focus. Reopening mid-exit cancels it.
    setLeaving(true);
    const timer = window.setTimeout(() => {
      dialog.close();
      setLeaving(false);
      const target = returnFocus.current;
      returnFocus.current = null;
      if (target?.isConnected) target.focus();
    }, EXIT_MS);
    return () => {
      window.clearTimeout(timer);
      setLeaving(false);
    };
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // Esc: let the owner decide (e.g. confirm discarding a draft).
        event.preventDefault();
        onRequestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onRequestClose();
      }}
      className={cn(
        "m-0 mt-auto w-full max-w-none overflow-y-auto rounded-t-lg bg-canvas text-ink shadow-float backdrop:bg-scrim",
        leaving
          ? "pointer-events-none animate-sink-out backdrop:animate-fade-out" // audit-ignore: reduced motion turns sink-out into a fade (globals.css)
          : "animate-rise-in backdrop:animate-fade-in motion-reduce:animate-fade-in",
        "max-h-[92dvh] tablet:m-auto tablet:max-h-[85dvh] tablet:rounded-lg", // audit-ignore: sheet and dialog height caps
        size === "lg" ? "tablet:max-w-lg" : "tablet:max-w-md",
      )}
    >
      {/* Padding lives on an inner box so a click on it never counts as a backdrop click. Contents
          mount only while open, so a closed dialog leaves no duplicate fields in the page. */}
      {(open || leaving) && (
        <div
          // While it leaves, the closing dialog is gone for assistive tech and can't be operated.
          inert={leaving}
          aria-hidden={leaving || undefined}
          className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] tablet:pb-6"
        >
          <div
            className="mx-auto -mt-2 mb-4 h-1 w-10 rounded-full bg-hairline tablet:hidden"
            aria-hidden
          />
          {children}
        </div>
      )}
    </dialog>
  );
}
