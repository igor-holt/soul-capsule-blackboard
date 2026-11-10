/**
 * Local HTTP server for the Soul Capsule Blackboard draft.
 * Serves a static UI and two JSON endpoints against the local JSONL log.
 * Does not call gc-mcp, Notion, or any remote gateway.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AppendOnlyLog } from "./log.ts";
import { projectBoard } from "./projection.ts";
import {
  SCHEMA_VERSION,
  STATUSES,
  validateCapsuleEvent,
  type CapsuleEvent,
} from "./schema.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC_DIR = join(ROOT, "src", "public");
const LOG_PATH = process.env.CAPSULE_LOG_PATH ?? join(ROOT, "data", "soul-capsule.jsonl");
const PORT = Number(process.env.PORT ?? 8788);

const log = new AppendOnlyLog(LOG_PATH);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

function send(res: ServerResponse, status: number, body: unknown, contentType = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  res.end(payload);
}

async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  if (req.method === "GET" && url.pathname === "/api/health") {
    send(res, 200, { ok: true, log_path: LOG_PATH, schema_version: SCHEMA_VERSION });
    return true;
  }
  if (req.method === "GET" && url.pathname === "/api/events") {
    const { events, skipped } = await log.read();
    send(res, 200, { events, skipped });
    return true;
  }
  if (req.method === "GET" && url.pathname === "/api/projection") {
    const { events, skipped } = await log.read();
    send(res, 200, { projection: projectBoard(events, skipped.length), skipped });
    return true;
  }
  if (req.method === "POST" && url.pathname === "/api/events") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readBody(req));
    } catch {
      send(res, 400, { ok: false, errors: ["body must be JSON"] });
      return true;
    }
    const incoming = parsed as Record<string, unknown>;
    const event: CapsuleEvent = {
      id: typeof incoming.id === "string" ? incoming.id : `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      schema_version: SCHEMA_VERSION,
      record_type: String(incoming.record_type ?? "capsule"),
      event_type: String(incoming.event_type ?? "appended"),
      source: String(incoming.source ?? ""),
      source_class: typeof incoming.source_class === "string" ? incoming.source_class : "agent",
      timestamp: typeof incoming.timestamp === "string" ? incoming.timestamp : new Date().toISOString(),
      title: typeof incoming.title === "string" ? incoming.title : undefined,
      content: typeof incoming.content === "string" ? incoming.content : undefined,
      tags: Array.isArray(incoming.tags) ? incoming.tags.map(String) : [],
      connections: Array.isArray(incoming.connections) ? incoming.connections.map(String) : [],
      status: (incoming.status as CapsuleEvent["status"]) ?? "proposed",
      session_id: typeof incoming.session_id === "string" ? incoming.session_id : undefined,
      author: typeof incoming.author === "string" ? incoming.author : undefined,
    };
    const check = validateCapsuleEvent(event);
    if (!check.ok) {
      send(res, 400, { ok: false, errors: check.errors, allowed_statuses: STATUSES });
      return true;
    }
    try {
      await log.append(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.startsWith("duplicate") ? 409 : 400;
      send(res, status, { ok: false, errors: [message] });
      return true;
    }
    send(res, 201, { ok: true, event });
    return true;
  }
  return false;
}

async function handleStatic(res: ServerResponse, url: URL): Promise<void> {
  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const safe = join(PUBLIC_DIR, rel.replace(/^\/+/, ""));
  if (!safe.startsWith(PUBLIC_DIR)) {
    send(res, 403, { ok: false, errors: ["forbidden"] });
    return;
  }
  try {
    const body = await readFile(safe);
    res.writeHead(200, { "content-type": MIME[extname(safe)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    send(res, 404, { ok: false, errors: ["not found"] });
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
    if (await handleApi(req, res, url)) return;
    await handleStatic(res, url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) send(res, 500, { ok: false, errors: [message] });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Soul Capsule Blackboard (local draft) at http://127.0.0.1:${PORT}`);
  console.log(`Append-only log: ${LOG_PATH}`);
  console.log("This process does not call gc-mcp, Notion, or any remote gateway.");
});
