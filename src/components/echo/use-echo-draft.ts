"use client";

import { useCallback, useState, type RefObject } from "react";
import type { EchoCreate } from "@/server/validation/echo";
import {
  errorsFromFields,
  validateEcho,
  type EchoErrors,
  type EchoField,
  type EchoValues,
} from "./echo-values";

/**
 * Holds an Echo draft: values, inline errors and the "More details" state, with validation that
 * matches the API.
 *
 * @param initial - The values the form starts from.
 * @param detailsOpenInitially - Whether "More details" starts expanded (edit) or collapsed (create).
 * @param formRef - The form element, used to focus the first invalid field.
 * @returns The draft state and its handlers.
 */
export function useEchoDraft(
  initial: EchoValues,
  detailsOpenInitially: boolean,
  formRef: RefObject<HTMLFormElement | null>,
) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<EchoErrors>({});
  const [detailsOpen, setDetailsOpen] = useState(detailsOpenInitially);

  const showErrors = useCallback(
    (next: EchoErrors) => {
      setErrors(next);
      if (Object.keys(next).some((name) => name !== "quote")) setDetailsOpen(true);
      // Move focus to the first field with an error once it has rendered.
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
    },
    [formRef],
  );

  const setField = useCallback((name: EchoField, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    // Clear a field's error as soon as the user fixes it; new errors wait for blur or submit.
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }, []);

  const blurField = useCallback(
    (name: EchoField) => {
      // An empty quote is only an error on submit, so leaving the field empty isn't scolded.
      if (name === "quote" && values.quote.trim() === "") return;
      const result = validateEcho(values);
      const message = "errors" in result ? result.errors[name] : undefined;
      setErrors((current) => ({ ...current, [name]: message }));
    },
    [values],
  );

  /**
   * Validates the whole draft, showing errors and focusing the first one on failure.
   *
   * @returns The parsed Echo, or null when the draft is invalid.
   */
  const validate = useCallback((): EchoCreate | null => {
    const result = validateEcho(values);
    if ("errors" in result) {
      showErrors(result.errors);
      return null;
    }
    return result.data;
  }, [values, showErrors]);

  /**
   * Shows the API's per-field messages next to their fields.
   *
   * @param fields - Messages keyed by field name.
   * @returns True when at least one field had a message.
   */
  const applyServerErrors = useCallback(
    (fields: Record<string, string[]>): boolean => {
      const next = errorsFromFields(fields);
      if (Object.keys(next).length === 0) return false;
      showErrors(next);
      return true;
    },
    [showErrors],
  );

  const reset = useCallback(
    (next: EchoValues) => {
      setValues(next);
      setErrors({});
      setDetailsOpen(detailsOpenInitially);
    },
    [detailsOpenInitially],
  );

  return {
    values,
    errors,
    detailsOpen,
    setDetailsOpen,
    setField,
    blurField,
    validate,
    applyServerErrors,
    reset,
  };
}
