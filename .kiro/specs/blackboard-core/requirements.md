# Requirements: blackboard-core

These requirements describe the local Soul Capsule Blackboard. They do not require a remote Genesis Conductor service.

## Requirement 1: Append-only capsule log

**User Story:** As a builder running the local app, I want agent sources to append capsule events to a durable log so that earlier records cannot be silently rewritten.

### Acceptance Criteria

1. WHEN a client submits a well-formed capsule event, THE SYSTEM SHALL append exactly one new line of JSON to the log file and SHALL NOT modify any existing line.
2. WHEN a client submits an event whose `id` already exists in the log, THE SYSTEM SHALL reject the write and leave the log unchanged.
3. WHEN a client submits an event that fails schema validation, THE SYSTEM SHALL reject the write and leave the log unchanged.
4. WHEN the log file does not yet exist, THE SYSTEM SHALL create it as part of a successful append.

## Requirement 2: Event schema

**User Story:** As a judge inspecting a record, I want each event to carry a stable `evt-` identity and status so that the board and the log tell the same story.

### Acceptance Criteria

1. WHEN an event is accepted, THE SYSTEM SHALL require `id` to match the pattern `evt-` followed by one or more letters, digits, dots, underscores, or hyphens.
2. WHEN an event is accepted, THE SYSTEM SHALL require `schema_version` to be `"1.0"`, and SHALL require `record_type`, `event_type`, `source`, `timestamp`, `tags`, `connections`, and `status`.
3. WHEN `status` is not one of `proposed`, `planned`, `in_progress`, `blocked`, `action_required`, `live`, `deprecated`, or `resolved`, THE SYSTEM SHALL reject the event.
4. WHEN `timestamp` is not an ISO-8601 datetime with a timezone offset or `Z`, THE SYSTEM SHALL reject the event.

## Requirement 3: Board projection

**User Story:** As a viewer of the web UI, I want a derived board that shows LIVE, BLOCKED, and ACTION REQUIRED so that I can see the latest shared state without reading the raw log.

### Acceptance Criteria

1. WHEN one or more accepted events share the same subject key, THE SYSTEM SHALL project that subject using only the latest event by `timestamp`.
2. WHEN the latest status for a subject is `live`, THE SYSTEM SHALL place that subject in the LIVE column.
3. WHEN the latest status for a subject is `blocked`, THE SYSTEM SHALL place that subject in the BLOCKED column.
4. WHEN the latest status for a subject is `action_required`, THE SYSTEM SHALL place that subject in the ACTION REQUIRED column.
5. WHEN the latest status is any other allowed value, THE SYSTEM SHALL omit that subject from the three demo columns (it may appear in an `other` list in the API).
6. WHEN the projection is computed, THE SYSTEM SHALL treat the log as the source of truth and SHALL NOT persist a second writable copy of board state.

## Requirement 4: Two-agent local demo

**User Story:** As a presenter, I want two named agent sources to append events from a browser so that a under-three-minute demo can show coordination on the board.

### Acceptance Criteria

1. WHEN the local server is running, THE SYSTEM SHALL serve a web UI that can append events as `agent-a` or `agent-b`.
2. WHEN an event is successfully appended, THE SYSTEM SHALL refresh the board projection so the new latest status is visible without a manual reload of the page logic (a refresh after the POST is sufficient).
3. WHEN the UI describes the product, THE SYSTEM SHALL NOT state that gc-mcp, Notion, or a remote capsule store performed the write.

## Requirement 5: Integrity of skipped lines

**User Story:** As a builder, I want corrupt log lines to be skipped and reported rather than silently repaired, so that the append-only rule stays honest.

### Acceptance Criteria

1. WHEN a log line is not valid JSON or fails schema validation, THE SYSTEM SHALL skip that line, continue reading later lines, and report the skip in the API response.
2. WHEN reporting a skip, THE SYSTEM SHALL NOT rewrite the corrupt line in the log file.
