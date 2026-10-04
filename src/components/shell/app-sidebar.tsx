"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, use, useRef } from "react";
import { AccentDot } from "@/components/echo/accent-dot";
import { NewCollectionButton } from "@/components/echo/new-collection-button";
import { AddEchoLink } from "@/components/echo/quick-capture";
import { buttonClasses } from "@/components/ui/button-classes";
import { Skeleton } from "@/components/ui/skeleton";
import { CollapseIcon, ExpandIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import type { SidebarCollectionsDto } from "@/types/echo";
import { AccountAvatar } from "./account-avatar";
import { AccountMenu } from "./account-menu";
import { NAV, SIDEBAR_NAV, activeNavId, type NavId } from "./nav-items";
import { SIDEBAR_SEARCH_ID } from "./search-ids";

type AppSidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  user: { name: string | null; email: string };
  /** Streams in; null when it failed to load. */
  collections: Promise<SidebarCollectionsDto | null>;
};

/*
 * Tablet shows the 96px rail. Desktop shows the 256px sidebar unless the user collapsed it.
 * "Expanded" styles are therefore all `desktop:group-data-[expanded=true]/side:`, so the server
 * renders the right layout from the cookie and nothing shifts after hydration. Tailwind only
 * detects literal class strings, so keep the variant written out in full.
 */
