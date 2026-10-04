"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icons";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string;
  /** Show the label beside the control (toolbars) instead of above it (forms). */
  inline?: boolean;
  options: ReadonlyArray<{ value: string; label: string }>;
};

/** A native select in Echo's input styling, with a visible label. */
export function Select({ label, inline = false, options, className, id, ...rest }: SelectProps) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <div className={cn("flex", inline ? "items-center gap-2" : "flex-col gap-1.5", className)}>
      <label htmlFor={selectId} className="text-caption text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className="h-10 w-full appearance-none rounded-md border border-border-input bg-canvas pr-8 pl-3 text-body-md text-ink focus:border-ink focus:outline-1 focus:-outline-offset-2 focus:outline-ink disabled:bg-surface-soft disabled:text-muted-soft"
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
