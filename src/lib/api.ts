import type { CollectionCreateInput } from "@/server/validation/collection";
import type { EchoCreateInput } from "@/server/validation/echo";
import type { RevisitStatus } from "@/server/validation/revisit";
import type { ThemeChoice } from "@/server/validation/user";
import type {
  CollectionDto,
  EchoDto,
  EchoListDto,
  RevisitDto,
  RevisitWithEchoDto,
  TagDto,
} from "@/types/echo";
import type { MeDto } from "@/types/user";

/** A failed API call, carrying the spec §39 error code and any per-field messages. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: Record<string, string[]>;

  /**
   * Creates an API error from a response.
   *
   * @param status - The HTTP status.
   * @param code - The error code from the response body.
   * @param message - The friendly message from the response body.
   * @param fields - Per-field validation messages, if any.
   * @returns A new ApiError.
   */
  constructor(
    status: number,
    code: string,
    message: string,
    fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Turns a failed call into friendly copy: what failed, then what to do next. The code decides the
 * second half; technical details never reach the screen.
 *
 * @param error - The thrown value, usually an ApiError.
 * @param what - What failed, as a full sentence, e.g. "Couldn't update favorites.".
 * @returns The sentence to show in a toast or inline message.
 */
export function failureMessage(error: unknown, what: string): string {
  const code = error instanceof ApiError ? error.code : undefined;
  switch (code) {
    case "NETWORK_ERROR":
      return `${what} Check your connection and try again.`;
    case "RATE_LIMITED":
      return `${what} Wait a moment and try again.`;
    case "UNAUTHORIZED":
      return `${what} Your session has ended. Sign in again to continue.`;
    case "FORBIDDEN":
    case "NOT_FOUND":
    case "ECHO_NOT_FOUND":
    case "COLLECTION_NOT_FOUND":
    case "TAG_NOT_FOUND":
    case "REVISIT_NOT_FOUND":
      return `${what} It may have been deleted. Refresh the page and try again.`;
    default:
      return `${what} Try again.`;
  }
}

/**
 * Calls one of the app's route handlers and returns its JSON, throwing ApiError on failure.
 *
 * @param path - The API path, e.g. "/api/echoes".
 * @param init - Fetch options; a `json` value is sent as the JSON body.
 * @returns The parsed response body, or undefined for 204 responses.
 */
async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      headers: json === undefined ? rest.headers : { "content-type": "application/json" },
      body: json === undefined ? rest.body : JSON.stringify(json),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Check your connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as {
    error?: { code: string; message: string; fields?: Record<string, string[]> };
  } | null;
  if (!response.ok) {
    const error = body?.error;
    // Technical details go to the console only: method, path, status and code, never the body.
    console.error("api call failed", {
      method: rest.method ?? "GET",
      path: path.split("?")[0],
      status: response.status,
      code: error?.code,
    });
    throw new ApiError(
      response.status,
      error?.code ?? "INTERNAL_ERROR",
      error?.message ?? "Something went wrong.",
      error?.fields,
    );
  }
  return body as T;
}

