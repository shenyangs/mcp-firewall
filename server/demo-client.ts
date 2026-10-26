import assert from "node:assert/strict";
import { invoke } from "./client";
import { readNote, writeNote, hash } from "./storage";
const original = readNote();
try {
  const before = hash();
  const read = await invoke("read_project_note", false);
  assert(!read.isError);
  const denied = await invoke(
    "write_project_note",
    false,
    "命令行示例更新",
  );
  assert(denied.isError);
  assert.equal(hash(), before);
  const allowed = await invoke(
    "write_project_note",
    true,
    "命令行示例更新",
  );
  assert(!allowed.isError);
  assert.notEqual(hash(), before);
  console.log("验证通过：真实读取、拒绝且文件未改变、授权写入；示例文件将在退出前恢复。无需模型或 API Key。");
  console.log(
    JSON.stringify({
      read: true,
      deniedWithoutMutation: true,
      allowedWrite: true,
      transport: "official SDK stdio",
      fixture: true,
    }),
  );
} finally {
  writeNote(original);
}
