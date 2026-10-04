import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";

/** The top bar for public pages: the wordmark left, Sign in right, a soft hairline below. */
export function MarketingNav({ showSignIn = true }: { showSignIn?: boolean }) {
  return (
    <header className="border-b border-hairline-soft bg-canvas">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 tablet:h-21 tablet:px-10 desktop:px-20">
        <Link
          href="/"
          className="flex h-11 min-w-11 items-center rounded-md text-display-sm tracking-tight text-ink tablet:text-[22px]" // audit-ignore: the export sets the public wordmark at 22px
          aria-label="Echo home"
        >
          Echo
        </Link>
        {showSignIn && (
          <Link href="/login" className={buttonClasses("tertiary", "font-medium")}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
