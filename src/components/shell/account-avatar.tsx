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
export function AccountAvatar({
  name,
  email,
  className,
}: {
  name: string | null;
  email: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint-heather text-caption-sm font-semibold text-ink",
        className,
      )}
    >
      {avatarInitial(name, email)}
    </span>
  );
}