// The active item is a neutral surface-strong fill with weight 600, never the accent.
const ITEM = [
  "mx-auto flex w-20 flex-col items-center justify-center gap-1 rounded-md py-2 text-badge text-body transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink",
  "aria-[current=page]:bg-surface-strong aria-[current=page]:font-semibold aria-[current=page]:text-ink",
  `desktop:group-data-[expanded=true]/side:h-11 desktop:group-data-[expanded=true]/side:w-full desktop:group-data-[expanded=true]/side:flex-row desktop:group-data-[expanded=true]/side:justify-start desktop:group-data-[expanded=true]/side:gap-3 desktop:group-data-[expanded=true]/side:px-3 desktop:group-data-[expanded=true]/side:py-0 desktop:group-data-[expanded=true]/side:text-body-md`,
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
 * The expanded sidebar's Collections section: a heading with "New collection", then the list,
 * which streams in behind its own Suspense boundary.
 *
 * @param props - The streaming collections and the current path.
 * @returns The section.
 */
function SidebarCollections({
  collections,
  pathname,
}: {
  collections: Promise<SidebarCollectionsDto | null>;
  pathname: string;
}) {
  return (
    <section
      aria-labelledby="sidebar-collections"
      className={`${SHOW_EXPANDED} border-t border-hairline-soft pt-3`}
    >
      <div className="flex items-center justify-between pl-3">
        <h2 id="sidebar-collections" className="text-label text-muted uppercase">
          Collections
        </h2>
        <NewCollectionButton
          aria-label="New collection"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-strong hover:text-ink"
        >
          <PlusIcon className="h-4 w-4" />
        </NewCollectionButton>
      </div>
      <Suspense fallback={<SidebarCollectionsSkeleton />}>
        <SidebarCollectionList collections={collections} pathname={pathname} />
      </Suspense>
    </section>
  );
}

/**
 * Three placeholder rows shaped like collection rows, shown while the list streams in.
 *
 * @returns The skeleton.
 */
function SidebarCollectionsSkeleton() {
  return (
    <div aria-hidden className="mt-1 flex flex-col">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex h-10 items-center gap-3 px-3">
          <div className="h-2 w-2 rounded-full bg-surface-strong" />
          <Skeleton className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

/**
 * The first few collections (accent dot, name, count), then "All collections". It is a
 * one-column grid, so long names truncate instead of widening the sidebar.
 *
 * @param props - The streaming collections and the current path.
 * @returns The list.
 */
function SidebarCollectionList({
  collections: promise,
  pathname,
}: {
  collections: Promise<SidebarCollectionsDto | null>;
  pathname: string;
}) {
  const collections = use(promise);
  if (!collections) {
    return <p className="mt-1 px-3 text-body-sm text-muted">Couldn&apos;t load collections.</p>;
  }
  if (collections.total === 0) {
    return <p className="mt-1 px-3 text-body-sm text-muted">No collections yet.</p>;
  }
  return (
    <>
      <ul className="mt-1 grid grid-cols-1 gap-0.5">
        {collections.items.map((collection) => {
          const href = `/app/collections/${collection.id}`;
          return (
            <li key={collection.id} className="min-w-0">
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className="flex h-10 min-w-0 items-center gap-2.5 rounded-md px-3 text-body-sm text-body transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink aria-[current=page]:bg-surface-strong aria-[current=page]:font-semibold aria-[current=page]:text-ink"
              >
                <AccentDot accent={collection.accent} />
                <span className="min-w-0 flex-1 truncate" title={collection.name}>
                  {collection.name}
                </span>
                <span className="shrink-0 text-muted tabular-nums">
                  <span className="sr-only">, </span>
                  {collection.echoCount}
                  <span className="sr-only"> {collection.echoCount === 1 ? "Echo" : "Echoes"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/app/collections"
        className="mt-0.5 flex h-10 items-center rounded-md px-3 text-body-sm font-medium text-primary transition-colors duration-fast ease-standard hover:bg-surface-soft hover:underline"
      >
        All collections
      </Link>
    </>
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
        className={`flex h-19 items-center justify-center px-4 desktop:group-data-[expanded=true]/side:justify-between desktop:group-data-[expanded=true]/side:pl-5`}
      >
        {/* The wordmark is set in the interface sans; the serif is kept for quotes. */}
        <Link
          href="/app"
          className="flex h-11 min-w-11 items-center rounded-md text-display-sm tracking-tight text-ink"
          aria-label="Echo home"
        >
          Echo
        </Link>
        <button
          ref={collapseRef}
          type="button"
          className={`hidden h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-strong hover:text-ink desktop:group-data-[expanded=true]/side:flex`}
          aria-label="Collapse sidebar"
          aria-controls="sidebar"
          aria-expanded="true"
          onClick={() => remember(true)}
        >
          <CollapseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 [scrollbar-width:thin] flex-col gap-4 overflow-x-hidden overflow-y-auto px-2 pb-4 desktop:group-data-[expanded=true]/side:px-4 [&>*]:shrink-0">
        {/* The wrapper owns visibility: `hidden` on the link itself loses to the button's inline-flex. */}
        <div className={SHOW_EXPANDED}>
          <AddEchoLink className={buttonClasses("primary", "w-full")}>
            <PlusIcon className="h-5 w-5 shrink-0" />
            <span>Add Echo</span>
          </AddEchoLink>
        </div>
        <AddEchoLink
          aria-label="Add Echo"
          className={`${SHOW_RAIL} mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-hover active:scale-95 active:bg-primary-active motion-reduce:active:scale-100`}
        >
          <PlusIcon className="h-6 w-6 shrink-0" />
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
          <div className="flex h-11 items-center gap-2 rounded-md border border-border-input bg-canvas pr-2 pl-3 transition-colors duration-fast ease-standard focus-within:border-ink focus-within:ring-1 focus-within:ring-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary focus-within:ring-inset hover:border-ink">
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
              className="min-w-0 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted focus-visible:outline-none"
            />
            <kbd
              className="rounded-sm border border-hairline px-1.5 text-caption-sm text-muted"
              aria-hidden
            >
              /
            </kbd>
          </div>
        </form>

        <nav aria-label="Main">
          <ul className="grid grid-cols-1 gap-0.5">
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
            className={`mx-auto mt-2 hidden h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-strong hover:text-ink desktop:flex desktop:group-data-[expanded=true]/side:hidden`}
            aria-label="Expand sidebar"
            aria-controls="sidebar"
            aria-expanded="false"
            onClick={() => remember(false)}
          >
            <ExpandIcon className="h-5 w-5" />
          </button>
        </nav>

        <SidebarCollections collections={collections} pathname={pathname} />
      </div>

      <div className="border-t border-hairline-soft px-2 py-3 desktop:group-data-[expanded=true]/side:px-4">
        <ul className="grid grid-cols-1 gap-0.5">
          <SidebarLink id="settings" active={active === "settings"} />
        </ul>
        <AccountMenu
          placement="up"
          email={user.email}
          triggerClassName={`mt-1 flex min-h-13 w-full items-center justify-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-fast ease-standard hover:bg-surface-soft desktop:group-data-[expanded=true]/side:justify-start`}
          trigger={
            <>
              <AccountAvatar
                name={user.name}
                email={user.email}
                size="md"
                className="desktop:group-data-[expanded=true]/side:h-8 desktop:group-data-[expanded=true]/side:w-8"
              />
              <span className={`${SHOW_EXPANDED} min-w-0 text-left`}>
                <span
                  className="block truncate text-body-sm font-semibold text-ink"
                  title={user.name ?? user.email}
                >
                  {user.name ?? "Your account"}
                </span>
                <span className="block truncate text-badge text-muted" title={user.email}>
                  {user.email}
                </span>
              </span>
            </>
          }
        />
      </div>
    </aside>
  );
}
