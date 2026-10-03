"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
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

/**
 * A modal dialog on native `<dialog>`: `showModal()` traps focus and makes the page inert. Below
 * 744px it becomes a bottom sheet. Focus returns to whatever opened it.
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

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      const target = returnFocus.current;
      returnFocus.current = null;
      if (target?.isConnected) target.focus();
    }
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
        "m-0 mt-auto w-full max-w-none animate-rise-in overflow-y-auto rounded-t-xl bg-canvas text-ink shadow-float backdrop:animate-fade-in backdrop:bg-scrim/50 motion-reduce:animate-fade-in",
        "max-h-[92dvh] tablet:m-auto tablet:max-h-[85dvh] tablet:rounded-md", // audit-ignore: sheet and dialog height caps
        size === "lg" ? "tablet:max-w-lg" : "tablet:max-w-md",
      )}
    >
      {/* Padding lives on an inner box so a click on it never counts as a backdrop click. Contents
          mount only while open, so a closed dialog leaves no duplicate fields in the page. */}
      {open && (
        <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] tablet:pb-6">
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
