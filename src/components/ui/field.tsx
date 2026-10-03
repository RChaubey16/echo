"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { AlertIcon } from "./icons";

const CONTROL =
  "w-full rounded-sm border bg-canvas px-3 text-body-md text-ink placeholder:text-muted focus:border-ink focus:outline-1 focus:-outline-offset-2 focus:outline-ink disabled:bg-surface-soft disabled:text-muted-soft";

/**
 * Returns the border classes for a control in its normal or error state.
 *
 * @param invalid - Whether the field currently has an error.
 * @returns The border class string.
 */
function borderFor(invalid: boolean | undefined): string {
  return invalid ? "border-primary-error-text" : "border-border-input";
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
  return <label className={cn("text-caption text-muted", className)} {...rest} />;
}

type ControlProps = { invalid?: boolean; errorId?: string };

/** A single-line text input, 56px tall. */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & ControlProps
>(function Input({ invalid, errorId, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      className={cn(CONTROL, "h-14", borderFor(invalid), className)}
      {...rest}
    />
  );
});

/**
 * A textarea that grows with its content (CSS `field-sizing: content`), starting at 128px.
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
        "[field-sizing:content] max-h-[60vh] min-h-32 py-3 pointer-coarse:resize-none", // audit-ignore: 60vh cap keeps long quotes scrollable inside dialogs
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
    <p id={id} className="flex items-start gap-1.5 text-body-sm text-primary-error-text">
      <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
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
        length > max ? "text-primary-error-text" : "text-muted",
      )}
    >
      {length.toLocaleString("en-US")} / {max.toLocaleString("en-US")}
    </p>
  );
}
