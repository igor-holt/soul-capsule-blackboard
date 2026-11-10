/**
 * Server entry. Start with `npm start` (seeds the board when the log is empty)
 * or `npm run demo` (fresh demo session log).
 *
 * When PORT is set (Render and other hosts), the process binds 0.0.0.0.
 * Local runs without PORT stay on 127.0.0.1:8788.
 */
import { startServer } from "./app.ts";

const { url, logPath, seeded } = await startServer({ seedIfEmpty: true });
console.log(`Soul Capsule Blackboard at ${url}`);
console.log(`Append-only log: ${logPath}`);
if (seeded.length > 0) {
  console.log(`Seeded ${seeded.length} demo capsules so the board is visible immediately:`);
  for (const event of seeded) {
    console.log(`  ${event.source} ${event.id} ${event.status}`);
  }
} else {
  console.log("Existing capsule log reused; demo seed skipped.");
}
console.log("This process does not call gc-mcp, Notion, or any remote gateway.");
console.log("Board updates live over /api/stream (Server-Sent Events).");
