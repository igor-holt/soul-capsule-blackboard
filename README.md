# Soul Capsule Blackboard

Kiroween 2026 project for the **Resurrection** category.

**Live demo:** https://soul-capsule-blackboard.onrender.com

Public repository: https://github.com/igor-holt/soul-capsule-blackboard (`main`).

A working software application in which two agent sources append `evt-` capsules to an **append-only** JSONL log, and a simple web board projects each subject into **LIVE**, **BLOCKED**, or **ACTION REQUIRED**.

## Pitch

Modern multi-agent stacks often pass chat transcripts around and hope the next model remembers what mattered. This project resurrects a quieter idea: a shared blackboard. Agents do not overwrite a living document. They append facts. A derived projection, not a second writable log, is what a human sees.

The demo is deliberately small. Agent A and Agent B post capsules about the same subject. The board updates from the latest status. That is the whole story a judge should be able to watch in under three minutes.

## What is being resurrected

**Classical blackboard / append-only shared-memory coordination.**

In classical blackboard systems and in append-only event logs (and later CQRS read models), specialists did not share a mutable blob of "current state." They wrote entries onto a common board. Readers derived a view. The log stayed the source of truth.

This app applies that pattern to a local Soul Capsule-style event log:

- Records have `evt-` ids, `schema_version`, `record_type`, `tags`, `connections`, and `status`.
- The log is append-only. Existing lines are never rewritten.
- The board is a projection. `live` maps to LIVE, `blocked` to BLOCKED, `action_required` to ACTION REQUIRED.

This is a local implementation of that idea. It is not a claim that a historical blackboard engine, a remote Genesis Conductor gateway, or a Notion capsule database is running inside this repo.

## Prior-work disclosure

Official Kiroween rules require new work during the Submission Period (October 30 to December 4, 2026) and disclosure of pre-existing code or designs that are incorporated. This draft **reuses design, not a copied runtime**, from public Genesis Conductor materials:

