/**
 * Derived board projection from the append-only log.
 *
 * This is a local CQRS-style read model: the log is the source of truth;
 * the projection is computed, never stored as a second writable log.
 *
 * Mapping (documented so a demo can explain it):
 *   LIVE             — latest event for a subject is live
 *   BLOCKED          — latest event for a subject is blocked
 *   ACTION_REQUIRED  — latest event for a subject is action_required
 *
 * Subjects with a latest status of proposed, planned, in_progress,
 * deprecated, or resolved are listed under other, not on the three
 * demo board columns.
 */
import type { BoardState, CapsuleEvent, CapsuleStatus } from "./schema.ts";

export interface SubjectCard {
  subject: string;
  board_state: BoardState | "OTHER";
  latest_status: CapsuleStatus;
  latest_event_id: string;
  title: string;
  source: string;
  timestamp: string;
  event_count: number;
}

export interface BoardProjection {
  generated_at: string;
  event_count: number;
  skipped_count: number;
  columns: {
    LIVE: SubjectCard[];
    BLOCKED: SubjectCard[];
    ACTION_REQUIRED: SubjectCard[];
  };
  other: SubjectCard[];
}

const STATUS_TO_BOARD: Partial<Record<CapsuleStatus, BoardState>> = {
  live: "LIVE",
  blocked: "BLOCKED",
  action_required: "ACTION_REQUIRED",
};

function subjectOf(event: CapsuleEvent): string {
  const tagged = event.tags.find((t) => t.startsWith("subject:"));
  if (tagged) return tagged.slice("subject:".length);
  return event.connections[0] || event.id;
}

export function projectBoard(
  events: CapsuleEvent[],
  skippedCount = 0,
  now = new Date(),
): BoardProjection {
  const bySubject = new Map<string, CapsuleEvent[]>();
  for (const event of events) {
    const key = subjectOf(event);
    const list = bySubject.get(key) ?? [];
    list.push(event);
    bySubject.set(key, list);
  }

  const columns: BoardProjection["columns"] = {
    LIVE: [],
    BLOCKED: [],
    ACTION_REQUIRED: [],
  };
  const other: SubjectCard[] = [];

  for (const [subject, list] of bySubject) {
    const ordered = [...list].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const latest = ordered[ordered.length - 1];
    const board = STATUS_TO_BOARD[latest.status];
    const card: SubjectCard = {
      subject,
      board_state: board ?? "OTHER",
      latest_status: latest.status,
      latest_event_id: latest.id,
      title: latest.title ?? latest.event_type,
      source: latest.source,
      timestamp: latest.timestamp,
      event_count: ordered.length,
    };
    if (board) columns[board].push(card);
    else other.push(card);
  }

  const byTime = (a: SubjectCard, b: SubjectCard) => b.timestamp.localeCompare(a.timestamp);
  columns.LIVE.sort(byTime);
  columns.BLOCKED.sort(byTime);
  columns.ACTION_REQUIRED.sort(byTime);
  other.sort(byTime);

  return {
    generated_at: now.toISOString(),
    event_count: events.length,
    skipped_count: skippedCount,
    columns,
    other,
  };
}
