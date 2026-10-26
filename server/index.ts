import express from "express";
import { z } from "zod";
import { invoke } from "./client";
import { events, hash, writeNote, initial } from "./storage";
const app = express();
app.use(express.json({ limit: "8kb" }));
app.use((req, res, next) => {
  if (
    req.headers.origin &&
    !["http://127.0.0.1:4205", "http://127.0.0.1:5205"].includes(
      req.headers.origin,
    )
  )
    return void res.status(403).json({ error: "Origin refused" });
  next();
});
let allowWrites = false,
  busy = false;
const peers = new Set<express.Response>();
const state = () => ({ allowWrites, events: events(), hash: hash() });
function broadcast() {
  for (const peer of peers) peer.write(`data: ${JSON.stringify(state())}\n\n`);
}
setInterval(() => {
  if (peers.size) broadcast();
}, 1000).unref();
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, project: "mcp-firewall" }),
);
app.get("/api/state", (_req, res) => res.json(state()));
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();
  peers.add(res);
  res.write(`data: ${JSON.stringify(state())}\n\n`);
  req.on("close", () => peers.delete(res));
});
app.post("/api/policy", (req, res) => {
  if (busy)
    return void res.status(409).json({ error: "Invocation in progress" });
  const data = z
    .object({ allowWrites: z.boolean() })
    .strict()
    .safeParse(req.body);
  if (!data.success)
    return void res.status(400).json({ error: "Invalid policy" });
  allowWrites = data.data.allowWrites;
  broadcast();
  res.json(state());
});
app.post("/api/invoke", async (req, res) => {
  if (busy)
    return void res.status(409).json({ error: "Invocation in progress" });
  const data = z
    .object({
      tool: z.enum(["read_project_note", "write_project_note"]),
      text: z.string().min(1).max(2048).optional(),
    })
    .strict()
    .safeParse(req.body);
  if (!data.success)
    return void res.status(400).json({ error: "Invalid request" });
  busy = true;
  try {
    const before = hash();
    const result = await invoke(
      data.data.tool,
      allowWrites,
      data.data.text ?? "Fixture update approved by local operator.\n",
    );
    res.json({ result, before, after: hash() });
    broadcast();
  } catch {
    res.status(500).json({ error: "MCP invocation failed" });
  } finally {
    busy = false;
  }
});
app.post("/api/restore", (_req, res) => {
  if (busy)
    return void res.status(409).json({ error: "Invocation in progress" });
  writeNote(initial);
  allowWrites = false;
  broadcast();
  res.json(state());
});
app.listen(5205, "127.0.0.1", () =>
  console.log("MCP Firewall API: http://127.0.0.1:5205"),
);
