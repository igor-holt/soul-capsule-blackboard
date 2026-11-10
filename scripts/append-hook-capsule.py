#!/usr/bin/env python3
"""Append one local evt- record when a Kiro hook fires.

This writes only to the local JSONL log. It does not call gc-mcp, Notion,
or any remote gateway. Existing lines are never rewritten.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

LOG = Path(os.environ.get("CAPSULE_LOG_PATH", "data/soul-capsule.jsonl"))


def existing_ids() -> set[str]:
    ids: set[str] = set()
    if not LOG.exists():
        return ids
    for line in LOG.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError:
            continue
        event_id = parsed.get("id")
        if isinstance(event_id, str):
            ids.add(event_id)
    return ids


def next_id(ids: set[str]) -> str:
    n = 1
    while True:
        candidate = f"evt-hook-{n:04d}"
        if candidate not in ids:
            return candidate
        n += 1


def main() -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    event = {
        "id": next_id(existing_ids()),
        "schema_version": "1.0",
        "record_type": "capsule",
        "event_type": "source_saved",
        "source": "kiro-hook",
        "source_class": "hook",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "title": "Local source saved",
        "content": "Hook append to the local log only. Not a remote capsule write.",
        "tags": ["subject:hook-source"],
        "connections": ["hook-source"],
        "status": "in_progress",
        "author": "capsule-log-on-change",
    }
    with LOG.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
