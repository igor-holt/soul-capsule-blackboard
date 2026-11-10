import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCHEMA_VERSION, validateCapsuleEvent } from "../src/schema.ts";

const valid = {
  id: "evt-demo-0001",
  schema_version: SCHEMA_VERSION,
  record_type: "capsule",
  event_type: "appended",
  source: "agent-a",
  timestamp: "2026-11-10T18:00:00-05:00",
  tags: ["subject:demo-task"],
  connections: ["demo-task"],
  status: "live",
};

describe("validateCapsuleEvent", () => {
  it("accepts a well-formed evt- record", () => {
    const result = validateCapsuleEvent(valid);
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  it("rejects a missing evt- prefix", () => {
    const result = validateCapsuleEvent({ ...valid, id: "demo-0001" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("id must match")));
  });

  it("rejects an unknown status", () => {
    const result = validateCapsuleEvent({ ...valid, status: "SHIPPED" });
    assert.equal(result.ok, false);
  });
});
