"use client";

import { useId, type RefObject } from "react";
import { CharacterCount, FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { CollectionPicker } from "./collection-picker";
import {
  DETAIL_FIELDS,
  FIELD_MAX,
  type EchoErrors,
  type EchoField,
  type EchoLink,
  type EchoLinks,
  type EchoValues,
} from "./echo-values";
import { quoteClasses } from "./quote-text";
import { TagInput } from "./tag-input";
import { useLibraryOptions } from "./use-library-options";

type EchoFieldsProps = {
  values: EchoValues;
  errors: EchoErrors;
  onChange: (name: EchoField, value: string) => void;
  links: EchoLinks;
  onLinkChange: (name: EchoLink, value: string[]) => void;
  /** Validate a single field when it loses focus. */
  onBlur?: (name: EchoField) => void;
  detailsOpen: boolean;
  onDetailsOpenChange: (open: boolean) => void;
  quoteRef?: RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Blocks typing without changing the look, e.g. until the form has hydrated. */
  readOnly?: boolean;
};

/**
 * The Echo fields shared by EchoForm and QuickCapture: the quote, then author, source, reflection,
 * mood, tags and collections behind a "More details" disclosure.
 */
export function EchoFields({
  values,
  errors,
  onChange,
  links,
  onLinkChange,
  onBlur,
  detailsOpen,
  onDetailsOpenChange,
  quoteRef,
  autoFocus,
  disabled,
  readOnly,
}: EchoFieldsProps) {
  const id = useId();
  const fieldId = (name: EchoField) => `${id}-${name}`;
  const errorId = (name: EchoField) => `${id}-${name}-error`;
  const detailsId = `${id}-details`;
  // Tags and collections load the first time the details open.
  const options = useLibraryOptions(detailsOpen);
  const tagNames = options.tags.map((tag) => tag.name);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={fieldId("quote")}>
          Quote <span className="sr-only">(required)</span>
        </Label>
        <Textarea
          ref={quoteRef}
          id={fieldId("quote")}
          name="quote"
          value={values.quote}
          onChange={(event) => onChange("quote", event.target.value)}
          onBlur={() => onBlur?.("quote")}
          autoFocus={autoFocus}
          required
          aria-required
          disabled={disabled}
          readOnly={readOnly}
          invalid={Boolean(errors.quote)}
          errorId={errorId("quote")}
          placeholder="Paste or type the words you want to keep"
          className={cn(quoteClasses("card"), "placeholder:font-sans placeholder:text-body-md")}
        />
        <FieldError id={errorId("quote")}>{errors.quote}</FieldError>
        <CharacterCount length={values.quote.trim().length} max={FIELD_MAX.quote} />
      </div>

      <div>
        <button
          type="button"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => onDetailsOpenChange(!detailsOpen)}
          className="-mx-1 inline-flex h-11 items-center gap-1.5 rounded-sm px-1 text-button-sm text-ink underline-offset-4 hover:underline"
        >
          More details
          <ChevronDownIcon
            className={cn(
              "h-4 w-4 transition-transform duration-base ease-standard motion-reduce:transition-none",
              detailsOpen && "rotate-180",
            )}
          />
        </button>
        <div
          id={detailsId}
          inert={!detailsOpen}
          className={cn(
            // grid-cols-1 is a minmax(0,1fr) track, so long content can't widen the form.
            "grid grid-cols-1 transition-[grid-template-rows,opacity] duration-base ease-out-soft motion-reduce:transition-none",
            detailsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          {/* Clip only while collapsed: open, the tag suggestions and collection popover must be
              able to overflow the panel. */}
          <div className={cn("min-h-0", !detailsOpen && "overflow-hidden")}>
            <div className="flex flex-col gap-4 pt-2 pb-1">
              {DETAIL_FIELDS.map((field) => {
                const shared = {
                  id: fieldId(field.name),
                  name: field.name,
                  value: values[field.name],
                  disabled,
                  readOnly,
                  placeholder: field.placeholder,
                  invalid: Boolean(errors[field.name]),
                  errorId: errorId(field.name),
                  onBlur: () => onBlur?.(field.name),
                };
                return (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <Label htmlFor={fieldId(field.name)}>{field.label}</Label>
                    {field.multiline ? (
                      <Textarea
                        {...shared}
                        onChange={(event) => onChange(field.name, event.target.value)}
                      />
                    ) : (
                      <Input
                        {...shared}
                        onChange={(event) => onChange(field.name, event.target.value)}
                      />
                    )}
                    <FieldError id={errorId(field.name)}>{errors[field.name]}</FieldError>
                    <CharacterCount length={values[field.name].trim().length} max={field.max} />
                  </div>
                );
              })}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-tags`}>Tags</Label>
                <TagInput
                  id={`${id}-tags`}
                  value={links.tagNames}
                  onChange={(next) => onLinkChange("tagNames", next)}
                  suggestions={tagNames}
                  invalid={Boolean(errors.tagNames)}
                  errorId={`${id}-tags-error`}
                  disabled={disabled}
                  readOnly={readOnly}
                />
                <FieldError id={`${id}-tags-error`}>{errors.tagNames}</FieldError>
              </div>
              <div className="flex flex-col gap-1.5">
                <span id={`${id}-collections-label`} className="text-caption text-muted">
                  Collections
                </span>
                <CollectionPicker
                  labelId={`${id}-collections-label`}
                  value={links.collectionIds}
                  onChange={(next) => onLinkChange("collectionIds", next)}
                  options={options}
                  disabled={disabled || readOnly}
                />
                <FieldError id={`${id}-collections-error`}>{errors.collectionIds}</FieldError>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