export const api = {
  /**
   * Saves a new Echo.
   *
   * @param input - The Echo fields.
   * @returns The created Echo.
   */
  createEcho: (input: EchoCreateInput) =>
    request<EchoDto>("/api/echoes", { method: "POST", json: input }),

  /**
   * Updates some fields of an Echo.
   *
   * @param id - The Echo ID.
   * @param patch - The fields to change.
   * @returns The updated Echo.
   */
  updateEcho: (id: string, patch: Partial<EchoCreateInput>) =>
    request<EchoDto>(`/api/echoes/${encodeURIComponent(id)}`, { method: "PATCH", json: patch }),

  /**
   * Soft-deletes an Echo.
   *
   * @param id - The Echo ID.
   * @returns Nothing.
   */
  deleteEcho: (id: string) =>
    request<void>(`/api/echoes/${encodeURIComponent(id)}`, { method: "DELETE" }),

  /**
   * Lists the user's Echoes, e.g. to pick some for a collection.
   *
   * @param query - Query parameters such as `search`, `limit` and `page`.
   * @returns One page of Echoes.
   */
  listEchoes: (query: Record<string, string>) =>
    request<EchoListDto>(`/api/echoes?${new URLSearchParams(query).toString()}`),

  /**
   * Lists the user's tags with their usage counts.
   *
   * @returns The tags, alphabetically.
   */
  listTags: () => request<{ items: TagDto[] }>("/api/tags"),

  /**
   * Lists the user's collections with their Echo counts.
   *
   * @returns The collections, alphabetically.
   */
  listCollections: () => request<{ items: CollectionDto[] }>("/api/collections"),

  /**
   * Creates a collection.
   *
   * @param input - The name, and optionally a description and accent.
   * @returns The new collection.
   */
  createCollection: (input: CollectionCreateInput) =>
    request<CollectionDto>("/api/collections", { method: "POST", json: input }),

  /**
   * Renames a collection or changes its description.
   *
   * @param id - The collection ID.
   * @param patch - The fields to change.
   * @returns The updated collection.
   */
  updateCollection: (id: string, patch: Partial<CollectionCreateInput>) =>
    request<CollectionDto>(`/api/collections/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: patch,
    }),

  /**
   * Deletes a collection; its Echoes are kept.
   *
   * @param id - The collection ID.
   * @returns Nothing.
   */
  deleteCollection: (id: string) =>
    request<void>(`/api/collections/${encodeURIComponent(id)}`, { method: "DELETE" }),

  /**
   * Adds an Echo to a collection.
   *
   * @param collectionId - The collection ID.
   * @param echoId - The Echo ID.
   * @returns The collection with its new count.
   */
  addToCollection: (collectionId: string, echoId: string) =>
    request<CollectionDto>(`/api/collections/${encodeURIComponent(collectionId)}/echoes`, {
      method: "POST",
      json: { echoId },
    }),

  /**
   * Removes an Echo from a collection; the Echo is kept.
   *
   * @param collectionId - The collection ID.
   * @param echoId - The Echo ID.
   * @returns The collection with its new count.
   */
  removeFromCollection: (collectionId: string, echoId: string) =>
    request<CollectionDto>(
      `/api/collections/${encodeURIComponent(collectionId)}/echoes/${encodeURIComponent(echoId)}`,
      { method: "DELETE" },
    ),

  /**
   * Picks a random Echo for Echo Me Something.
   *
   * @param exclude - IDs shown recently, most recent last; the server keeps the last five.
   * @returns The Echo, or null when the library is empty.
   */
  randomEcho: (exclude: readonly string[]) =>
    request<{ echo: EchoDto | null }>(
      `/api/echoes/random?${new URLSearchParams({ exclude: exclude.join(",") }).toString()}`,
      { cache: "no-store" },
    ),

  /**
   * Schedules a Revisit, replacing the Echo's pending one.
   *
   * @param echoId - The Echo ID.
   * @param scheduledFor - The date as an ISO string.
   * @returns The new Revisit.
   */
  createRevisit: (echoId: string, scheduledFor: string) =>
    request<RevisitDto>("/api/revisits", { method: "POST", json: { echoId, scheduledFor } }),

  /**
   * Lists one status of Revisits.
   *
   * @param status - "due", "upcoming" or "completed".
   * @returns The Revisits with their Echoes.
   */
  listRevisits: (status: RevisitStatus) =>
    request<{ items: RevisitWithEchoDto[] }>(`/api/revisits?status=${status}`),

  /**
   * Marks a Revisit as reflected on.
   *
   * @param id - The Revisit ID.
   * @returns The completed Revisit.
   */
  completeRevisit: (id: string) =>
    request<RevisitDto>(`/api/revisits/${encodeURIComponent(id)}`, {
      method: "PATCH",
      json: { completed: true },
    }),

  /**
   * Cancels a Revisit.
   *
   * @param id - The Revisit ID.
   * @returns Nothing.
   */
  deleteRevisit: (id: string) =>
    request<void>(`/api/revisits/${encodeURIComponent(id)}`, { method: "DELETE" }),

  /**
   * Updates the signed-in user's own settings.
   *
   * @param patch - Any of `name`, `theme`, `timezone` (IANA name) and `onboarded: true`.
   * @returns The stored name, time zone, onboarding time and theme.
   */
  updateMe: (patch: { name?: string; theme?: ThemeChoice; timezone?: string; onboarded?: true }) =>
    request<MeDto>("/api/me", {
      method: "PATCH",
      json: patch,
    }),
};
