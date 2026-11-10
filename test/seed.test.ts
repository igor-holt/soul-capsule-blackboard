import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AppendOnlyLog } from "../src/log.ts";
import { seedDemoIfEmpty, startServer } from "../src/app.ts";

describe("demo seed on empty log", async () => {
  const dir = await mkdtemp(join(tmpdir(), "scb-seed-"));
  const logPath = join(dir, "soul-capsule.jsonl");
  const started = await startServer({ port: 0, logPath, host: "127.0.0.1", seedIfEmpty: true });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      started.server.close((err) => (err ? reject(err) : resolve()));
    });
    await rm(dir, { recursive: true, force: true });
  });

  it("projects seeded agent-a / agent-b capsules immediately", async () => {
    assert.equal(started.seeded.length, 3);
    const health = await fetch(`${started.url}/health`);
    assert.equal(health.status, 200);
    const projRes = await fetch(`${started.url}/api/projection`);
    const body = await projRes.json();
    assert.equal(body.projection.columns.LIVE.length, 0);
    assert.equal(body.projection.columns.BLOCKED[0].subject, "demo-task");
    assert.equal(body.projection.columns.BLOCKED[0].source, "agent-b");
    assert.equal(body.projection.columns.ACTION_REQUIRED[0].subject, "review-gate");
  });

  it("does not rewrite the log on a second seed pass", async () => {
    const again = await seedDemoIfEmpty(new AppendOnlyLog(logPath));
    assert.equal(again.length, 0);
    const events = await fetch(`${started.url}/api/events`);
    const body = await events.json();
    assert.equal(body.events.length, 3);
  });
});
