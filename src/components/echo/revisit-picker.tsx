"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  REVISIT_PRESETS,
  addDays,
  addMonths,
  dayKey,
  fromDayKey,
  monthGrid,
  presetDay,
  revisitIso,
  revisitRange,
  shortRevisitDate,
  type DayKey,
} from "@/lib/revisit-dates";

type RevisitPickerProps = {
  /** The scheduled Revisit as an ISO date-time, or null when none is set. */
  value: string | null;
  /** Called with the new ISO date-time, or null when the Revisit is removed. */
  onChange: (value: string | null) => void;
  /** The time zone the server rendered the date in, so the text matches after hydration. */
  timeZone?: string;
  /** Disables every control, e.g. while saving. */
  disabled?: boolean;
  /** The visible heading's id, so the group is labelled by it. */
  labelledBy?: string;
  /** An inline error from the server, shown under the controls. */
  error?: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Chooses a day to see an Echo again: three presets, or a calendar for any day from tomorrow up to
 * ten years away. Once chosen, the date reads as text with Change and Cancel revisit.
 */
export function RevisitPicker({
  value,
  onChange,
  timeZone,
  disabled = false,
  labelledBy,
  error,
}: RevisitPickerProps) {
  const [editing, setEditing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const changeRef = useRef<HTMLButtonElement>(null);
  const firstChipRef = useRef<HTMLButtonElement>(null);
  const errorId = useId();
  const showChoices = value === null || editing;
  // After a choice, focus moves to "Change" once it exists and is enabled again (a parent may
  // disable the picker while it saves), so keyboard users aren't dropped on the page body.
  const focusChange = useRef(false);

  useEffect(() => {
    if (!focusChange.current || disabled || !changeRef.current) return;
    focusChange.current = false;
    changeRef.current.focus();
  }, [value, disabled, showChoices]);

  const choose = (key: DayKey) => {
    focusChange.current = true;
    onChange(revisitIso(key));
    setEditing(false);
    setCalendarOpen(false);
  };

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-3"
    >
      {!showChoices && value && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="inline-flex items-center gap-2 text-body-md font-medium text-ink">
            <CalendarIcon aria-hidden className="h-4.5 w-4.5 shrink-0 text-mark-ochre" />
            Revisit on{" "}
            <time dateTime={value} className="tabular-nums">
              {shortRevisitDate(value, timeZone)}
            </time>
          </p>
          <div className="flex items-center gap-1">
            <button
              ref={changeRef}
              type="button"
              disabled={disabled}
              onClick={() => {
                setEditing(true);
                requestAnimationFrame(() => firstChipRef.current?.focus());
              }}
              className={buttonClasses("tertiary", "px-2.5")}
            >
              Change
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(null)}
              className={buttonClasses("tertiary", "px-2.5 font-medium")}
            >
              Cancel revisit
            </button>
          </div>
        </div>
      )}

      {showChoices && (
        <div className="flex flex-wrap gap-2">
          {REVISIT_PRESETS.map((preset, index) => (
            <button
              key={preset.id}
              ref={index === 0 ? firstChipRef : undefined}
              type="button"
              disabled={disabled}
              onClick={() => choose(presetDay(preset.months, new Date()))}
              className={cn(
                "inline-flex h-11 items-center gap-1.5 rounded-md border px-3.5 text-body-md transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:border-hairline disabled:text-muted-soft",
                "border-border-input font-medium text-ink hover:border-ink hover:bg-surface-strong",
              )}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled}
            aria-expanded={calendarOpen}
            onClick={() => setCalendarOpen((open) => !open)}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-md border px-3.5 text-body-md transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:border-hairline disabled:text-muted-soft",
              calendarOpen
                ? "border-2 border-ink bg-surface-strong px-3.25 font-semibold text-ink"
                : "border-border-input font-medium text-ink hover:border-ink hover:bg-surface-strong",
            )}
          >
            {calendarOpen ? (
              <CheckIcon aria-hidden className="h-4 w-4" />
            ) : (
              <CalendarIcon aria-hidden className="h-4 w-4" />
            )}
            Pick a date
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setCalendarOpen(false);
                requestAnimationFrame(() => changeRef.current?.focus());
              }}
              className={buttonClasses("tertiary", "px-2.5")}
            >
              Keep current date
            </button>
          )}
        </div>
      )}

      {showChoices && calendarOpen && (
        <RevisitCalendar
          selected={value ? dayKey(new Date(value)) : null}
          onSelect={choose}
          disabled={disabled}
        />
      )}

      {error && (
        <p id={errorId} role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

type RevisitCalendarProps = {
  selected: DayKey | null;
  onSelect: (key: DayKey) => void;
  disabled: boolean;
};

/**
 * A month calendar (WAI-ARIA date grid): arrow keys move by day and week, Home/End to the week's
 * edges, Page Up/Down by month, Enter or Space chooses. Days before tomorrow are disabled.
 */
function RevisitCalendar({ selected, onSelect, disabled }: RevisitCalendarProps) {
  const [now] = useState(() => new Date());
  const { min, max } = revisitRange(now);
  const today = dayKey(now);
  const [focused, setFocused] = useState<DayKey>(() => selected ?? min);
  const [moved, setMoved] = useState(false);
  const gridRef = useRef<HTMLTableElement>(null);
  const titleId = useId();
  const focusedDate = fromDayKey(focused);
  const year = focusedDate.getFullYear();
  const month = focusedDate.getMonth();
  const monthLabel = focusedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Keyboard moves keep focus on the active day; opening the calendar leaves focus on its toggle.
  useEffect(() => {
    if (!moved) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focused}"]`)?.focus();
  }, [focused, moved]);

  const clamp = (key: DayKey) => (key < min ? min : key > max ? max : key);
  const move = (date: Date) => {
    setMoved(true);
    setFocused(clamp(dayKey(date)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const steps: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusedDate, -1),
      ArrowRight: () => addDays(focusedDate, 1),
      ArrowUp: () => addDays(focusedDate, -7),
      ArrowDown: () => addDays(focusedDate, 7),
      Home: () => addDays(focusedDate, -focusedDate.getDay()),
      End: () => addDays(focusedDate, 6 - focusedDate.getDay()),
      PageUp: () => addMonths(focusedDate, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focusedDate, event.shiftKey ? 12 : 1),
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    move(step());
  };

  const canGoBack = dayKey(new Date(year, month, 0)) >= min;
  const canGoForward = dayKey(new Date(year, month + 1, 1)) <= max;
  const navButton =
    "flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors duration-fast ease-standard hover:bg-surface-strong disabled:cursor-not-allowed disabled:text-muted-soft disabled:hover:bg-transparent";

  return (
    <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-3 tablet:p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoBack || disabled}
          onClick={() => move(addMonths(focusedDate, -1))}
          className={navButton}
        >
          <ChevronLeftIcon aria-hidden className="h-5 w-5" />
        </button>
        <h3 id={titleId} aria-live="polite" className="text-title-md text-ink">
          {monthLabel}
        </h3>
        <button
          type="button"
          aria-label="Next month"
          disabled={!canGoForward || disabled}
          onClick={() => move(addMonths(focusedDate, 1))}
          className={navButton}
        >
          <ChevronRightIcon aria-hidden className="h-5 w-5" />
        </button>
      </div>
      <table
        ref={gridRef}
        role="grid"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="mt-2 w-full table-fixed border-collapse"
      >
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day}
                scope="col"
                abbr={day}
                className="h-8 text-center text-caption-sm text-muted"
              >
                {day.slice(0, 2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(year, month).map((week, row) => (
            <tr key={row}>
              {week.map((key, column) => {
                if (!key) return <td key={column} />;
                const out = key < min || key > max;
                const isSelected = key === selected;
                const date = fromDayKey(key);
                return (
                  <td key={key} className="p-0.5 text-center">
                    <button
                      type="button"
                      data-day={key}
                      tabIndex={key === focused ? 0 : -1}
                      disabled={out || disabled}
                      aria-pressed={isSelected}
                      aria-current={key === today ? "date" : undefined}
                      aria-label={date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      onClick={() => onSelect(key)}
                      className={cn(
                        "mx-auto flex h-10 w-full max-w-11 items-center justify-center rounded-md text-body-sm tabular-nums transition-colors duration-fast ease-standard",
                        isSelected
                          ? "bg-primary font-semibold text-on-primary"
                          : "text-ink hover:bg-surface-strong disabled:hover:bg-transparent",
                        key === today && !isSelected && "ring-1 ring-hairline",
                        out && "cursor-not-allowed text-muted-soft line-through",
                      )}
                    >
                      {date.getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
