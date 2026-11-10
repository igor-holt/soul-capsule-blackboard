/**
 * Local server entry. Start with `npm start` or `npm run demo`.
 */
import { startServer } from "./app.ts";

const { url, logPath } = await startServer();
console.log(`Soul Capsule Blackboard (local draft) at ${url}`);
console.log(`Append-only log: ${logPath}`);
console.log("This process does not call gc-mcp, Notion, or any remote gateway.");
console.log("Board updates live over /api/stream (Server-Sent Events).");
