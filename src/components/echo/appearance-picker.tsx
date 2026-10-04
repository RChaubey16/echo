"use client";

import { useId, useState, type ComponentType, type SVGProps } from "react";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { applyTheme, type Theme } from "@/lib/theme";
import type { ThemeChoice } from "@/server/validation/user";

const OPTIONS: Array<{
  value: ThemeChoice;
  label: string;
  hint: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { value: "light", label: "Light", hint: "Always light", icon: SunIcon },
  { value: "dark", label: "Dark", hint: "Always dark", icon: MoonIcon },
  { value: "system", label: "System", hint: "Match this device", icon: MonitorIcon },
];

/**
 * Turns a choice into the theme to apply, where System applies none.
 *
 * @param choice - Light, Dark or System.
 * @returns The theme, or undefined for System.
 */
function themeOf(choice: ThemeChoice): Theme | undefined {
  return choice === "system" ? undefined : choice;
}

/**
 * Settings › Appearance: Light, Dark or System as a radio group. The page switches at once
 * (optimistic) and rolls back with a toast if the account can't be updated.
 */
export function AppearancePicker({ stored }: { stored: Theme | null }) {
  const toast = useToast();
  const id = useId();
  const [choice, setChoice] = useState<ThemeChoice>(stored ?? "system");

  const choose = async (next: ThemeChoice) => {
    const previous = choice;
    if (next === previous) return;
    setChoice(next);
    applyTheme(themeOf(next));
    try {
      await api.updateMe({ theme: next });
    } catch (error) {
      setChoice(previous);
      applyTheme(themeOf(previous));
      toast({ message: failureMessage(error, "Couldn't change the theme.") });
    }
  };

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const checked = choice === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "relative flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors duration-fast ease-standard has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                checked
                  ? "border-ink bg-surface-soft"
                  : "border-border-input bg-canvas hover:bg-surface-soft",
              )}
            >
              <input
                type="radio"
                name={`${id}-theme`}
                value={option.value}
                checked={checked}
                onChange={() => void choose(option.value)}
                className="sr-only"
              />
              <Icon className={cn("h-5 w-5 shrink-0", checked ? "text-ink" : "text-muted")} />
              <span className="flex min-w-0 flex-col">
                <span className={cn("text-body-md text-ink", checked && "font-semibold")}>
                  {option.label}
                </span>
                <span className="text-body-sm text-muted">{option.hint}</span>
              </span>
              {checked && <CheckIcon className="ml-auto h-5 w-5 shrink-0 text-ink" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
