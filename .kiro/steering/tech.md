---
inclusion: always
---

# Tech stack

Lean TypeScript on Node.js 20+, ESM, no front-end framework.

- Runtime: Node.js `http` server in `src/server.ts`, started with `tsx`
- Language: TypeScript, strict settings in `tsconfig.json`
- UI: static `src/public/index.html` + `src/public/app.js`
- Tests: Node's built-in test runner via `tsx --test`
- Persistence: a single append-only JSONL file (`data/soul-capsule.jsonl`)
- Config: `.env.example` documents names only; real secrets stay out of git

## Conventions

- Do not add a database, ORM, or UI framework unless a task in the spec explicitly requires it.
- Do not hard-code API keys. MCP config must use `${ENV}` placeholders.
- Validation lives in `src/schema.ts`. The log layer must refuse invalid or duplicate ids.
- The log module may only append. No rewrite, truncate, or in-place edit of existing lines.
- Prefer small, testable functions over new dependencies.

## Future adapter (not implemented)

`.kiro/settings/mcp.json` reserves a disabled `gc` MCP server with `${GC_API_KEY}` and related placeholders. Do not enable it in a demo until a verified adapter exists. The gc-mcp README documents stub and "not implemented" behaviors on some tools; never treat those as live capabilities.
