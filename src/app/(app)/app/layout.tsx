import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/shell/app-frame";
import { AppProviders } from "@/components/shell/app-providers";
import { BottomTabBar, MobileHeader } from "@/components/shell/mobile-chrome";
import { SIDEBAR_COOKIE, isSidebarCollapsed } from "@/components/shell/sidebar-state";
import { SkipLink } from "@/components/ui/skip-link";
import { requireUserPage } from "@/server/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Independent: the session lookup and the cookie read run concurrently.
  const [user, cookieStore] = await Promise.all([requireUserPage(), cookies()]);
  const collapsed = isSidebarCollapsed(cookieStore.get(SIDEBAR_COOKIE)?.value);

  return (
    <div className="bg-surface-soft text-ink">
      <SkipLink />
      <AppProviders>
        <AppFrame initialCollapsed={collapsed} user={{ name: user.name, email: user.email }}>
          <MobileHeader email={user.email} />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 focus-visible:outline-none tablet:px-6 tablet:pb-12 desktop:px-8"
          >
            {children}
          </main>
        </AppFrame>
        <BottomTabBar />
      </AppProviders>
    </div>
  );
}
