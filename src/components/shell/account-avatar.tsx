import { cn } from "@/lib/cn";

/**
 * Picks the letter shown in the account avatar: the first letter of the name, or of the email.
 *
 * @param name - The user's name, if known.
 * @param email - The user's email.
 * @returns One uppercase character.
 */
export function avatarInitial(name: string | null, email: string): string {
  const source = name?.trim() || email.trim();
  return (source.charAt(0) || "?").toUpperCase();
}

/** The account's initial on a heather disc. Decorative: the button around it carries the name. */
const SIZES = {
  sm: "h-8 w-8 text-caption-sm",
  md: "h-9 w-9 text-caption-sm",
  lg: "h-14 w-14 text-display-sm",
} as const;

export function AccountAvatar({
  name,
  email,
  size = "sm",
  className,
}: {
  name: string | null;
  email: string;
  /** 32px (header, sidebar), 36px (rail) or 56px (Settings). */
  size?: keyof typeof SIZES;
  /** Layout only. */
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-tint-heather font-semibold text-ink",
        SIZES[size],
        className,
      )}
    >
      {avatarInitial(name, email)}
    </span>
  );
}
