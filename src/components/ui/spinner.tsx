import { cn } from "@/lib/cn";

/**
 * A small spinner for buttons only; page content uses skeletons. It fades in after 150ms so fast
 * saves never flash it.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 animate-fade-in [animation-delay:150ms]", // audit-ignore: 150ms spinner delay from motion.md
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-full w-full animate-spin motion-reduce:animate-none" // audit-ignore: the Button spinner itself
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity=".25" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
