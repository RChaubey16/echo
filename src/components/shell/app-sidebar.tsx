"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { LogoMark } from "@/components/echo/logo";
import { buttonClasses } from "@/components/ui/button-classes";
import { CollapseIcon, ExpandIcon, PlusIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { AccountMenu } from "./account-menu";
import { ADD_ECHO_HREF, NAV, SIDEBAR_NAV, activeNavId, type NavId } from "./nav-items";

type AppSidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  user: { name: string | null; email: string };
};

/*
 * Tablet shows the 96px rail. Desktop shows the 256px sidebar unless the user collapsed it.
 * "Expanded" styles are therefore all `desktop:group-data-[expanded=true]/side:`, so the server
 * renders the right layout from the cookie and nothing shifts after hydration. Tailwind only
 * detects literal class strings, so keep the variant written out in full.
 */
const ITEM = [
  "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-sm text-caption-sm text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink",
  "aria-[current=page]:bg-surface-soft aria-[current=page]:font-semibold aria-[current=page]:text-ink",
  `desktop:group-data-[expanded=true]/side:h-10 desktop:group-data-[expanded=true]/side:flex-row desktop:group-data-[expanded=true]/side:justify-start desktop:group-data-[expanded=true]/side:gap-3 desktop:group-data-[expanded=true]/side:px-3 desktop:group-data-[expanded=true]/side:text-body-md desktop:group-data-[expanded=true]/side:text-body`,
].join(" ");

const SHOW_EXPANDED = `hidden desktop:group-data-[expanded=true]/side:block`;
const SHOW_FLEX_EXPANDED = `hidden desktop:group-data-[expanded=true]/side:flex`;
const SHOW_RAIL = `desktop:group-data-[expanded=true]/side:hidden`;

/**
 * Renders one sidebar nav link: icon over label in the rail, a row when expanded.
 *
 * @param props - The nav id and whether it is the current page.
 * @returns The list item.
 */
function SidebarLink({ id, active }: { id: NavId; active: boolean }) {
  const item = NAV[id];
  const Icon = item.icon;
  return (
    <li>
      <Link href={item.href} aria-current={active ? "page" : undefined} className={ITEM}>
        <Icon className="h-5 w-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

export function AppSidebar({ collapsed, onCollapsedChange, user }: AppSidebarProps) {
  const pathname = usePathname();
  const active = activeNavId(pathname);
  const collapseRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);

  const remember = (value: boolean) => {
    onCollapsedChange(value);
    // Move focus to the control that replaced the one just pressed.
    requestAnimationFrame(() => (value ? expandRef : collapseRef).current?.focus());
  };

  return (
    <aside
      id="sidebar"
      aria-label="Sidebar"
      data-expanded={String(!collapsed)}
      className="group/side fixed inset-y-0 left-0 z-30 hidden w-24 flex-col border-r border-hairline bg-canvas tablet:flex desktop:data-[expanded=true]:w-64"
    >
      <div
        className={`flex h-20 items-center justify-center px-4 desktop:group-data-[expanded=true]/side:justify-between`}
      >
        <Link
          href="/app"
          className="flex items-center gap-2 rounded-sm text-ink"
          aria-label="Echo home"
        >
          <LogoMark />
          <span className={`text-display-sm ${SHOW_EXPANDED}`}>echo</span>
        </Link>
        <button
          ref={collapseRef}
          type="button"
          className={`hidden h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink desktop:group-data-[expanded=true]/side:flex`}
          aria-label="Collapse sidebar"
          aria-controls="sidebar"
          aria-expanded="true"
          onClick={() => remember(true)}
        >
          <CollapseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 [scrollbar-width:thin] flex-col gap-6 overflow-x-hidden overflow-y-auto px-3 pt-2 pb-4 [&>*]:shrink-0">
        <Link
          href={ADD_ECHO_HREF}
          aria-keyshortcuts="n"
          className={buttonClasses("primary", `${SHOW_FLEX_EXPANDED} w-full`)}
        >
          <PlusIcon className="h-5 w-5 shrink-0" />
          <span>Add Echo</span>
        </Link>
        <Link
          href={ADD_ECHO_HREF}
          aria-label="Add Echo"
          className={`${SHOW_RAIL} mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-active active:scale-95 motion-reduce:active:scale-100`}
        >
          <PlusIcon className="h-5 w-5 shrink-0" />
        </Link>

        <form role="search" action={NAV.search.href} className={SHOW_EXPANDED}>
          <label htmlFor="sidebar-search" className="sr-only">
            Search your Echoes
          </label>
          <div className="flex h-10 items-center gap-2 rounded-full border border-border-input bg-canvas pr-2 pl-3 focus-within:border-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
            <input
              id="sidebar-search"
              name="q"
              type="search"
              placeholder="Search"
              aria-keyshortcuts="/"
              className="min-w-0 flex-1 bg-transparent text-body-sm text-ink placeholder:text-muted focus-visible:outline-none"
            />
            <kbd
              className="rounded-xs border border-hairline px-1.5 text-caption-sm text-muted"
              aria-hidden
            >
              /
            </kbd>
          </div>
        </form>

        <nav aria-label="Main">
          <ul className="grid grid-cols-1 gap-1">
            {SIDEBAR_NAV.map((id) => (
              <SidebarLink key={id} id={id} active={active === id} />
            ))}
            <li className={SHOW_RAIL}>
              <ul className="grid grid-cols-1">
                <SidebarLink id="search" active={active === "search"} />
              </ul>
            </li>
          </ul>
          <button
            ref={expandRef}
            type="button"
            className={`mx-auto mt-2 hidden h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink desktop:flex desktop:group-data-[expanded=true]/side:hidden`}
            aria-label="Expand sidebar"
            aria-controls="sidebar"
            aria-expanded="false"
            onClick={() => remember(false)}
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
        </nav>
      </div>

      <div className="border-t border-hairline p-3">
        <ul className="grid grid-cols-1 gap-1">
          <SidebarLink id="settings" active={active === "settings"} />
        </ul>
        <AccountMenu
          placement="up"
          email={user.email}
          triggerClassName={`mt-1 flex w-full items-center justify-center gap-3 rounded-sm p-2 text-left transition-colors duration-fast ease-standard hover:bg-surface-soft desktop:group-data-[expanded=true]/side:justify-start`}
          trigger={
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-ink">
                <UserIcon className="h-5 w-5" />
              </span>
              <span className={`${SHOW_EXPANDED} min-w-0 text-left`}>
                <span
                  className="block truncate text-title-sm text-ink"
                  title={user.name ?? user.email}
                >
                  {user.name ?? "Your account"}
                </span>
                <span className="block text-caption-sm text-muted">Private library</span>
              </span>
            </>
          }
        />
      </div>
    </aside>
  );
}
