import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lessonMarkdown, newDraft, readDrafts, saveDraft } from "../src/lib/lessonDrafts.js";

test("two classes and repeated saves keep independent drafts", () => {
  const one = { ...newDraft(), className: "Tuesday workshop", topic: "First topic", date: "2026-10-27" };
  const two = { ...newDraft(), className: "Thursday workshop", topic: "Other topic", date: "2026-10-29" };
  const drafts = saveDraft(saveDraft(saveDraft([], one), two), { ...one, remaining: "Finish the discussion" });
  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].remaining, "Finish the discussion");
  assert.equal(drafts[1].className, "Thursday workshop");
  assert.deepEqual(readDrafts(JSON.stringify({ version: 1, drafts })), drafts);
});

test("broken storage is rejected rather than silently erased", () => {
  assert.deepEqual(readDrafts(null), []);
  for (const raw of ["broken", "null", '{"version":2,"drafts":[]}', '{"version":1,"drafts":[{}]}']) assert.throws(() => readDrafts(raw));
});

test("freeform notes and chosen dates survive download without interpretation", () => {
  const draft = { ...newDraft(), topic: "Sizing practice", date: "2026-11-03", remaining: "Finish question 3.\nLeave extra time for discussion." };
  const markdown = lessonMarkdown(draft);
  assert.ok(markdown.includes(draft.remaining));
  assert.ok(markdown.includes("2026-11-03"));
  assert.ok(!markdown.includes("2026-03-26"));
});

test("authenticated payload includes all six original outlines and keeps the owner gate", () => {
  const source = readFileSync(new URL("../base44/functions/getCanonicalProgramFull/entry.ts", import.meta.url), "utf8");
  const modules = JSON.parse(source.match(/const PRISM_DTJL_MODULES = (\[[\s\S]*?\n\]);/)[1]);
  const originals = readFileSync(new URL("../canonical_spine/02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life/04_CURRICULUM/MODULE_SEQUENCE.md", import.meta.url), "utf8")
    .split(/^## Module \d+: /m).slice(1).map((section) => section.slice(section.indexOf("\n")).replace(/\n---\s*$/, "").trim());
  assert.equal(originals.length, 6);
  assert.deepEqual(modules.filter((module) => module.sequence_order > 0).map((module) => module.teaching_outline), originals);
  assert.ok(source.indexOf("await requireOwnerAdmin(base44)") < source.indexOf('if (programKey === "PRISM_DTJL")'));
});
