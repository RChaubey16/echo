"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { chipClasses } from "@/components/ui/chip";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { TAG_NAME_MAX, TAGS_PER_ECHO_MAX, normalizeTagName } from "@/server/validation/tag";

const MAX_OPTIONS = 8;

type TagInputProps = {
  /** The input's id, for the field's `<label htmlFor>`. */
  id: string;
  /** The chosen tag names, normalized. */
  value: string[];
  onChange: (next: string[]) => void;
  /** The user's existing tag names, for autocomplete. */
  suggestions: string[];
  invalid?: boolean;
  errorId?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

type Option = { name: string; isNew: boolean };

/**
 * Picks the autocomplete options for a query: unused existing tags that contain it (prefix
 * matches first), then "Create …" when the query is a new tag.
 *
 * @param query - The normalized text typed so far.
 * @param suggestions - The user's existing tag names.
 * @param chosen - The tags already on the Echo.
 * @returns At most eight options.
 */
export function tagOptions(query: string, suggestions: string[], chosen: string[]): Option[] {
  const available = suggestions.filter((name) => !chosen.includes(name) && name.includes(query));
  available.sort(
    (a, b) => Number(!a.startsWith(query)) - Number(!b.startsWith(query)) || a.localeCompare(b),
  );
  const options: Option[] = available.slice(0, MAX_OPTIONS).map((name) => ({ name, isNew: false }));
  if (
    query &&
    query.length <= TAG_NAME_MAX &&
    !suggestions.includes(query) &&
    !chosen.includes(query)
  ) {
    options.push({ name: query, isNew: true });
  }
  return options;
}

/**
 * The tags field: an ARIA combobox with the chosen tags as chips before the input. Enter or comma
 * adds a tag, Backspace on an empty input selects the last chip and then removes it.
 */
export function TagInput({
  id,
  value,
  onChange,
  suggestions,
  invalid,
  errorId,
  disabled,
  readOnly,
}: TagInputProps) {
  const listId = useId();
  const hintId = useId();
  const noticeId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [armedRemove, setArmedRemove] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const normalized = normalizeTagName(query);
  const options = useMemo(
    () => tagOptions(normalized, suggestions, value),
    [normalized, suggestions, value],
  );
  const expanded = open && options.length > 0 && !readOnly && !disabled;
  const optionId = (index: number) => `${listId}-option-${index}`;

  /**
   * Adds one or more tags, skipping duplicates and reporting limits inline.
   *
   * @param names - The tag names as typed.
   * @returns Nothing.
   */
  const add = (names: string[]) => {
    const next = [...value];
    let problem: string | null = null;
    for (const raw of names) {
      const name = normalizeTagName(raw);
      if (!name || next.includes(name)) continue;
      if (name.length > TAG_NAME_MAX) {
        problem = `Tags must be ${TAG_NAME_MAX} characters or fewer.`;
        continue;
      }
      if (next.length >= TAGS_PER_ECHO_MAX) {
        problem = `An Echo can have up to ${TAGS_PER_ECHO_MAX} tags.`;
        break;
      }
      next.push(name);
    }
    setNotice(problem);
    if (problem) return;
    setQuery("");
    setActive(-1);
    if (next.length !== value.length) {
      onChange(next);
      setAnnouncement(
        `Added ${next
          .slice(value.length)
          .map((name) => `tag ${name}`)
          .join(", ")}.`,
      );
    }
  };

  const remove = (name: string) => {
    onChange(value.filter((tag) => tag !== name));
    setArmedRemove(false);
    setNotice(null);
    setAnnouncement(`Removed tag ${name}.`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace") setArmedRemove(false);
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      // Save shortcut: keep the half-typed tag, then submit once React has the new tags.
      if (normalized) {
        event.preventDefault();
        event.stopPropagation();
        add([query]);
        requestAnimationFrame(() => inputRef.current?.form?.requestSubmit());
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        setActive((index) => Math.min(index + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        break;
      case "Enter": {
        const option = expanded && active >= 0 ? options[active] : undefined;
        if (option || normalized) {
          event.preventDefault();
          add([option ? option.name : query]);
        }
        break;
      }
      case ",":
        event.preventDefault();
        add([query]);
        break;
      case "Escape":
        if (expanded) {
          // Close the list only; don't let the key close a surrounding dialog.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          setActive(-1);
        }
        break;
      case "Backspace": {
        const last = value.at(-1);
        if (query !== "" || !last) break;
        event.preventDefault();
        if (armedRemove) remove(last);
        else setArmedRemove(true);
        break;
      }
    }
  };

  return (
    <div className="relative">
      <div
        onPointerDown={(event) => {
          // A press on the field's padding focuses the input, like a native text field.
          if (event.target === event.currentTarget) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
        className={cn(
          "flex min-h-14 w-full flex-wrap items-center gap-1.5 rounded-sm border bg-canvas px-3 py-2 focus-within:border-ink focus-within:outline-1 focus-within:-outline-offset-2 focus-within:outline-ink",
          invalid || notice ? "border-primary-error-text" : "border-border-input",
          disabled && "bg-surface-soft",
        )}
      >
        {value.length > 0 && (
          <ul aria-label="Tags on this Echo" className="contents">
            {value.map((name, index) => {
              const armed = armedRemove && index === value.length - 1;
              return (
                <li key={name} className="min-w-0">
                  <span className={chipClasses(armed, "pr-1")} title={name}>
                    <span className="truncate">{name}</span>
                    <button
                      type="button"
                      aria-label={`Remove tag ${name}`}
                      disabled={disabled || readOnly}
                      onClick={() => {
                        remove(name);
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-fast ease-standard before:absolute before:-inset-2",
                        armed
                          ? "hover:bg-on-dark/20"
                          : "text-muted hover:bg-surface-strong hover:text-ink",
                      )}
                    >
                      <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
          aria-invalid={invalid || Boolean(notice) || undefined}
          aria-describedby={cn(hintId, notice && noticeId, invalid && errorId)}
          autoComplete="off"
          enterKeyHint="enter"
          disabled={disabled}
          readOnly={readOnly}
          value={query}
          placeholder={value.length === 0 ? "e.g. courage, morning" : "Add another"}
          onChange={(event) => {
            const text = event.target.value;
            setNotice(null);
            setOpen(true);
            setActive(-1);
            // Pasting "a, b, c" adds the finished tags and keeps the last piece in the input.
            if (text.includes(",")) {
              const parts = text.split(",");
              const rest = parts.pop() ?? "";
              add(parts);
              setQuery(rest);
            } else {
              setQuery(text);
            }
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Leaving the field keeps what was typed, so a tag is never lost on save.
            if (normalized) add([query]);
            setOpen(false);
            setActive(-1);
            setArmedRemove(false);
          }}
          className="h-10 min-w-24 flex-1 bg-transparent text-body-md text-ink placeholder:text-muted focus-visible:outline-none" // audit-ignore: the wrapper draws the focus outline (focus-within)
        />
      </div>

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Tag suggestions"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-72 origin-top animate-menu-in overflow-y-auto rounded-md bg-canvas py-2 shadow-float motion-reduce:animate-fade-in" // audit-ignore: 72 caps the list at about seven rows
        >
          {options.map((option, index) => (
            <li
              key={`${option.isNew}-${option.name}`}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              // Keep focus in the input so the click doesn't count as leaving the field.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => add([option.name])}
              className={cn(
                "flex h-10 cursor-pointer items-center gap-2 px-4 text-body-md text-ink",
                index === active ? "bg-surface-soft" : "hover:bg-surface-soft",
              )}
            >
              {option.isNew ? (
                <>
                  <PlusIcon className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate">
                    Create “<span className="font-semibold">{option.name}</span>”
                  </span>
                </>
              ) : (
                <span className="truncate">{option.name}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p id={hintId} className="mt-1.5 text-caption-sm text-muted">
        Press Enter or comma to add a tag.
      </p>
      {notice && (
        <p id={noticeId} role="alert" className="mt-1.5 text-body-sm text-primary-error-text">
          {notice}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
