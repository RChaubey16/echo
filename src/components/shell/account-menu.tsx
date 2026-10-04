"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { SignOutIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { NAV, type NavId } from "./nav-items";
import { signOutAction } from "./sign-out";

type AccountMenuProps = {
  /** The button content (avatar, and the name when there is room). */
  trigger: ReactNode;
  triggerClassName: string;
  /** Extra nav destinations to list above Sign out (mobile moves some nav here). */
  links?: NavId[];
  /** "up" opens above the trigger (sidebar footer), "down" below it (mobile header). */
  placement: "up" | "down";
  email: string;
};

const ITEM =
  "flex h-10 w-full items-center gap-3 px-4 text-left text-body-md text-ink transition-colors duration-fast ease-standard hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:outline-none";

/**
 * Lists the menu's focusable items in order.
 *
 * @param menu - The menu element.
 * @returns The menu items.
 */
function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')) : [];
}

export function AccountMenu({
  trigger,
  triggerClassName,
  links = [],
  placement,
  email,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuItems(menuRef.current)[0]?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems(menuRef.current);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(items.length - 1);
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute z-40 min-w-56 animate-menu-in rounded-lg bg-canvas py-2 shadow-float motion-reduce:animate-fade-in",
            placement === "up"
              ? "bottom-full left-0 mb-2 origin-bottom-left"
              : "top-full right-0 mt-2 origin-top-right",
          )}
        >
          <p className="truncate px-4 pt-1 pb-2 text-caption-sm text-muted" title={email}>
            {email}
          </p>
          {links.map((id) => {
            const item = NAV[id];
            const Icon = item.icon;
            return (
              <Link
                key={id}
                href={item.href}
                role="menuitem"
                className={ITEM}
                onClick={() => close(false)}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted" />
                {item.label}
              </Link>
            );
          })}
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className={ITEM}>
              <SignOutIcon className="h-5 w-5 shrink-0 text-muted" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