| Source | What is reused as design | What this repo does **not** claim |
| --- | --- | --- |
| [Genesis-Conductor-Engine/gc-mcp](https://github.com/Genesis-Conductor-Engine/gc-mcp) `README.md` | Capsule write/query *recipe* and the idea of a traceable capsule record (`gc_write_soul_capsule`, `gc_query_soul_capsule`). | This draft does not call `gc-mcp`, does not submit tasks to the Ambient Access Layer, and does not implement the seven `gc_*` tools. The gc-mcp README also documents known issues (status stubs; query may return "not implemented"). Those remote behaviors are not part of this demo. |
| [Genesis-Conductor-Engine/genesis-conductor-powers](https://github.com/Genesis-Conductor-Engine/genesis-conductor-powers) directory `soul-capsule-event-log` and root `README.md` | Documented framing of an append-only event log with event-sourcing / CQRS-style provenance. | This repo does not install or ship those Kiro Powers as a running dependency. |
| Notion page [Genesis Conductor: 7-Agent Topology and Soul Capsule Integration Protocol](https://app.notion.com/p/33e98ee3e91e81ebac98fa48b7874283) (edited 2026-05-10) | Recommended `evt-` record fields, status vocabulary (`proposed`, `planned`, `in_progress`, `blocked`, `action_required`, `live`, `deprecated`, `resolved`), append-only log plus derived projection, and suggested Kiro hooks / `.kiro/agents` patterns listed there as next steps. | This research-era page is a protocol, not proof that `.kiro/agents/genesis-agent.json` already exists in every GC repo. This draft uses the field names and the board vocabulary. It does not read `~/.genesis/soul-capsule-v1.jsonl` or write to Notion. |
| Google Drive markdown `NMIR-TAEX-v1.0-Neurohomogenistic-Intent-Router-Artifact.md` | Supporting mention of an `evt-` capsule event schema. | The full NMIR / Diamondnode attestation and thermodynamic routing path is **not** implemented here and is not part of the demo. |

New work in this repository (to be built and finished during the Submission Period): the local validator, append-only log, projection, web UI, tests, and the committed `/.kiro` specs, steering, hooks, and MCP config placeholders.

## Current scope (honest)

Implemented:

- Append-only JSONL log at `data/soul-capsule.jsonl` (gitignored as generated data; the `data/` directory is kept)
- Schema validation for `evt-` records (`schema_version` `1.0`)
- Derived board projection with three demo columns
- A web UI so two agent sources can append events, with live board updates over `/api/stream` (Server-Sent Events)
- Demo seed on start when the log is empty, so judges see the board immediately
- `npm run demo` for a local one-command walkthrough
- Unit and HTTP/SSE tests
- A committed `/.kiro` directory (not gitignored)
- A public free-tier Render deploy at the live URL above (plan `free`, no payment method added for this service)

Not implemented, and not claimed:

- Live `gc-mcp` or Notion-bridge writes/queries
- Authentication or multi-user accounts
- Persistent hosted storage (the Render free filesystem is ephemeral)
- On-chain attestation, EulerCycleAttestor, or Diamondnode telemetry
- Property-based testing, custom Kiro agents on disk, or a Kiro Crew app
- A recorded demo video or a Devpost submission (those come later, and any YouTube upload waits for Igor's approval)

`.kiro/settings/mcp.json` contains `${ENV}` placeholders and leaves the `gc` server `disabled` so a future adapter can be wired without committing secrets. Enabling it does not make remote tools work until that adapter is actually built and verified.

## Run the live demo

Open https://soul-capsule-blackboard.onrender.com

The first request may take about a minute if the free instance has spun down. After it is up, the board is already seeded: `demo-task` under BLOCKED (latest of two agent appends) and `review-gate` under ACTION REQUIRED. You can append another capsule in the form; `/api/stream` updates open tabs. `GET /health` returns 200. `POST /api/events` appends a capsule and the projection updates.

This is a Render **Free** web service (`$0`, 512 MB RAM). Limits that judges should expect:

- The instance spins down after 15 minutes without inbound traffic, then takes about a minute to start again.
- Each workspace has 750 free instance hours per calendar month; a spun-down service does not consume those hours. If the hours run out, free services are suspended until the next month.
- Disk is ephemeral. Appended capsules are lost on spin-down, restart, or redeploy, and the two-agent demo seed is written again on the next start.
- No secrets are stored in the repo. Hosting env vars are only `SEED_DEMO=1` and `HOST=0.0.0.0`. Render also provides `$PORT`.

`render.yaml` in this repo documents that free-tier service. Do not change `plan` to a paid value.

## Run instructions (local)

Requires Node.js 20 or newer. One-command demo:

```bash
git clone https://github.com/igor-holt/soul-capsule-blackboard.git
cd soul-capsule-blackboard
npm install
npm run demo
```

That command starts the local server, seeds capsules from `agent-a` and `agent-b` into a fresh `data/demo-session.jsonl` (it does not rewrite any other log), and prints http://127.0.0.1:8788. Open the URL. The board should already show `demo-task` under BLOCKED (latest of two appends) and `review-gate` under ACTION REQUIRED. Further appends update open tabs over Server-Sent Events.

Useful scripts:

```bash
npm test    # unit + HTTP/SSE tests
npm start   # binds $PORT or 8788; seeds the default log only if it is empty
npm run demo
```

When `PORT` is set (as on Render), the server binds `0.0.0.0`. Local runs without `PORT` stay on `127.0.0.1`.

Optional environment (see `.env.example`):

- `PORT` — defaults to `8788`
- `HOST` — defaults to `0.0.0.0` when `PORT` is set, otherwise `127.0.0.1`
- `CAPSULE_LOG_PATH` — defaults to `data/soul-capsule.jsonl`
- `SEED_DEMO` — `npm start` always seeds an empty log; set `SEED_DEMO=0` only if you need a blank board

Do not commit a `.env` file.

## Kiroween notes

- Category: **Resurrection**
- License: MIT, Copyright (c) 2026 Igor Apollovich Holt, in `LICENSE` (keep this visible in the GitHub About section)
- The `/.kiro` directory must remain committed and must not be added to `.gitignore`
- Submission deadline: December 4, 2026, 5:00 PM ET (2:00 PM PT). See `/workspace/kiroween/plan.json` and `/workspace/kiroween/demo-video-plan.md` for the compressed schedule and shot list.

Questions about official rules belong on [kiroween.devpost.com/rules](https://kiroween.devpost.com/rules).
