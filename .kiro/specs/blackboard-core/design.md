# Design: blackboard-core

## Overview

A single Node.js process serves static UI files and a small JSON API. Capsule events are validated, then appended to a JSONL file. A projection function reads the accepted events and groups them by subject.

This is an event-sourced, CQRS-style split in miniature: the log is the write model; the board is a read model computed on request.

## Components

```
Browser UI  --POST /api/events-->  HTTP server  -->  validate  -->  AppendOnlyLog
Browser UI  --GET  /api/projection--> HTTP server -->  read log  -->  projectBoard
Browser UI  --GET  /api/stream----->  HTTP server  -->  SSE snapshot + append events
```

- `src/schema.ts` — types, status vocabulary, validator
- `src/log.ts` — append-only file I/O and duplicate-id check
- `src/projection.ts` — latest-status-per-subject mapping
- `src/app.ts` — HTTP app factory, `/api/*`, and `/api/stream` SSE
- `src/server.ts` — `127.0.0.1` listener entry
- `scripts/demo.ts` — `npm run demo` seeds agent-a / agent-b and starts the server
- `src/public/*` — static form and board

## Subject key

A subject is taken from the first tag of the form `subject:<key>` if present, otherwise from `connections[0]`, otherwise from the event `id`. The demo UI always writes `subject:<key>` and mirrors the key in `connections`.

## Status mapping

| Event `status` | Board column |
| --- | --- |
| `live` | LIVE |
| `blocked` | BLOCKED |
| `action_required` | ACTION REQUIRED |
| all other allowed statuses | not shown in the three demo columns |

## Persistence

Default path: `data/soul-capsule.jsonl` (overridable with `CAPSULE_LOG_PATH`). The file is created on first successful append. Git ignores `data/*.jsonl` so generated demo data is not committed; this does not affect the append-only rule at runtime.

## Error handling

- 400: invalid JSON body or failed validation
- 409: duplicate `id`
- Skipped lines on read are returned alongside events and projections; they are not deleted

## Non-goals

No remote MCP calls in this design. `.kiro/settings/mcp.json` is a disabled placeholder for a later, separately verified adapter.

## Testing

`npm test` runs Node's test runner against `test/schema.test.ts`, `test/projection.test.ts`, and `test/http.test.ts`, covering validation, latest-status projection, append-only / duplicate-id guarantees, the two-agent HTTP path, and SSE append notifications.

## Security

The server listens on `127.0.0.1` only. There is no authentication. This is a local demo, not a public service. Secrets must never be placed in steering files, hook commands, or `mcp.json`.
