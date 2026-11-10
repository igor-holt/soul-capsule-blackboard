/**
 * One-command demo: start the server, seed two agent capsules if needed,
 * and keep listening.
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

const { url, seeded } = await startServer({ port, logPath, seedIfEmpty: true });

console.log(`Soul Capsule Blackboard demo at ${url}`);
console.log(`Append-only demo log: ${logPath}`);
console.log("Seeded capsules:");
for (const event of seeded) {
  const subject = event.connections[0] ?? event.id;
  console.log(`  ${event.source} ${event.id} ${event.status} on ${subject}`);
}
console.log("Open the URL, then append more events — other open tabs update over SSE.");
console.log("This process does not call gc-mcp, Notion, or any remote gateway.");
console.log("Ctrl+C to stop.");
