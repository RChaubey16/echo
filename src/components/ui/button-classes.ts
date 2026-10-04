import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "pill" | "icon";
export type ButtonSize = "md" | "sm";

const BASE =
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md transition-[background-color,border-color,color,transform] duration-fast ease-standard disabled:cursor-not-allowed motion-reduce:active:scale-100";

const PRIMARY =
  "h-12 bg-primary px-5 text-button-md text-on-primary hover:bg-primary-hover active:scale-98 active:bg-primary-active disabled:bg-primary-disabled disabled:text-muted-soft";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: PRIMARY,
  secondary:
    "h-12 border border-border-input px-5 text-button-md text-ink hover:border-ink hover:bg-surface-strong active:border-ink active:bg-hairline disabled:border-hairline disabled:bg-transparent disabled:text-muted-soft",
  // Echo me something. Inkwell has no pills, so it is the primary button.
  pill: PRIMARY,
  tertiary:
    "h-11 px-3 text-button-md text-ink hover:bg-surface-strong active:bg-hairline disabled:bg-transparent disabled:text-muted-soft",
  danger:
    "h-12 bg-error px-5 text-button-md text-on-error hover:bg-error-hover focus-visible:outline-error active:scale-98 active:bg-error-hover disabled:bg-error-tint disabled:text-muted-soft",
  icon: "h-11 w-11 rounded-full bg-surface-strong text-ink hover:bg-hairline active:bg-border-input active:text-canvas disabled:bg-surface-strong disabled:text-muted-soft",
};

// The dense size changes height, padding and type, and keeps a 44px hit area through ::before.
const HIT_AREA = "before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-['']";
const SMALL: Record<ButtonVariant, string> = {
  primary: `h-10 px-4 text-button-sm ${HIT_AREA}`,
  secondary: `h-10 px-4 text-button-sm ${HIT_AREA}`,
  pill: `h-10 px-4 text-button-sm ${HIT_AREA}`,
  tertiary: `h-10 px-3 text-button-sm ${HIT_AREA}`,
  danger: `h-10 px-4 text-button-sm ${HIT_AREA}`,
  icon: "",
};

/**
 * Returns the DESIGN.md button classes for a variant, for use on <button> and <a>.
 *
 * @param variant - The button variant.
 * @param className - Extra layout classes (width, margins) only.
 * @param size - "md" (48px, the default) or "sm" (40px with a 44px hit area; dense toolbars only).
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
