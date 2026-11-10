/**
 * Append-only JSONL capsule log.
 * Records are only ever appended. This module never rewrites, truncates,
 * or deletes existing lines. A corrupt line is skipped at read time and
 * reported; it is not repaired in place.
 */
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type CapsuleEvent,
  validateCapsuleEvent,
} from "./schema.ts";

export interface ReadResult {
  events: CapsuleEvent[];
  skipped: { line: number; reason: string }[];
}

export class AppendOnlyLog {
  constructor(private readonly filePath: string) {}

  async append(event: CapsuleEvent): Promise<void> {
    const check = validateCapsuleEvent(event);
    if (!check.ok) {
      throw new Error(`refusing to append invalid event: ${check.errors.join("; ")}`);
    }
    await mkdir(dirname(this.filePath), { recursive: true });
    const existing = await this.read();
    if (existing.events.some((e) => e.id === event.id)) {
      throw new Error(`duplicate event id: ${event.id}`);
    }
    const line = JSON.stringify(event) + "\n";
    await appendFile(this.filePath, line, { encoding: "utf8" });
  }

  async read(): Promise<ReadResult> {
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return { events: [], skipped: [] };
      throw err;
    }
    const events: CapsuleEvent[] = [];
    const skipped: { line: number; reason: string }[] = [];
    const lines = raw.split("\n");
    lines.forEach((line, index) => {
      if (line.trim() === "") return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        skipped.push({ line: index + 1, reason: "invalid JSON" });
        return;
      }
      const check = validateCapsuleEvent(parsed);
      if (!check.ok) {
        skipped.push({ line: index + 1, reason: check.errors.join("; ") });
        return;
      }
      events.push(parsed as CapsuleEvent);
    });
    return { events, skipped };
  }
}
