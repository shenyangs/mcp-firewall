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
    return void res.status(403).json({ error: "已拒绝非本地来源请求" });
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
    return void res.status(409).json({ error: "调用正在进行，请稍后重试" });
  const data = z
    .object({ allowWrites: z.boolean() })
    .strict()
    .safeParse(req.body);
  if (!data.success)
    return void res.status(400).json({ error: "权限参数无效，请刷新页面后重试" });
  allowWrites = data.data.allowWrites;
  broadcast();
  res.json(state());
});
app.post("/api/invoke", async (req, res) => {
  if (busy)
    return void res.status(409).json({ error: "调用正在进行，请稍后重试" });
  const data = z
    .object({
      tool: z.enum(["read_project_note", "write_project_note"]),
      text: z.string().min(1).max(2048).optional(),
    })
    .strict()
    .safeParse(req.body);
  if (!data.success)
    return void res.status(400).json({ error: "请求参数无效" });
  busy = true;
  try {
    const before = hash();
    const result = await invoke(
      data.data.tool,
      allowWrites,
      data.data.text ?? "本地操作者已批准此次示例更新。\n",
    );
    res.json({ result, before, after: hash() });
    broadcast();
  } catch {
    res.status(500).json({ error: "MCP 调用失败，请检查本地服务后重试" });
  } finally {
    busy = false;
  }
});
app.post("/api/restore", (_req, res) => {
  if (busy)
    return void res.status(409).json({ error: "调用正在进行，请稍后重试" });
  writeNote(initial);
  allowWrites = false;
  broadcast();
  res.json(state());
});
app.use((err: {status?:number}, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status === 413 ? 413 : 400).json({error: err.status === 413 ? "请求内容过大，请缩短后重试" : "请求格式错误，请发送有效 JSON"});
});
app.listen(5205, "127.0.0.1", () =>
  console.log("MCP Firewall 已启动。打开界面：http://127.0.0.1:4205；本地 API：http://127.0.0.1:5205；无需 API Key。"),
).on("error", () => { console.error("API 启动失败：5205 端口可能被占用，请运行 npm run doctor 检查。为避免影响其他应用，不会自动结束进程。"); process.exitCode = 1; });
