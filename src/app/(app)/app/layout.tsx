import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/shell/app-frame";
import { SIDEBAR_COLLECTIONS } from "@/components/shell/sidebar-state";
import { AppProviders } from "@/components/shell/app-providers";
import { BottomTabBar, MobileHeader } from "@/components/shell/mobile-chrome";
import { SIDEBAR_COOKIE, isSidebarCollapsed } from "@/components/shell/sidebar-state";
import { ThemeSync } from "@/components/shell/theme-sync";
import { TimeZoneSync } from "@/components/shell/time-zone-sync";
import { SkipLink } from "@/components/ui/skip-link";
import { logger } from "@/lib/logger";
import { requireUserPage } from "@/server/auth";
import { listSidebarCollections } from "@/server/services/collections";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Independent: the session lookup and the cookie read run concurrently.
  const [user, cookieStore] = await Promise.all([requireUserPage(), cookies()]);
  const collapsed = isSidebarCollapsed(cookieStore.get(SIDEBAR_COOKIE)?.value);
  // Not awaited: the shell and the page render straight away, and the sidebar's collection list
  // streams in behind its own Suspense boundary. A failure there leaves the rest of the app usable.
  const collections = listSidebarCollections(user.id, SIDEBAR_COLLECTIONS).catch(() => {
    logger.error("sidebar collections failed", { route: "/app layout", code: "INTERNAL_ERROR" });
    return null;
  });

  return (
    <div className="bg-paper text-ink">
      <SkipLink />
      <AppProviders>
        <AppFrame
          initialCollapsed={collapsed}
          user={{ name: user.name, email: user.email }}
          collections={collections}
        >
          <MobileHeader name={user.name} email={user.email} />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-28 focus-visible:outline-none tablet:px-6 tablet:pb-12 desktop:px-8"
          >
            {children}
          </main>
        </AppFrame>
        <BottomTabBar />
        <TimeZoneSync stored={user.timezone} />
        <ThemeSync stored={user.theme} />
      </AppProviders>
    </div>
  );
}
