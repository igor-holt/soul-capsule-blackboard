# Tasks: blackboard-core

- [x] 1. Define the local `evt-` schema and validator in `src/schema.ts`
- [x] 2. Implement append-only JSONL storage in `src/log.ts` (no rewrite, reject duplicates)
- [x] 3. Implement `projectBoard` with LIVE / BLOCKED / ACTION REQUIRED mapping
- [x] 4. Expose local HTTP endpoints and a two-agent static UI
- [x] 5. Add unit tests for schema, projection, and append-only behavior
- [x] 6. Add committed `/.kiro` steering, this spec, hooks, and disabled MCP placeholders
- [x] 7. Document pitch, resurrection framing, prior-work disclosure, and honest scope in `README.md`
- [x] 8. Run `npm install`, `npm test`, and a manual two-agent append on `http://127.0.0.1:8788`
- [ ] 9. Optional, only if verified: a thin adapter that mirrors a *successfully confirmed* local write — never stubbed remote data — through gc-mcp. Leave disabled until then.
- [ ] 10. Record the under-2:45 demo video from `/workspace/kiroween/demo-video-plan.md` (upload to YouTube only after Igor approves)
- [ ] 11. Draft Devpost text, Kiro usage write-up, and working-app URL notes for submission
