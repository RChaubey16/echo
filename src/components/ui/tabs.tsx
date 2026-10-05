"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type TabItem = { id: string; label: string; content: ReactNode };

type TabsProps = {
  /** Names the tab list for screen readers. */
  label: string;
  items: readonly TabItem[];
  /** The initially selected tab; defaults to the first. */
  defaultTab?: string;
  className?: string;
};

/**
 * In-page tabs: a 2px ink underline marks the selected tab; the rest are quiet. Arrow keys,
 * Home and End move between tabs and select them; Tab moves into the panel. For navigation between
 * pages, use links with `aria-current` instead.
 */
export function Tabs({ label, items, defaultTab, className }: TabsProps) {
  const baseId = useId();
  const [selected, setSelected] = useState(defaultTab ?? items[0]?.id);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === selected);
    const targets: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = items[(targets[event.key]! + items.length) % items.length];
    if (!next) return;
    setSelected(next.id);
    tabRefs.current.get(next.id)?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex [scrollbar-width:none] gap-1 overflow-x-auto border-b border-hairline"
      >
        {items.map((item) => {
          const active = item.id === selected;
          return (
            <button
              key={item.id}
              ref={(node) => {
                if (node) tabRefs.current.set(item.id, node);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(item.id)}
              className={cn(
                "-mb-px h-12 shrink-0 rounded-t-md border-b-2 px-3.5 text-nav-link whitespace-nowrap transition-colors duration-fast ease-standard",
                active
                  ? "border-ink text-ink"
                  : "border-transparent font-medium text-body hover:bg-surface-strong hover:text-ink",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== selected}
          tabIndex={0}
          className="pt-6 focus-visible:outline-offset-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
