import { cn } from "@/lib/cn";

const SIZES = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-12 w-12" } as const;

/**
 * The Echo mark: a primary-coloured disc with a point and two sound waves. Decorative; pair it
 * with the "Echo" wordmark or an accessible label.
 *
 * Inside a `group/logo` link, the waves ripple outward once on hover or keyboard focus: the
 * inner wave, then the outer one. Reduced motion turns the ripple off.
 */
export function LogoMark({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  /** Layout only. */
  className?: string;
}) {
  const wave =
    "group-hover/logo:animate-echo-wave group-focus-visible/logo:animate-echo-wave motion-reduce:animate-none";
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0 text-primary", SIZES[size], className)}
      aria-hidden
    >
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <circle cx="11" cy="16" r="2.4" className="fill-canvas" />
      <path
        d="M16 11.5a6.5 6.5 0 0 1 0 9"
        fill="none"
        className={cn("stroke-canvas", wave)}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M20 8.5a11 11 0 0 1 0 15"
        fill="none"
        className={cn("stroke-canvas [animation-delay:100ms]", wave)}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity=".55"
      />
    </svg>
  );
}
