import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { root } from "./storage";
export async function connect(allowWrites = false) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", root + "server/mcp.ts"],
    cwd: root,
    env: { DEMO_ALLOW_WRITES: String(allowWrites) },
    stderr: "pipe",
  });
  const client = new Client({ name: "firewall-demo-client", version: "1.0.0" });
  try {
    await client.connect(transport, { timeout: 8000 });
    return client;
  } catch (e) {
    await transport.close();
    throw e;
  }
}
export async function invoke(
  tool: string,
  allowWrites: boolean,
  text?: string,
) {
  const client = await connect(allowWrites);
  try {
    const catalog = await client.listTools({}, { timeout: 8000 });
    if (!catalog.tools.some((t) => t.name === tool))
      throw new Error("Unknown tool");
    return await client.callTool(
      { name: tool, arguments: tool === "write_project_note" ? { text } : {} },
      { timeout: 8000 },
    );
  } finally {
    await client.close();
  }
}
