import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex items-center justify-center gap-2 transition-[background-color,transform] duration-fast ease-standard disabled:cursor-not-allowed motion-reduce:active:scale-100";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "h-12 rounded-sm bg-primary px-6 text-button-md text-on-primary hover:bg-primary-active active:scale-98 active:bg-primary-active disabled:bg-primary-disabled disabled:text-on-primary-disabled",
  secondary:
    "h-12 rounded-sm border border-ink bg-canvas px-6 text-button-md text-ink hover:bg-surface-soft active:bg-surface-strong disabled:border-hairline disabled:text-muted-soft",
  tertiary: "h-auto px-0 text-button-md text-ink underline-offset-4 hover:underline",
  danger:
    "h-12 rounded-sm bg-primary-error-text px-6 text-button-md text-on-primary hover:bg-primary-error-text-hover active:scale-98 active:bg-primary-error-text-hover",
};

// The dense size only changes height, padding and type; tertiary has no box to shrink.
const SMALL: Record<ButtonVariant, string> = {
  primary: "h-10 px-4 text-button-sm",
  secondary: "h-10 px-4 text-button-sm",
  tertiary: "text-button-sm",
  danger: "h-10 px-4 text-button-sm",
};

/**
 * Returns the DESIGN.md button classes for a variant, for use on <button> and <a>.
 *
 * @param variant - The button variant.
 * @param className - Extra layout classes (width, margins) only.
 * @param size - "md" (48px, the default) or "sm" (40px, dense desktop toolbars only).
 * @returns The class string.
 */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  className?: string,
  size: ButtonSize = "md",
): string {
  // Small overrides come after the variant so their height, padding and type win.
  return cn(BASE, VARIANTS[variant], size === "sm" && SMALL[variant], className);
}
