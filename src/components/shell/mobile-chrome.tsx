"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/echo/logo";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { AccountAvatar } from "./account-avatar";
import { AccountMenu } from "./account-menu";
import { MOBILE_TABS, NAV, activeNavId } from "./nav-items";

/** The 64px mobile header (<744px): the logo and wordmark, and the account menu. */
export function MobileHeader({ name, email }: { name: string | null; email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas tablet:hidden">
      <div className="flex h-16 items-center justify-between pr-2.5 pl-5">
        <Link
          href="/app"
          className="group/logo flex h-11 min-w-11 items-center gap-2.5 rounded-md text-display-sm tracking-tight text-ink"
          aria-label="Echo home"
        >
          <LogoMark size="sm" />
          Echo
        </Link>
        <AccountMenu
          placement="down"
          email={email}
          links={["favorites", "revisits", "settings"]}
          triggerClassName="flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-fast ease-standard hover:bg-surface-strong"
          trigger={<AccountAvatar name={name} email={email} />}
        />
      </div>
    </header>
  );
}

/**
 * The mobile BottomTabBar (<744px): Home, Library, the raised Add button, Search, Collections. The
 * active tab gets a neutral pill behind its icon.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const active = activeNavId(pathname);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas pb-[env(safe-area-inset-bottom)] tablet:hidden"
    >
      <ul className="mx-auto grid h-18 max-w-md grid-cols-5">
        {MOBILE_TABS.map((id) => {
          if (id === "add") {
            return (
              <li key="add" className="flex items-center justify-center">
                <AddEchoLink
                  aria-label="Add Echo"
                  className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-hover active:scale-95 active:bg-primary-active motion-reduce:active:scale-100"
                >
                  <PlusIcon className="h-6 w-6" />
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
                  "group/tab flex h-18 flex-col items-center justify-center gap-1 text-badge transition-colors duration-fast ease-standard",
                  current ? "font-semibold text-ink" : "text-body hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex rounded-full px-4 py-1 transition-colors duration-fast ease-standard",
                    // The pill settles in under the icon each time a tab becomes current.
                    current
                      ? "animate-pill-in bg-surface-strong motion-reduce:animate-none"
                      : "group-hover/tab:bg-surface-soft",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
