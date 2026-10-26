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
    "CLI fixture update",
  );
  assert(denied.isError);
  assert.equal(hash(), before);
  const allowed = await invoke(
    "write_project_note",
    true,
    "CLI fixture update",
  );
  assert(!allowed.isError);
  assert.notEqual(hash(), before);
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
