---
inclusion: always
---

# Product

Soul Capsule Blackboard is a small, local web application for the Kiroween 2026 Resurrection category.

## Purpose

Resurrect classical blackboard / append-only shared-memory coordination: agents append `evt-` capsules to a single log; a derived board shows LIVE, BLOCKED, and ACTION REQUIRED.

## Audience

Judges and the builder (Igor Holt). A first-time viewer should understand the idea from a under-three-minute demo.

## In scope

- Local append-only JSONL log
- Schema validation
- Projection of the latest status per subject
- A simple UI where two named agent sources can append events
- Committed specs, steering, hooks, and MCP placeholders under `/.kiro`

## Out of scope (do not imply these work)

- Remote `gc-mcp`, Notion capsule writes, or Ambient Access Layer task routing
- Public hosting, accounts, or payments
- On-chain attestation or Diamondnode telemetry
- Installing or depending on unpublished secrets

## Voice

Be precise. Prefer "this local log appends a record" over "the Soul Capsule network accepted the write." If a feature is not implemented, say so.
