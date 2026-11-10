/**
 * Local Soul Capsule event schema for this draft.
 *
 * Field names follow the evt- record shape documented in Igor Holt's
 * Notion page "Genesis Conductor: 7-Agent Topology and Soul Capsule
 * Integration Protocol" (edited 2026-05-10). This file implements a
 * local validator only. It does not write to Notion, gc-mcp, or any
 * remote capsule store.
 */

export const SCHEMA_VERSION = "1.0" as const;

export const STATUSES = [
  "proposed",
  "planned",
  "in_progress",
  "blocked",
  "action_required",
  "live",
  "deprecated",
  "resolved",
] as const;

export type CapsuleStatus = (typeof STATUSES)[number];

export const BOARD_STATES = ["LIVE", "BLOCKED", "ACTION_REQUIRED"] as const;
export type BoardState = (typeof BOARD_STATES)[number];

export interface CapsuleEvent {
  id: string;
  schema_version: typeof SCHEMA_VERSION;
  record_type: string;
  event_type: string;
  source: string;
  source_class?: string;
  timestamp: string;
  title?: string;
  content?: string;
  tags: string[];
  connections: string[];
  status: CapsuleStatus;
  session_id?: string;
  author?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const ID_RE = /^evt-[A-Za-z0-9][A-Za-z0-9._-]*$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function validateCapsuleEvent(input: unknown): ValidationResult {
  const errors: string[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["event must be a JSON object"] };
  }
  const ev = input as Record<string, unknown>;

  if (typeof ev.id !== "string" || !ID_RE.test(ev.id)) {
    errors.push("id must match evt-<token> (letters, digits, dot, underscore, hyphen)");
  }
  if (ev.schema_version !== SCHEMA_VERSION) {
    errors.push(`schema_version must be "${SCHEMA_VERSION}"`);
  }
  for (const field of ["record_type", "event_type", "source"] as const) {
    if (typeof ev[field] !== "string" || ev[field].trim() === "") {
      errors.push(`${field} must be a non-empty string`);
    }
  }
  if (typeof ev.timestamp !== "string" || !ISO_RE.test(ev.timestamp)) {
    errors.push("timestamp must be an ISO-8601 datetime with timezone offset or Z");
  }
  if (!Array.isArray(ev.tags) || ev.tags.some((t) => typeof t !== "string")) {
    errors.push("tags must be an array of strings");
  }
  if (!Array.isArray(ev.connections) || ev.connections.some((c) => typeof c !== "string")) {
    errors.push("connections must be an array of strings");
  }
  if (typeof ev.status !== "string" || !(STATUSES as readonly string[]).includes(ev.status)) {
    errors.push(`status must be one of: ${STATUSES.join(", ")}`);
  }
  for (const optional of ["title", "content", "session_id", "author", "source_class"] as const) {
    if (optional in ev && ev[optional] !== undefined && typeof ev[optional] !== "string") {
      errors.push(`${optional} must be a string when present`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function isCapsuleEvent(input: unknown): input is CapsuleEvent {
  return validateCapsuleEvent(input).ok;
}
