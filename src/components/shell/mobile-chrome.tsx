"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/echo/logo";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { PlusIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { AccountMenu } from "./account-menu";
import { MOBILE_TABS, NAV, activeNavId } from "./nav-items";

/** The 64px mobile header (<744px): logo and the account menu. */
export function MobileHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas tablet:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Link
          href="/app"
          className="flex h-11 items-center gap-2 rounded-sm text-ink"
          aria-label="Echo home"
        >
          <LogoMark />
          <span className="text-display-sm">echo</span>
        </Link>
        <AccountMenu
          placement="down"
          email={email}
          links={["favorites", "revisits", "settings"]}
          triggerClassName="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-canvas text-ink transition-colors duration-fast ease-standard hover:bg-surface-soft"
          trigger={<UserIcon className="h-5 w-5" />}
        />
      </div>
    </header>
  );
}

/** The mobile BottomTabBar (<744px): Home, Library, the Add orb, Search, Collections. */
export function BottomTabBar() {
  const pathname = usePathname();
  const active = activeNavId(pathname);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas pb-[env(safe-area-inset-bottom)] tablet:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {MOBILE_TABS.map((id) => {
          if (id === "add") {
            return (
              <li key="add" className="flex items-start justify-center">
                <AddEchoLink
                  aria-label="Add Echo"
                  className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-active active:scale-95 motion-reduce:active:scale-100"
                >
                  <PlusIcon className="h-5 w-5" />
                </AddEchoLink>
              </li>
            );
          }
          const item = NAV[id];
          const Icon = item.icon;
          const current = active === id;
          return (
            <li key={id}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-caption-sm transition-colors duration-fast ease-standard",
                  current ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <Icon className="h-6 w-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
