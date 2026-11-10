# Soul Capsule Blackboard

Local Kiroween 2026 draft for the **Resurrection** category.

A working software application in which two agent sources append `evt-` capsules to an **append-only** JSONL log, and a simple web board projects each subject into **LIVE**, **BLOCKED**, or **ACTION REQUIRED**. This repository is a local draft only. It has not been published, pushed, or submitted.

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

Implemented in this local draft:

- Append-only JSONL log at `data/soul-capsule.jsonl` (gitignored as generated data; the `data/` directory is kept)
- Schema validation for `evt-` records (`schema_version` `1.0`)
- Derived board projection with three demo columns
- A local web UI on `http://127.0.0.1:8788` so two agent sources can append events
- Unit tests for validation, projection, and append-only behavior
- A committed `/.kiro` directory (not gitignored)

Not implemented, and not claimed:

- Live `gc-mcp` or Notion-bridge writes/queries
- Authentication, multi-user networking, or a public deployment
- On-chain attestation, EulerCycleAttestor, or Diamondnode telemetry
- Property-based testing, custom Kiro agents on disk, or a Kiro Crew app
- A recorded demo video or a Devpost submission (those come later, and any YouTube upload waits for Igor's approval)

`.kiro/settings/mcp.json` contains `${ENV}` placeholders and leaves the `gc` server `disabled` so a future adapter can be wired without committing secrets. Enabling it does not make remote tools work until that adapter is actually built and verified.

## Run instructions (local)

Requires Node.js 20 or newer.

```bash
cd soul-capsule-blackboard
npm install
npm test
npm start
```

Then open [http://127.0.0.1:8788](http://127.0.0.1:8788). Choose `agent-a` or `agent-b`, set a subject key, pick a status, and append. The three board columns update from the latest event per subject.

Optional environment (see `.env.example`):

- `PORT` — defaults to `8788`
- `CAPSULE_LOG_PATH` — defaults to `data/soul-capsule.jsonl`

Do not commit a `.env` file.

## Kiroween notes

- Category: **Resurrection**
- License: MIT, Copyright (c) 2026 Igor Apollovich Holt, in `LICENSE` (keep this visible in GitHub About when a public repo is created later)
- The `/.kiro` directory must remain committed and must not be added to `.gitignore`
- Submission deadline: December 4, 2026, 5:00 PM ET (2:00 PM PT). See `/workspace/kiroween/plan.json` and `/workspace/kiroween/demo-video-plan.md` for the compressed schedule and shot list.

Questions about official rules belong on [kiroween.devpost.com/rules](https://kiroween.devpost.com/rules).
