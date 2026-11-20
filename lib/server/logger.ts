import "server-only";

type Level = "debug" | "info" | "warn" | "error";

export type LogFields = {
  /** Cost of the action in euro cents; logged for every adapter call (definition of done). */
  cost_cents?: number;
  family_id?: string;
  [key: string]: unknown;
};

// Keys that must never reach the logs, whatever a caller passes in.
const REDACTED = /(email|phone|token|secret|password|authorization|body|text|transcript|letter)/i;

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") return redact(value as LogFields);
  return value;
}

export function redact(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      REDACTED.test(key) ? "[redacted]" : redactValue(value),
    ]),
  );
}

function write(level: Level, event: string, fields: LogFields = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...redact(fields) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Structured JSON logs: one line per event, never story content or contact details. */
export const logger = {
  debug: (event: string, fields?: LogFields) => write("debug", event, fields),
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
