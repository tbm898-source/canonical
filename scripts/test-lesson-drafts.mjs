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

test("teaching projection exposes exactly the approved outlines without requiring owner access", () => {
  const teaching = JSON.parse(readFileSync(new URL("../content/teaching/design-thinking.json", import.meta.url), "utf8"));
  const source = readFileSync(new URL("../canonical_spine/02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life/04_CURRICULUM/MODULE_SEQUENCE.md", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const sections = source.split(/^## Module \d+: /m).slice(1);
  assert.equal(teaching.modules.length, 6);
  teaching.modules.forEach((module, index) => {
    const split = sections[index].indexOf("\n");
    assert.equal(module.title, sections[index].slice(0, split).trim());
    assert.equal(module.outline, sections[index].slice(split).replace(/\n---\s*$/, "").trim());
    assert.deepEqual(Object.keys(module).sort(), ["outline", "sequence", "title"]);
  });
  const library = readFileSync(new URL("../src/pages/TeachingLibrary.jsx", import.meta.url), "utf8");
  assert.ok(!library.includes("liveOwnerAccess"));
  assert.ok(!library.includes("functions.invoke"));
  const legacy = readFileSync(new URL("../src/pages/ProgramHelper.jsx", import.meta.url), "utf8");
  assert.ok(legacy.includes("Navigate"));
  assert.ok(!legacy.includes("setMode"));
});
