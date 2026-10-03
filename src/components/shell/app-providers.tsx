"use client";

import { useEffect, type ReactNode } from "react";
import { QuickCaptureProvider } from "@/components/echo/quick-capture";
import { ToastProvider } from "@/components/ui/toast";

/** Client-side context for the signed-in app: toasts and the Add Echo dialog. */
export function AppProviders({ children }: { children: ReactNode }) {
  // Marks the page interactive; E2E tests wait for it before clicking or typing.
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);

  return (
    <ToastProvider>
      <QuickCaptureProvider>{children}</QuickCaptureProvider>
    </ToastProvider>
  );
}
