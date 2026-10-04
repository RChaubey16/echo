"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { CONTROL } from "./field";
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
      <label htmlFor={selectId} className={cn("text-caption", inline ? "text-muted" : "text-ink")}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            CONTROL,
            "appearance-none border-border-input pr-10", // audit-ignore: room for the chevron
            inline ? "h-11" : "h-13",
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
