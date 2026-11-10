import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SCHEMA_VERSION, type CapsuleEvent } from "../src/schema.ts";
import { AppendOnlyLog } from "../src/log.ts";
import { projectBoard } from "../src/projection.ts";

function ev(partial: Partial<CapsuleEvent> & Pick<CapsuleEvent, "id" | "status" | "timestamp">): CapsuleEvent {
  return {
    schema_version: SCHEMA_VERSION,
    record_type: "capsule",
    event_type: "appended",
    source: "agent-a",
    tags: ["subject:task-1"],
    connections: ["task-1"],
    title: partial.title ?? partial.status,
    ...partial,
  };
}

describe("projectBoard", () => {
  it("projects the latest status per subject into LIVE / BLOCKED / ACTION_REQUIRED", () => {
    const events = [
      ev({ id: "evt-1", status: "live", timestamp: "2026-11-10T10:00:00Z", tags: ["subject:alpha"], connections: ["alpha"] }),
      ev({ id: "evt-2", status: "blocked", timestamp: "2026-11-10T11:00:00Z", tags: ["subject:alpha"], connections: ["alpha"], source: "agent-b" }),
      ev({ id: "evt-3", status: "action_required", timestamp: "2026-11-10T12:00:00Z", tags: ["subject:beta"], connections: ["beta"] }),
      ev({ id: "evt-4", status: "in_progress", timestamp: "2026-11-10T13:00:00Z", tags: ["subject:gamma"], connections: ["gamma"] }),
    ];
    const board = projectBoard(events, 0, new Date("2026-11-10T14:00:00Z"));
    assert.equal(board.columns.LIVE.length, 0);
    assert.equal(board.columns.BLOCKED.length, 1);
    assert.equal(board.columns.BLOCKED[0].subject, "alpha");
    assert.equal(board.columns.BLOCKED[0].latest_event_id, "evt-2");
    assert.equal(board.columns.ACTION_REQUIRED[0].subject, "beta");
    assert.equal(board.other[0].subject, "gamma");
  });
});

describe("AppendOnlyLog", () => {
  it("appends records and never rewrites earlier lines", async () => {
    const dir = await mkdtemp(join(tmpdir(), "scb-"));
    const file = join(dir, "soul-capsule.jsonl");
    const log = new AppendOnlyLog(file);
    const first = ev({ id: "evt-a", status: "live", timestamp: "2026-11-10T10:00:00Z" });
    const second = ev({ id: "evt-b", status: "blocked", timestamp: "2026-11-10T11:00:00Z", source: "agent-b" });
    await log.append(first);
    const afterFirst = await readFile(file, "utf8");
    await log.append(second);
    const afterSecond = await readFile(file, "utf8");
    assert.ok(afterSecond.startsWith(afterFirst));
    assert.equal(afterSecond.split("\n").filter(Boolean).length, 2);
    await assert.rejects(() => log.append(first), /duplicate event id/);
    await rm(dir, { recursive: true, force: true });
  });
});
