import type { ButtonHTMLAttributes, Ref } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./button-classes";
import { Spinner } from "./spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and the progressive label, and blocks a second submit. */
  loading?: boolean;
  /** The label while loading, e.g. "Saving…". Defaults to the normal label. */
  loadingLabel?: string;
};

/**
 * Echo's button. Actions are buttons; navigation that looks like a button uses `buttonClasses` on a
 * Link instead.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  type = "button",
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, className, size)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
