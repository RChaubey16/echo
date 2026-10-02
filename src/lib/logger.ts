type Level = "info" | "warn" | "error";

/** Fields allowed in a log line. Never pass request bodies, user content or tokens. */
export type LogFields = {
  requestId?: string;
  errorId?: string;
  route?: string;
  method?: string;
  status?: number;
  durationMs?: number;
  code?: string;
};

const ALLOWED_KEYS = new Set<string>([
  "requestId",
  "errorId",
  "route",
  "method",
  "status",
  "durationMs",
  "code",
]);

/**
 * Builds a JSON log line, dropping any field that is not on the allow-list.
 *
 * @param level - The log level.
 * @param message - A short, static description of the event.
 * @param fields - Structured metadata for the event.
 * @returns The serialized log line.
 */
export function formatLogLine(level: Level, message: string, fields: LogFields = {}): string {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (ALLOWED_KEYS.has(key) && value !== undefined) safe[key] = value;
  }
  return JSON.stringify({ time: new Date().toISOString(), level, message, ...safe });
}

/**
 * Writes a structured log line to the matching console stream.
 *
 * @param level - The log level.
 * @param message - A short, static description of the event.
 * @param fields - Structured metadata for the event.
 * @returns Nothing.
 */
function write(level: Level, message: string, fields?: LogFields): void {
  const line = formatLogLine(level, message, fields);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
