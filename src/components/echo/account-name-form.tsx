"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ApiError, api, failureMessage } from "@/lib/api";
import { USER_NAME_MAX, userNameSchema } from "@/server/validation/user";

/** Settings › Account: the editable display name, saved on submit. */
export function AccountNameForm({ name: initial }: { name: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial ?? "");
  const [saved, setSaved] = useState(initial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const errorId = `${id}-error`;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = userNameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your name.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const me = await api.updateMe({ name: parsed.data });
      setName(me.name ?? "");
      setSaved(me.name ?? "");
      toast({ message: "Name saved" });
      // The sidebar and greeting read the name on the server.
      router.refresh();
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.fields.name?.[0]
          ? failure.fields.name[0]
          : failureMessage(failure, "Couldn't save your name."),
      );
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  const unchanged = name.trim() === saved;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-1.5">
      <Label htmlFor={`${id}-name`}>Name</Label>
      <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start">
        <Input
          ref={inputRef}
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          maxLength={USER_NAME_MAX + 50}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            if (error) setError(userNameSchema.safeParse(name).error?.issues[0]?.message ?? null);
          }}
          invalid={Boolean(error)}
          errorId={errorId}
          className="tablet:flex-1"
        />
        <Button
          type="submit"
          variant="secondary"
          loading={saving}
          loadingLabel="Saving…"
          disabled={unchanged && !error}
          className="tablet:h-14"
        >
          Save name
        </Button>
      </div>
      <FieldError id={errorId}>{error ?? undefined}</FieldError>
    </form>
  );
}
