# A05 — MCP Firewall

Build a REAL MCP v2 policy gate, not merely a security-looking UI. Read ./AGENTS.md. Implement stdio tools/client using preinstalled `@modelcontextprotocol/server` and `@modelcontextprotocol/client` v2 plus Zod v4 compatible validation.

## Tight architecture
- A local MCP stdio server exposes two demo tools: `read_project_note` and `write_project_note`. The underlying file resides ONLY in `fixtures/sandbox/note.txt`. A policy engine checks each validated call BEFORE the underlying read/write. Default deny writes, default allow reads, optional UI toggle to allow writes only within demo root.
- Store `{timestamp, tool, decision, reason, executed}` to bounded local log and stream to React dashboard. Redact arguments and never log sensitive text. Display real requests from a provided MCP client invocation using SDK (listTools/callTool), not synthetic UI events.
- A denied write MUST not reach execution; file's original hash must remain identical. Bind local UI/API 127.0.0.1. Avoid arbitrary command or network tool exposure.

## P0 happy path
1. Dashboard renders policy cards and tool call activity, with `Allowed` / `Denied` counters derived only from actual invocation events.
2. Client script calls read_note: permitted, returns fixture content, log shows executed.
3. Client calls write_note: denied with reason; verify file unchanged; log shows `executed:false`.
4. Toggle demo permission; repeat an allowed in-sandbox write and verify changed content. Restore fixture after demo.

## Must prove
- `tests/mcp.integration.test.ts` spawns MCP server, calls tools using official client SDK and asserts read success, write denial/no mutation, allowed write mutation.
- E2E dashboard displays the real calls and correct decision labels.
- `tests/demo.spec.ts` captures policy toggles with tool invocations/screenshot/video.
- README says this MVP is a controlled two-tool gateway, NOT a general-purpose drop-in interceptor for all MCP clients.

## X hook
'An agent asked to write a file. The MCP tool fired… but the firewall stopped it BEFORE execution.' Show blocked request, unchanged hash, policy flip, permitted write.


Execute within this directory only. Run npm install, implement, then build/test/e2e/demo. Preserve real logs and status.json.
