import Link from "next/link";
import { LogoMark } from "@/components/echo/logo";
import { buttonClasses } from "@/components/ui/button-classes";

/** The DESIGN.md top-nav for marketing pages: 80px, hairline below, logo left, sign-in right. */
export function MarketingNav({ showSignIn = true }: { showSignIn?: boolean }) {
  return (
    <header className="border-b border-hairline bg-canvas">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 tablet:px-6 desktop:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm text-ink"
          aria-label="Echo home"
        >
          <LogoMark />
          <span className="text-display-sm">echo</span>
        </Link>
        {showSignIn && (
          <Link href="/login" className={buttonClasses("secondary")}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
