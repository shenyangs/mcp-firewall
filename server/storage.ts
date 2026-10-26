import {
  readFileSync,
  writeFileSync,
  lstatSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
export const root = fileURLToPath(new URL("../", import.meta.url));
export const note = root + "fixtures/sandbox/note.txt";
export const initial =
  "Project Atlas — 示例笔记（fixture）。\n发布需要人工复核。\n";
export function safe() {
  for (const p of ["fixtures", "fixtures/sandbox", "fixtures/sandbox/note.txt"])
    if (lstatSync(root + p).isSymbolicLink())
      throw new Error("拒绝访问符号链接");
}
export function readNote() {
  safe();
  return readFileSync(note, "utf8");
}
export function writeNote(text: string) {
  safe();
  writeFileSync(note, text);
}
export function hash() {
  return createHash("sha256").update(readNote()).digest("hex");
}
export type Event = {
  timestamp: string;
  tool: string;
  decision: "Allowed" | "Denied";
  reason: string;
  executed: boolean;
};
const log = root + "artifacts/events.json";
export function events(): Event[] {
  return existsSync(log) ? JSON.parse(readFileSync(log, "utf8")) : [];
}
export function record(event: Event) {
  mkdirSync(root + "artifacts", { recursive: true });
  writeFileSync(log, JSON.stringify([...events(), event].slice(-100), null, 2));
}
