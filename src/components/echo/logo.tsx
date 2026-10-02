import { cn } from "@/lib/cn";

/** The Echo mark: a Lagoon circle with sound waves. Decorative; pair it with a label. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0 text-primary", className)} aria-hidden>
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <circle cx="11" cy="16" r="2.4" className="fill-canvas" />
      <path
        d="M16 11.5a6.5 6.5 0 0 1 0 9"
        fill="none"
        className="stroke-canvas"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M20 8.5a11 11 0 0 1 0 15"
        fill="none"
        className="stroke-canvas"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity=".55"
      />
    </svg>
  );
}
