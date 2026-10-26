import { test, expect } from "vitest";
import { connect } from "../server/client";
import { initial, writeNote, readNote, hash, events } from "../server/storage";
test("official SDK: discovery, read, deny before execution, validate, allow, restore", async () => {
  writeNote(initial);
  const before = hash();
  let client = await connect(false);
  try {
    expect((await client.listTools()).tools.map((t) => t.name)).toEqual([
      "read_project_note",
      "write_project_note",
    ]);
    const read = await client.callTool({
      name: "read_project_note",
      arguments: {},
    });
    expect(JSON.stringify(read)).toContain("Project Atlas");
    const denied = await client.callTool({
      name: "write_project_note",
      arguments: { text: "secret-test-argument" },
    });
    expect(denied.isError).toBe(true);
    expect(hash()).toBe(before);
    expect(events().at(-1)).toMatchObject({
      decision: "Denied",
      executed: false,
    });
    const bad = await client.callTool({
      name: "write_project_note",
      arguments: { text: "x", path: "../../outside" },
    });
    expect(bad.isError).toBe(true);
    expect(hash()).toBe(before);
    await client.close();
    client = await connect(true);
    const allowed = await client.callTool({
      name: "write_project_note",
      arguments: { text: "Approved fixture change" },
    });
    expect(allowed.isError).not.toBe(true);
    expect(readNote()).toBe("Approved fixture change");
    expect(hash()).not.toBe(before);
    expect(events().at(-1)).toMatchObject({
      decision: "Allowed",
      executed: true,
    });
    expect(JSON.stringify(events())).not.toContain("secret-test-argument");
  } finally {
    await client.close();
    writeNote(initial);
  }
}, 30000);
