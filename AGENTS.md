# Shared AGENTS.md — 3-hour AI X sprint

You are one of ten independent coding agents. Work ONLY inside the current app directory. Do not change siblings, the parent workspace, system settings, or user data. Do not run destructive shell commands outside this app. A seeded demo is acceptable only when visibly labelled FIXTURE / REPLAY; do not call it LIVE.

## Non-negotiable delivery contract

1. Finish ONE working vertical slice before adding extras: UI action -> real underlying operation -> visible result -> verified automated assertion.
2. Use the provided TypeScript / React / Vite / Express scaffold and preinstalled packages. Do not rewrite the whole stack, implement accounts, auth, payments or cloud deployment. Do not edit machine-wide CLI settings.
3. Keep all servers bound to 127.0.0.1. Write backend actions with safe input validation, caps and timeouts. Never read arbitrary local user files. Do not print or commit API keys. Configure providers only through .env and .env.example.
4. Do not claim AI was used if no actual inference happened; label offline algorithmic or replay paths accurately. Do not fabricate benchmark scores, test passes, intercepted MCP calls or research equations.
5. Actual proof: `npm run build`, `npm run test`, `npm run e2e`, `npm run demo`; if a command fails, report it rather than changing it into a no-op.
6. Update README.md with setup, exact demo flow, limitations, security precautions and honest status. Write `status.json` according to status schema below. Keep fixture files separate from actual events.
7. Design an exceptional 16:9 dark-mode demo suitable for X: typography, generous spacing, high contrast, tasteful accent, clear action feedback. No stock fake dashboard metrics.
8. Ensure the Playwright demo test produces a genuine screen recording under `artifacts/playwright/` and at least one screenshot. Call a REAL use case; don't make it click a dummy button.
9. If blocked, deliver the working subset and status PARTIAL/BLOCKED instead of inventing features. Prioritize core data path > smoke test > visuals > stretch.
10. At end create an actual `status.json` with `project`, `state` (`PASS|PARTIAL|BLOCKED|FAIL`), `scenario`, `checks` array `{id,passed,evidence}`, `commands` array `{cmd,exitCode}`, `liveModel` boolean, `fixturesUsed` boolean, `demoVideo` path or null, `limitations` array. Never mark PASS without successful build, relevant behavior assertion, and demo verification. Evidence references must point to existing local files or reproducible commands.

## README contract

- Purpose and one-sentence X hook
- Setup: npm install, npm run dev; relevant environment requirements
- Exact three-click demo steps
- Honest live / fixture / replay explanation
- Real proof and commands, including failing commands
- Limitations and known safety boundaries
- No secrets; no unsupported claims

## Ports

Use the project-specific Vite port 4201–4210 and Express API port 5201–5210 already defined in project files. Do not change port assignments. API health endpoint remains `/api/health`.
