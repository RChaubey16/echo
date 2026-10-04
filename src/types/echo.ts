import type { CollectionAccent } from "@/server/validation/collection";

/** A tag as attached to an Echo. */
export type TagRefDto = { id: string; name: string };

/** A collection as attached to an Echo; the accent colors its dot. */
export type CollectionRefDto = { id: string; name: string; accent: CollectionAccent };

/** An Echo as returned by the API. Dates are ISO strings; `userId` and `deletedAt` are never exposed. */
export type EchoDto = {
  id: string;
  quote: string;
  author: string | null;
  source: string | null;
  reflection: string | null;
  mood: string | null;
  isFavorite: boolean;
  favoritedAt: string | null;
  savedAt: string;
  updatedAt: string;
  /** Sorted by name. */
  tags: TagRefDto[];
  /** Sorted by name. */
  collections: CollectionRefDto[];
};

export type EchoListDto = {
  items: EchoDto[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

/** One page of search results (spec §30), best match first. */
export type SearchResultsDto = {
  results: EchoDto[];
  query: string;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

/** A tag with the number of live Echoes that use it. */
export type TagDto = TagRefDto & { echoCount: number; createdAt: string };

/** A collection with the number of live Echoes in it. */
export type CollectionDto = {
  id: string;
  name: string;
  description: string | null;
  accent: CollectionAccent;
  echoCount: number;
  createdAt: string;
  updatedAt: string;
};

/** A collection with one page of its Echoes. */
export type CollectionDetailDto = CollectionDto & { echoes: EchoListDto };

/** The sidebar's short Collections list: the first few collections and how many there are. */
export type SidebarCollectionsDto = {
  items: Array<Pick<CollectionDto, "id" | "name" | "accent" | "echoCount">>;
  total: number;
};
