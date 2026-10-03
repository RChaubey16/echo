import type { CollectionCreateInput } from "@/server/validation/collection";
import type { EchoCreateInput } from "@/server/validation/echo";
import type { CollectionDto, EchoDto, EchoListDto, TagDto } from "@/types/echo";

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
};
