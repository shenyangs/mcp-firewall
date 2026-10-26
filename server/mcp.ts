import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { readNote, writeNote, record } from "./storage";
const server = new McpServer({ name: "mcp-firewall", version: "1.0.0" });
server.registerTool(
  "read_project_note",
  {
    description: "Read the fixed fixture note",
    inputSchema: z.object({}).strict(),
  },
  async () => {
    try {
      const text = readNote();
      record({
        timestamp: new Date().toISOString(),
        tool: "read_project_note",
        decision: "Allowed",
        reason: "Read-only tool permitted",
        executed: true,
      });
      return { content: [{ type: "text", text }] };
    } catch {
      return {
        isError: true,
        content: [{ type: "text", text: "Sandbox read failed" }],
      };
    }
  },
);
server.registerTool(
  "write_project_note",
  {
    description: "Write only the fixed fixture note",
    inputSchema: z.object({ text: z.string().min(1).max(2048) }).strict(),
  },
  async ({ text }) => {
    const allowed = process.env.DEMO_ALLOW_WRITES === "true";
    if (!allowed) {
      record({
        timestamp: new Date().toISOString(),
        tool: "write_project_note",
        decision: "Denied",
        reason: "Default-deny write policy",
        executed: false,
      });
      return {
        isError: true,
        content: [{ type: "text", text: "Denied before execution" }],
      };
    }
    try {
      writeNote(text);
      record({
        timestamp: new Date().toISOString(),
        tool: "write_project_note",
        decision: "Allowed",
        reason: "Explicit permission for fixture sandbox",
        executed: true,
      });
      return { content: [{ type: "text", text: "Fixture note updated" }] };
    } catch {
      return {
        isError: true,
        content: [{ type: "text", text: "Sandbox write failed" }],
      };
    }
  },
);
await server.connect(new StdioServerTransport());
