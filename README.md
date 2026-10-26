# MCP Firewall

**An agent asked to write a file. The firewall stopped it before execution.**

A controlled two-tool MCP gateway with a real stdio server, official MCP TypeScript SDK v2 client, Zod validation, and a local React policy dashboard. This is **not a general-purpose drop-in interceptor for all MCP clients**.

## Run locally

Node.js 22+ and npm are required. Clone this repository independently; no parent workspace files are required.

```sh
npm install --cache .npm-cache
npm run browsers:install
npm run dev
```

Open http://127.0.0.1:4205. The API binds to 127.0.0.1:5205. No API keys or model provider are required. `.env.example` documents optional browser location and manual server policy; the application does not load dotenv. Both ports are fixed. Browser installation stays in `.playwright-browsers/`; a compatible existing browser cache can be selected with `PLAYWRIGHT_BROWSERS_PATH`, and an existing Chromium executable with `PLAYWRIGHT_EXECUTABLE_PATH` (the matching Playwright FFmpeg component is still required).

## Three-step demonstration

1. Click **Read note**, then **Attempt write**. These buttons launch an official SDK client, discover tools, and call the real stdio server. The write is Denied, `executed: false`, and both SHA-256 hashes match.
2. Enable **Write project note**, then **Attempt write** again. The fixed sandbox note changes, the decision is Allowed, and the hashes differ.
3. Click **Restore fixture & lock policy**. The original note is restored and writes default to deny again.

The dashboard counts actual tool handler events only, retaining the latest 100. It streams snapshots over SSE and refreshes every second, so CLI calls also appear. Tool arguments and note contents are absent from the event log. The optional response inspector displays the explicit fixture read result.

`npm run mcp:demo` runs an independent official SDK client through discovery, read, deny, allowed write, assertions and fixture restoration. Run it separately from tests or UI invocations.

## Verification

```sh
npm run build
npm run test
npm run e2e
npm run demo
npm run mcp:demo
```

The integration test spawns actual MCP processes and asserts tool discovery, read success, denied write/no mutation, strict schema rejection, allowed mutation, argument redaction, and restoration. Browser tests assert the same visible policy flow and check invalid API inputs and cross-origin rejection. Demo records genuine video under `artifacts/playwright/` and screenshots at `artifacts/denied-write.png` and `artifacts/allowed-write.png`. Test logs and machine-readable delivery results are local `artifacts/logs/` and `status.json`.

An initial build failed due to a v2 callTool signature mismatch; corrected to the two-argument API. An initial E2E run failed because the default Playwright browser was absent; resolved for verification by read-only reuse of an existing Chromium executable and a matching FFmpeg download inside the project. The optional full Chromium download was stopped because it was slow; fresh clones should run the provided headless-only browser install command. Retained failure evidence is under `artifacts/logs/`.

## Scope and safety

- **FIXTURE data, real deterministic enforcement.** No model inference, synthetic agent traces, or model security claims.
- Exactly two tools: `read_project_note` and `write_project_note`. The only target is `fixtures/sandbox/note.txt`; write input is capped at 2,048 characters. Unknown fields including paths are rejected. Paths through symlinks are refused.
- Deny happens before the underlying write. Permissions are captured for each child process. The UI serializes invocations; policy changes are rejected while an invocation runs. SDK operations have eight-second timeouts.
- No arbitrary file, shell, command, network, credential, or provider exposure. Local-origin checks protect the JSON API. This is not an OS sandbox or authentication system; a hostile local process can alter the files or connect to the local API.
- The bounded JSON audit is local, mutable, and designed for one operator. Parallel external clients are not supported; no tamper resistance, crash durability, multi-process locking, or protection against local filesystem race attacks is claimed.
- Restart resets policy to deny. Audit persists locally; counters describe only the last 100 retained events. Fixture restoration is an explicit administrative demo action, not a model tool call.
- Run tests sequentially, with no separate application instance on the assigned ports. Playwright starts/stops the dev servers automatically. Videos, logs, runtime audit, browser downloads, caches and dependencies are ignored by Git.

MIT licensed.
