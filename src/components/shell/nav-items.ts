import type { ComponentType, SVGProps } from "react";
import {
  CalendarIcon,
  FolderIcon,
  HeartIcon,
  HomeIcon,
  LibraryIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/ui/icons";

export type NavId =
  "home" | "library" | "favorites" | "collections" | "revisits" | "search" | "settings";

export type NavItem = {
  id: NavId;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const NAV: Record<NavId, NavItem> = {
  home: { id: "home", label: "Home", href: "/app", icon: HomeIcon },
  library: { id: "library", label: "Library", href: "/app/echoes", icon: LibraryIcon },
  favorites: { id: "favorites", label: "Favorites", href: "/app/favorites", icon: HeartIcon },
  collections: {
    id: "collections",
    label: "Collections",
    href: "/app/collections",
    icon: FolderIcon,
  },
  revisits: { id: "revisits", label: "Revisits", href: "/app/revisits", icon: CalendarIcon },
  search: { id: "search", label: "Search", href: "/app/search", icon: SearchIcon },
  settings: { id: "settings", label: "Settings", href: "/app/settings", icon: SettingsIcon },
};

export const SIDEBAR_NAV: NavId[] = ["home", "library", "favorites", "collections", "revisits"];
export const MOBILE_TABS: Array<NavId | "add"> = [
  "home",
  "library",
  "add",
  "search",
  "collections",
];
export const ADD_ECHO_HREF = "/app/echoes/new";

/**
 * Finds the nav item that matches the current path, preferring the longest match.
 *
 * @param pathname - The current URL path.
 * @returns The active nav id, or null when no item matches.
 */
export function activeNavId(pathname: string): NavId | null {
  let best: NavItem | null = null;
  for (const item of Object.values(NAV)) {
    const matches =
      item.href === "/app"
        ? pathname === "/app"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && (!best || item.href.length > best.href.length)) best = item;
  }
  return best?.id ?? null;
}
