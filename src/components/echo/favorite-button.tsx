"use client";

import { useRef, useState } from "react";
import { HeartIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { api, failureMessage } from "@/lib/api";
import { cn } from "@/lib/cn";

type FavoriteButtonProps = {
  echoId: string;
  isFavorite: boolean;
  /**
   * "icon" is the bare heart (cards, rows), "filled" a 48px heart on a surface-strong disc
   * (Today's Echo), and "labelled" adds visible text.
   */
  variant?: "icon" | "filled" | "labelled";
  className?: string;
};

/**
 * The heart toggle. It flips at once (optimistic), then rolls back with a toast if the save fails.
 */
export function FavoriteButton({
  echoId,
  isFavorite: initial,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initial);
  const [pops, setPops] = useState(0);
  const pending = useRef(0);
  const toast = useToast();

  const toggle = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    if (next) setPops((count) => count + 1);
    // Only the latest click decides the final state; earlier responses are ignored.
    const call = ++pending.current;
    try {
      const saved = await api.updateEcho(echoId, { isFavorite: next });
      if (call === pending.current) setIsFavorite(saved.isFavorite);
    } catch (error) {
      if (call !== pending.current) return;
      setIsFavorite(!next);
      toast({ message: failureMessage(error, "Couldn't update favorites.") });
    }
  };

  const label = isFavorite ? "Remove from favorites" : "Add to favorites";
  const heart = (
    <HeartIcon
      key={pops}
      fill={isFavorite ? "currentColor" : "none"}
      className={cn(
        "h-5 w-5 shrink-0 transition-colors duration-fast ease-standard",
        isFavorite && pops > 0 && "animate-heart-pop motion-reduce:animate-none",
      )}
    />
  );

  if (variant === "labelled") {
    return (
      <button
        type="button"
        aria-pressed={isFavorite}
        onClick={toggle}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-md px-3 text-button-md text-ink transition-[background-color,transform] duration-fast ease-standard hover:bg-surface-strong active:scale-98 active:bg-hairline motion-reduce:active:scale-100",
          className,
        )}
      >
        <span className={isFavorite ? "text-primary" : "text-muted"}>{heart}</span>
        {isFavorite ? "Favorited" : "Favorite"}
        <span className="sr-only">{isFavorite ? ", remove from favorites" : ""}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      onClick={toggle}
      className={cn(
        "flex items-center justify-center rounded-full transition-colors duration-fast ease-standard",
        variant === "filled"
          ? "h-12 w-12 bg-surface-strong hover:bg-hairline"
          : "h-11 w-11 hover:bg-surface-strong",
        isFavorite ? "text-primary" : "text-muted hover:text-ink",
        className,
      )}
    >
      {heart}
    </button>
  );
}
