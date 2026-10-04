"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { CharacterCount, FieldError, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";
import { REFLECTION_MAX } from "@/server/validation/echo";

/**
 * The one-time onboarding prompt under a user's first Echo: "Why did this speak to you?", with an
 * optional reflection. Saving or skipping finishes onboarding, so it never shows again.
 */
export function FirstReflectionPrompt({ echoId }: { echoId: string }) {
  const router = useRouter();
  const toast = useToast();
  const id = useId();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const finish = async (mode: "save" | "skip") => {
    if (busy) return;
    const reflection = text.trim();
    if (mode === "save" && !reflection) {
      setError("Write a few words, or choose Skip.");
      return;
    }
    if (mode === "save" && reflection.length > REFLECTION_MAX) {
      setError(`Reflection must be ${REFLECTION_MAX.toLocaleString("en-US")} characters or fewer.`);
      return;
    }
    setError(null);
    setBusy(mode);
    try {
      if (mode === "save") await api.updateEcho(echoId, { reflection });
      await api.updateMe({ onboarded: true });
      setHidden(true);
      if (mode === "save") toast({ message: "Reflection saved" });
      router.refresh();
    } catch (failure) {
      setError(
        failureMessage(
          failure,
          mode === "save" ? "Couldn't save your reflection." : "Couldn't skip right now.",
        ),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex animate-rise-in flex-col gap-4 rounded-lg border border-hairline bg-canvas p-6 motion-reduce:animate-none tablet:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id={`${id}-title`} className="text-display-sm text-ink">
          Why did this speak to you?
        </h2>
        <p className="text-body-md text-body">A sentence is plenty. Only you will ever read it.</p>
      </div>
      <form
        noValidate
        className="flex flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          void finish("save");
        }}
      >
        <Textarea
          id={`${id}-reflection`}
          aria-labelledby={`${id}-title`}
          value={text}
          onChange={(event) => {
            setError(null);
            setText(event.target.value);
          }}
          rows={3}
          placeholder="It reminded me that…"
          invalid={Boolean(error)}
          errorId={`${id}-error`}
          disabled={busy !== null}
        />
        <div className="flex items-start justify-between gap-4">
          <FieldError id={`${id}-error`}>{error ?? undefined}</FieldError>
          <CharacterCount length={text.trim().length} max={REFLECTION_MAX} />
        </div>
        <div className="mt-2 flex gap-3">
          <Button type="submit" loading={busy === "save"} loadingLabel="Saving…">
            Save reflection
          </Button>
          <Button
            variant="tertiary"
            loading={busy === "skip"}
            disabled={busy === "save"}
            onClick={() => void finish("skip")}
          >
            Skip
          </Button>
        </div>
      </form>
    </section>
  );
}
