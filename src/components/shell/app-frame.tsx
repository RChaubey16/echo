"use client";

import { useState, type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SIDEBAR_COOKIE } from "./sidebar-state";

type AppFrameProps = {
  initialCollapsed: boolean;
  user: { name: string | null; email: string };
  children: ReactNode;
};

/** Holds the sidebar's collapse state so the sidebar and the content offset stay in step. */
export function AppFrame({ initialCollapsed, user, children }: AppFrameProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const onCollapsedChange = (value: boolean) => {
    setCollapsed(value);
    // Remembered per browser; read on the server so the next load renders the same layout.
    document.cookie = `${SIDEBAR_COOKIE}=${value ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div data-expanded={String(!collapsed)} className="group/app">
      <AppSidebar collapsed={collapsed} onCollapsedChange={onCollapsedChange} user={user} />
      <div
        className={
          "flex min-h-dvh flex-col tablet:pl-24 desktop:group-data-[expanded=true]/app:pl-64" // audit-ignore: offsets equal the rail (w-24) and sidebar (w-64) widths
        }
      >
        {children}
      </div>
    </div>
  );
}
