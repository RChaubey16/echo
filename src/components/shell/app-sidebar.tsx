"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { AccentDot } from "@/components/echo/accent-dot";
import { LogoMark } from "@/components/echo/logo";
import { NewCollectionButton } from "@/components/echo/new-collection-button";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { buttonClasses } from "@/components/ui/button-classes";
import {
  ArrowRightIcon,
  CollapseIcon,
  ExpandIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import type { CollectionDto } from "@/types/echo";
import { AccountMenu } from "./account-menu";
import { NAV, SIDEBAR_NAV, activeNavId, type NavId } from "./nav-items";
import { SIDEBAR_SEARCH_ID } from "./search-shortcut";

type AppSidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  user: { name: string | null; email: string };
  collections: CollectionDto[];
};

const SIDEBAR_COLLECTIONS = 5;

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

/**
 * The expanded sidebar's Collections list: up to five collections, then "All collections". It is
 * a one-column grid, so long names truncate instead of widening the sidebar.
 *
 * @param props - The user's collections and the current path.
 * @returns The section.
 */
function SidebarCollections({
  collections,
  pathname,
}: {
  collections: CollectionDto[];
  pathname: string;
}) {
  return (
    <section aria-labelledby="sidebar-collections" className={SHOW_EXPANDED}>
      <div className="flex items-center justify-between pr-1 pl-3">
        <h2 id="sidebar-collections" className="text-caption text-muted">
          Collections
        </h2>
        <NewCollectionButton
          aria-label="New collection"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard before:absolute before:-inset-1.5 hover:bg-surface-soft hover:text-ink"
        >
          <PlusIcon className="h-4 w-4" />
        </NewCollectionButton>
      </div>
      {collections.length === 0 ? (
        <p className="mt-1 px-3 text-body-sm text-muted">No collections yet.</p>
      ) : (
        <ul className="mt-1 grid grid-cols-1 gap-0.5">
          {collections.slice(0, SIDEBAR_COLLECTIONS).map((collection) => {
            const href = `/app/collections/${collection.id}`;
            const current = pathname === href;
            return (
              <li key={collection.id} className="min-w-0">
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className="flex h-10 min-w-0 items-center gap-3 rounded-sm px-3 text-body-sm text-body transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink aria-[current=page]:bg-surface-soft aria-[current=page]:font-semibold aria-[current=page]:text-ink"
                >
                  <AccentDot accent={collection.accent} />
                  <span className="min-w-0 flex-1 truncate" title={collection.name}>
                    {collection.name}
                  </span>
                  <span className="shrink-0 text-muted tabular-nums">
                    <span className="sr-only">, </span>
                    {collection.echoCount}
                    <span className="sr-only">
                      {" "}
                      {collection.echoCount === 1 ? "Echo" : "Echoes"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {collections.length > 0 && (
        <Link
          href="/app/collections"
          className="mt-0.5 flex h-10 items-center gap-1.5 rounded-sm px-3 text-body-sm text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink"
        >
          All collections
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}

export function AppSidebar({ collapsed, onCollapsedChange, user, collections }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
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
        {/* The wrapper owns visibility: `hidden` on the link itself loses to the button's inline-flex. */}
        <div className={SHOW_EXPANDED}>
          <AddEchoLink className={buttonClasses("primary", "w-full")}>
            <PlusIcon className="h-5 w-5 shrink-0" />
            <span>Add Echo</span>
          </AddEchoLink>
        </div>
        <AddEchoLink
          aria-label="Add Echo"
          className={`${SHOW_RAIL} mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-active active:scale-95 motion-reduce:active:scale-100`}
        >
          <PlusIcon className="h-5 w-5 shrink-0" />
        </AddEchoLink>

        <form
          role="search"
          action={NAV.search.href}
          className={SHOW_EXPANDED}
          onSubmit={(event) => {
            // Navigate in place; the plain GET action is the fallback before hydration.
            event.preventDefault();
            const q = new FormData(event.currentTarget).get("q")?.toString().trim() ?? "";
            router.push(q ? `${NAV.search.href}?q=${encodeURIComponent(q)}` : NAV.search.href);
          }}
        >
          <label htmlFor={SIDEBAR_SEARCH_ID} className="sr-only">
            Search your Echoes
          </label>
          <div className="flex h-10 items-center gap-2 rounded-full border border-border-input bg-canvas pr-2 pl-3 focus-within:border-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
            <input
              id={SIDEBAR_SEARCH_ID}
              name="q"
              type="search"
              onKeyDown={(event) => {
                // Esc clears and leaves the field.
                if (event.key === "Escape") {
                  event.currentTarget.value = "";
                  event.currentTarget.blur();
                }
              }}
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

        <SidebarCollections collections={collections} pathname={pathname} />
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
