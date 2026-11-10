/**
 * One-command local demo: start the server, seed two agent capsules,
 * and keep listening. Does not publish, deploy, or call remote services.
 *
 * Usage: npm run demo
 */
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { ROOT, startServer } from "../src/app.ts";

const port = Number(process.env.PORT ?? 8788);
const logPath = process.env.CAPSULE_LOG_PATH ?? join(ROOT, "data", "demo-session.jsonl");

if (!process.env.CAPSULE_KEEP_LOG) {
  await rm(logPath, { force: true });
}

const { url } = await startServer({ port, logPath, host: "127.0.0.1" });

async function post(body: Record<string, unknown>) {
  const res = await fetch(`${url}/api/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`seed failed: ${(data.errors || [res.statusText]).join("; ")}`);
  }
  return data.event;
}

const agentA = await post({
  source: "agent-a",
  title: "demo-task is live",
  content: "Seeded by npm run demo. Local log only.",
  status: "live",
  tags: ["subject:demo-task"],
  connections: ["demo-task"],
  session_id: "npm-run-demo",
});
const agentB = await post({
  source: "agent-b",
  title: "demo-task is blocked",
  content: "Agent B appends a later capsule for the same subject.",
  status: "blocked",
  tags: ["subject:demo-task"],
  connections: ["demo-task"],
  session_id: "npm-run-demo",
});
const review = await post({
  source: "agent-a",
  title: "review-gate needs action",
  content: "A second subject, so all three board columns can be shown after you append a LIVE item.",
  status: "action_required",
  tags: ["subject:review-gate"],
  connections: ["review-gate"],
  session_id: "npm-run-demo",
});

console.log(`Soul Capsule Blackboard demo at ${url}`);
console.log(`Append-only demo log: ${logPath}`);
console.log("Seeded capsules:");
console.log(`  agent-a ${agentA.id} live on demo-task`);
console.log(`  agent-b ${agentB.id} blocked on demo-task (latest for that subject)`);
console.log(`  agent-a ${review.id} action_required on review-gate`);
console.log("Open the URL, then append more events — other open tabs update over SSE.");
console.log("This process does not call gc-mcp, Notion, or any remote gateway.");
console.log("Ctrl+C to stop.");
