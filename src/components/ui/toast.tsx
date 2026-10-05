"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastInput = {
  message: string;
  /** One optional follow-up, e.g. { label: "View", href: "/app/echoes/…" }. */
  action?: { label: string; href: string };
};

type Toast = ToastInput & { id: number };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

const DISMISS_MS = 4000;
const EXIT_MS = 150;

/**
 * Returns the function that shows a toast. Toasts confirm actions; form errors stay inline.
 *
 * @returns A function that queues a toast.
 */
export function useToast(): (toast: ToastInput) => void {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}

/** Hosts the toast region (aria-live="polite") at the bottom center, above the mobile tab bar. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((toast: ToastInput) => {
    const id = ++nextId.current;
    // Keep it calm: one toast at a time, the newest wins.
    setToasts([{ ...toast, id }]);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex flex-col items-center gap-2 px-4 tablet:bottom-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Renders one toast and dismisses it after 4s, pausing while hovered or focused.
 *
 * @param props - The toast and its dismiss callback.
 * @returns The toast element.
 */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (paused || leaving) return;
    // After 4s it fades out (150ms, faster than it arrived), then leaves the region.
    const timer = window.setTimeout(() => setLeaving(true), DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [paused, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(onDismiss, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, onDismiss]);

  return (
    <div
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex min-h-13 max-w-md items-center gap-3 rounded-md bg-ink py-1 pr-2 pl-4 text-body-md text-canvas shadow-float",
        leaving ? "animate-fade-out" : "animate-rise-in motion-reduce:animate-fade-in",
      )}
    >
      <span className="min-w-0 flex-1 py-2">{toast.message}</span>
      {toast.action && (
        <Link
          href={toast.action.href}
          onClick={onDismiss}
          className="inline-flex h-11 shrink-0 items-center rounded-md px-3 font-semibold text-canvas underline underline-offset-4 focus-visible:outline-canvas"
        >
          {toast.action.label}
        </Link>
      )}
    </div>
  );
}
