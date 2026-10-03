"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { CollectionDto, TagDto } from "@/types/echo";

export type LibraryOptions = {
  tags: TagDto[];
  collections: CollectionDto[];
  status: "idle" | "loading" | "ready" | "error";
  /** Adds a collection created from a form, so it can be picked straight away. */
  addCollection: (collection: CollectionDto) => void;
  retry: () => void;
};

/**
 * Loads the user's tags and collections for the Echo forms, once they are first needed.
 *
 * @param enabled - Start loading (e.g. when "More details" opens).
 * @returns The tags, collections, load status and helpers.
 */
export function useLibraryOptions(enabled: boolean): LibraryOptions {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [collections, setCollections] = useState<CollectionDto[]>([]);
  const [status, setStatus] = useState<LibraryOptions["status"]>("idle");
  const [attempt, setAttempt] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    if (!enabled || loaded.current) return;
    let cancelled = false;
    // Deferred so the effect itself doesn't set state synchronously.
    queueMicrotask(() => !cancelled && setStatus("loading"));
    Promise.all([api.listTags(), api.listCollections()])
      .then(([tagList, collectionList]) => {
        if (cancelled) return;
        loaded.current = true;
        setTags(tagList.items);
        setCollections(collectionList.items);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const addCollection = useCallback((collection: CollectionDto) => {
    setCollections((current) =>
      [...current.filter((c) => c.id !== collection.id), collection].sort((a, b) =>
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
      ),
    );
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { tags, collections, status, addCollection, retry };
}
