/**
 * HTTP app factory for the local Soul Capsule Blackboard.
 * Does not call gc-mcp, Notion, or any remote gateway.
 */
import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
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

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const DEFAULT_LOG_PATH = join(ROOT, "data", "soul-capsule.jsonl");
export const PUBLIC_DIR = join(ROOT, "src", "public");
export const DEFAULT_PORT = Number(process.env.PORT ?? 8788);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

export interface AppOptions {
  logPath?: string;
  port?: number;
  host?: string;
}

export function buildCapsuleEvent(incoming: Record<string, unknown>): CapsuleEvent {
  return {
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
}

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

export function createBlackboardServer(options: AppOptions = {}): {
  server: Server;
  log: AppendOnlyLog;
  logPath: string;
} {
  const logPath = options.logPath ?? process.env.CAPSULE_LOG_PATH ?? DEFAULT_LOG_PATH;
  const log = new AppendOnlyLog(logPath);
  const clients = new Set<ServerResponse>();

  async function snapshot() {
    const { events, skipped } = await log.read();
    return {
      events,
      skipped,
      projection: projectBoard(events, skipped.length),
    };
  }

  function broadcast(payload: unknown) {
    const frame = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) {
      client.write(frame);
    }
  }

  async function handleApi(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
    if (req.method === "GET" && url.pathname === "/api/health") {
      send(res, 200, { ok: true, log_path: logPath, schema_version: SCHEMA_VERSION, live: "sse" });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/events") {
      const { events, skipped } = await snapshot();
      send(res, 200, { events, skipped });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/projection") {
      const { projection, skipped } = await snapshot();
      send(res, 200, { projection, skipped });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/stream") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      res.write(":\n\n");
      const snap = await snapshot();
      res.write(`data: ${JSON.stringify({ type: "snapshot", ...snap })}\n\n`);
      clients.add(res);
      req.on("close", () => {
        clients.delete(res);
      });
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
      const event = buildCapsuleEvent(parsed as Record<string, unknown>);
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
      const snap = await snapshot();
      broadcast({ type: "appended", event, ...snap });
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
      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      if (await handleApi(req, res, url)) return;
      await handleStatic(res, url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) send(res, 500, { ok: false, errors: [message] });
    }
  });

  return { server, log, logPath };
}

export async function startServer(options: AppOptions = {}): Promise<{
  server: Server;
  port: number;
  url: string;
  logPath: string;
}> {
  const host = options.host ?? "127.0.0.1";
  const requested = options.port ?? DEFAULT_PORT;
  const { server, logPath } = createBlackboardServer(options);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(requested, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("server did not bind a TCP port");
  }
  const url = `http://${host}:${address.port}`;
  return { server, port: address.port, url, logPath };
}
