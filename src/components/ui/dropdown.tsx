"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/use-dismiss";

type DropdownItem = {
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onSelect: () => void;
  /** Destructive actions read in the error color. */
  danger?: boolean;
};

type DropdownProps = {
  /** The trigger's accessible name, e.g. "More actions for this collection". */
  label: string;
  trigger: ReactNode;
  triggerClassName: string;
  items: DropdownItem[];
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "end";
};

const ITEM =
  "flex h-11 w-full items-center gap-2.5 rounded-md px-3 text-left text-body-md transition-colors duration-fast ease-standard hover:bg-surface-strong focus-visible:bg-surface-strong focus-visible:outline-none";

/**
 * A menu button: arrows, Home/End and first-letter typeahead move between items, Esc closes and
 * returns focus to the trigger.
 */
export function Dropdown({
  label,
  trigger,
  triggerClassName,
  items,
  align = "end",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => [triggerRef, menuRef], []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);
  useDismiss(open, refs, close);

  const buttons = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (open) buttons()[0]?.focus();
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = buttons();
    const index = all.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => all[(i + all.length) % all.length]?.focus();
    if (event.key === "ArrowDown") focusAt(index + 1);
    else if (event.key === "ArrowUp") focusAt(index - 1);
    else if (event.key === "Home") focusAt(0);
    else if (event.key === "End") focusAt(all.length - 1);
    else if (event.key === "Tab") return close(false);
    else if (event.key.length === 1 && /\S/.test(event.key)) {
      const letter = event.key.toLowerCase();
      const match = items.findIndex(
        (item, i) => i > index && item.label.toLowerCase().startsWith(letter),
      );
      const fallback = items.findIndex((item) => item.label.toLowerCase().startsWith(letter));
      if (match >= 0 || fallback >= 0) focusAt(match >= 0 ? match : fallback);
    } else return;
    event.preventDefault();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={triggerClassName}
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
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute top-full z-40 mt-2 min-w-56 animate-menu-in rounded-lg bg-canvas p-1.5 shadow-float motion-reduce:animate-fade-in",
            align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          )}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                {/* A hairline sets a destructive action apart from the rest. */}
                {item.danger && index > 0 && (
                  <div role="separator" className="mx-0 my-1.5 h-px bg-hairline-soft" />
                )}
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className={cn(ITEM, item.danger ? "text-error" : "text-ink")}
                  onClick={() => {
                    // Focus goes back to the trigger first, so a dialog opened by the item returns
                    // focus there when it closes.
                    close(true);
                    item.onSelect();
                  }}
                >
                  {Icon && (
                    <Icon className={cn("h-4.5 w-4.5 shrink-0", !item.danger && "text-muted")} />
                  )}
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
