"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { AlertIcon } from "./icons";

// Focus: the border becomes 2px ink (the inset ring adds the second pixel without a layout shift),
// plus the global primary focus ring outside it.
export const CONTROL =
  "w-full rounded-md border bg-canvas px-4 text-body-md text-ink transition-colors duration-fast ease-standard placeholder:text-muted hover:border-ink focus:border-ink focus:ring-1 focus:ring-ink focus:ring-inset disabled:border-hairline disabled:bg-surface-soft disabled:text-muted";

/**
 * Returns the border classes for a control in its normal or error state.
 *
 * @param invalid - Whether the field currently has an error.
 * @returns The border class string.
 */
function borderFor(invalid: boolean | undefined): string {
  return invalid
    ? "border-error ring-1 ring-error ring-inset hover:border-error"
    : "border-border-input";
}

/**
 * Grows a textarea to fit its content in browsers without `field-sizing: content` (e.g. Firefox).
 *
 * @param textarea - The textarea that just changed.
 * @returns Nothing.
 */
function growWithoutFieldSizing(textarea: HTMLTextAreaElement): void {
  if (typeof CSS === "undefined" || CSS.supports("field-sizing", "content")) return;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

/** A visible field label; never replace it with a placeholder. */
export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-caption text-ink", className)} {...rest} />;
}

type ControlProps = { invalid?: boolean; errorId?: string };

/** A single-line text input, 52px tall. */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & ControlProps
>(function Input({ invalid, errorId, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      className={cn(CONTROL, "h-13", borderFor(invalid), className)}
      {...rest}
    />
  );
});

/**
 * A textarea that grows with its content (CSS `field-sizing: content`), starting at 112px.
 * `className` may set typography (QuoteText styling for the quote field) and min height.
 */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps
>(function Textarea({ invalid, errorId, className, onInput, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      onInput={(event) => {
        growWithoutFieldSizing(event.currentTarget);
        onInput?.(event);
      }}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      className={cn(
        CONTROL,
        "[field-sizing:content] max-h-[60vh] min-h-28 py-3.5 pointer-coarse:resize-none", // audit-ignore: 60vh cap keeps long quotes scrollable inside dialogs
        borderFor(invalid),
        className,
      )}
      {...rest}
    />
  );
});

/** The inline error under a field, linked to it by id through aria-describedby. */
export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="flex items-start gap-1.5 text-caption-sm text-error">
      <AlertIcon className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Shows a length counter once the value is within 10% of its limit.
 *
 * @param props - The current length and the maximum.
 * @returns The counter, or null when it isn't needed yet.
 */
export function CharacterCount({ length, max }: { length: number; max: number }) {
  if (length < max * 0.9) return null;
  return (
    <p
      className={cn(
        "text-right text-caption-sm tabular-nums",
        length > max ? "text-error" : "text-muted",
      )}
    >
      {length.toLocaleString("en-US")} / {max.toLocaleString("en-US")}
    </p>
  );
}
