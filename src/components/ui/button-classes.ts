import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary";

const BASE =
  "inline-flex items-center justify-center gap-2 transition-[background-color,transform] duration-fast ease-standard disabled:cursor-not-allowed motion-reduce:active:scale-100";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "h-12 rounded-sm bg-primary px-6 text-button-md text-on-primary hover:bg-primary-active active:scale-98 active:bg-primary-active disabled:bg-primary-disabled disabled:text-on-primary-disabled",
  secondary:
    "h-12 rounded-sm border border-ink bg-canvas px-6 text-button-md text-ink hover:bg-surface-soft active:bg-surface-strong disabled:border-hairline disabled:text-muted-soft",
  tertiary: "h-auto px-0 text-button-md text-ink underline-offset-4 hover:underline",
};

/**
 * Returns the DESIGN.md button classes for a variant, for use on <button> and <a>.
 *
 * @param variant - The button variant.
 * @param className - Extra layout classes (width, margins) only.
 * @returns The class string.
 */
export function buttonClasses(variant: ButtonVariant = "primary", className?: string): string {
  return cn(BASE, VARIANTS[variant], className);
}
