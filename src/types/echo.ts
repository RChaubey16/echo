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
};

export type EchoListDto = {
  items: EchoDto[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};
