---
inclusion: always
---

# Project structure

```
.
├── LICENSE
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore          # must not ignore .kiro
├── .kiro/
│   ├── steering/       # product.md, tech.md, structure.md
│   ├── specs/blackboard-core/
│   ├── hooks/          # JSON hook configs
│   └── settings/mcp.json
├── src/
│   ├── schema.ts       # evt- validation
│   ├── log.ts          # append-only JSONL
│   ├── projection.ts   # LIVE / BLOCKED / ACTION REQUIRED
│   ├── server.ts       # local HTTP API + static UI
│   └── public/         # index.html, app.js
├── test/               # node:test suites
└── data/               # runtime log (jsonl is gitignored)
```

## Naming

- Event ids start with `evt-`.
- Subject keys used by the board are stored as a `subject:<key>` tag and mirrored in `connections`.
- HTTP JSON endpoints live under `/api/`.

When adding files, keep the blackboard core in `src/` and do not scatter a second source of truth for events.
