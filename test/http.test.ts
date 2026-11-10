import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startServer } from "../src/app.ts";

describe("HTTP API and live stream", async () => {
  const dir = await mkdtemp(join(tmpdir(), "scb-http-"));
  const logPath = join(dir, "soul-capsule.jsonl");
  const started = await startServer({ port: 0, logPath, host: "127.0.0.1" });
  const { url, server } = started;

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await rm(dir, { recursive: true, force: true });
  });

  it("accepts two agents and projects the latest status", async () => {
    const a = await fetch(`${url}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "agent-a",
        title: "go live",
        status: "live",
        tags: ["subject:demo-task"],
        connections: ["demo-task"],
      }),
    });
    assert.equal(a.status, 201);
    const b = await fetch(`${url}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "agent-b",
        title: "now blocked",
        status: "blocked",
        tags: ["subject:demo-task"],
        connections: ["demo-task"],
      }),
    });
    assert.equal(b.status, 201);
    const action = await fetch(`${url}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "agent-a",
        title: "needs a look",
        status: "action_required",
        tags: ["subject:review-gate"],
        connections: ["review-gate"],
      }),
    });
    assert.equal(action.status, 201);

    const projRes = await fetch(`${url}/api/projection`);
    const body = await projRes.json();
    assert.equal(body.projection.columns.LIVE.length, 0);
    assert.equal(body.projection.columns.BLOCKED[0].subject, "demo-task");
    assert.equal(body.projection.columns.BLOCKED[0].source, "agent-b");
    assert.equal(body.projection.columns.ACTION_REQUIRED[0].subject, "review-gate");
  });

  it("pushes an SSE event when a capsule is appended", async () => {
    const res = await fetch(`${url}/api/stream`);
    assert.equal(res.status, 200);
    assert.match(String(res.headers.get("content-type")), /text\/event-stream/);
    const reader = res.body?.getReader();
    assert.ok(reader);
    const decoder = new TextDecoder();
    let buffer = "";

    const first = await reader.read();
    buffer += decoder.decode(first.value ?? new Uint8Array(), { stream: true });

    const posted = await fetch(`${url}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        source: "agent-b",
        title: "stream ping",
        status: "live",
        tags: ["subject:stream-ping"],
        connections: ["stream-ping"],
      }),
    });
    assert.equal(posted.status, 201);

    const deadline = Date.now() + 3000;
    while (!buffer.includes("stream ping") && Date.now() < deadline) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: true });
    }
    await reader.cancel();
    assert.match(buffer, /stream ping/);
    assert.match(buffer, /"type":"appended"/);
  });

  it("rejects an invalid event and leaves the log usable", async () => {
    const bad = await fetch(`${url}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "agent-a", status: "nope", tags: [], connections: [] }),
    });
    assert.equal(bad.status, 400);
    const health = await fetch(`${url}/api/health`);
    assert.equal(health.status, 200);
    const rootHealth = await fetch(`${url}/health`);
    assert.equal(rootHealth.status, 200);
    assert.equal((await rootHealth.json()).ok, true);
  });
});
