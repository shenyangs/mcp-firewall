import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { readNote, writeNote, record } from "./storage";
const server = new McpServer({ name: "mcp-firewall", version: "1.0.0" });
server.registerTool(
  "read_project_note",
  {
    description: "读取固定的示例笔记",
    inputSchema: z.object({}).strict(),
  },
  async () => {
    try {
      const text = readNote();
      record({
        timestamp: new Date().toISOString(),
        tool: "read_project_note",
        decision: "Allowed",
        reason: "只读工具已允许",
        executed: true,
      });
      return { content: [{ type: "text", text }] };
    } catch {
      return {
        isError: true,
        content: [{ type: "text", text: "沙盒读取失败，请检查示例文件及权限" }],
      };
    }
  },
);
server.registerTool(
  "write_project_note",
  {
    description: "仅写入固定的示例笔记",
    inputSchema: z.object({ text: z.string().min(1).max(2048) }).strict(),
  },
  async ({ text }) => {
    const allowed = process.env.DEMO_ALLOW_WRITES === "true";
    if (!allowed) {
      record({
        timestamp: new Date().toISOString(),
        tool: "write_project_note",
        decision: "Denied",
        reason: "默认拒绝写入",
        executed: false,
      });
      return {
        isError: true,
        content: [{ type: "text", text: "已在执行前拒绝写入" }],
      };
    }
    try {
      writeNote(text);
      record({
        timestamp: new Date().toISOString(),
        tool: "write_project_note",
        decision: "Allowed",
        reason: "已明确授权示例沙盒",
        executed: true,
      });
      return { content: [{ type: "text", text: "示例笔记已更新" }] };
    } catch {
      return {
        isError: true,
        content: [{ type: "text", text: "沙盒写入失败，请检查示例文件及权限" }],
      };
    }
  },
);
await server.connect(new StdioServerTransport());
