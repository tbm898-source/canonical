import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(path.join(root, "canonical_spine/02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life/04_CURRICULUM/MODULE_SEQUENCE.md"), "utf8").replace(/\r\n/g, "\n");
const modules = source.split(/^## Module \d+: /m).slice(1).map((section, index) => {
  const split = section.indexOf("\n");
  return { sequence: index + 1, title: section.slice(0, split).trim(), outline: section.slice(split).replace(/\n---\s*$/, "").trim() };
});
if (modules.length !== 6 || modules.some((module) => !module.outline.includes("### Concepts") || !module.outline.includes("### Student outputs"))) throw new Error("Expected six complete teaching outlines");
const projection = { version: 1, title: "Design Thinking for a Joyful Life", approval: "Teaching outlines unlocked by the program owner on 2026-10-23", modules };
mkdirSync(path.join(root, "content/teaching"), { recursive: true });
writeFileSync(path.join(root, "content/teaching/design-thinking.json"), JSON.stringify(projection, null, 2) + "\n");
console.log("Published teaching projection: six module outlines; no method diagnostics or private paths.");
