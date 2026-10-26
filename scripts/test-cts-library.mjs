import { ctsMaterialUrl } from "../src/lib/ctsAssets.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ctsLessonSeed } from "../src/lib/ctsSequence.js";
import { newDraft, initialDraft, readDrafts, saveDraft, lessonMarkdown, DRAFT_FIELDS } from "../src/lib/lessonDrafts.js";

const catalog = JSON.parse(readFileSync(new URL("../content/teaching/cts/catalog.json", import.meta.url), "utf8"));
const lessons = catalog.courses.flatMap((course) => course.days);

test("five two-week courses reserve all 40 stable program positions", () => {
  assert.deepEqual(catalog.courses.map((course) => course.code), ["PV101", "RCS", "PV102", "EDM101", "EBIKE101"]);
  assert.equal(catalog.program.weeks * catalog.program.daysPerWeek, 40);
  catalog.courses.forEach((course, index) => {
    assert.equal(course.weeks, 2);
    assert.equal(course.days.length, 8);
    course.days.forEach((lesson, offset) => {
      assert.equal(lesson.courseDay, offset + 1);
      assert.equal(lesson.programDay, index * 8 + offset + 1);
      assert.equal(lesson.id, `${course.code.toLowerCase()}-${String(offset + 1).padStart(2, "0")}`);
      assert.ok(!Object.hasOwn(lesson, "date"), "Historical cohort dates cannot become assigned session dates");
    });
  });
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, 40);
});

test("only the four absent positions are marked missing, without invented teaching content", () => {
  const missing = lessons.filter((lesson) => lesson.status === "missing");
  assert.deepEqual(missing.map((lesson) => lesson.programDay), [36, 37, 39, 40]);
  for (const lesson of missing) {
    assert.equal(lesson.title, "Material not found");
    assert.equal(lesson.lessonUrl, null);
    assert.equal(lesson.referenceDate, null);
    assert.deepEqual(lesson.resources, []);
    assert.equal(newDraft(ctsLessonSeed(lesson)).topic, "");
  }
});

test("changing a class date preserves the source lesson identity across save and reload", () => {
  const lesson = lessons.find((item) => item.courseCode === "PV102" && item.courseDay === 3);
  assert.equal(lesson.programDay, 19);
  const draft = newDraft(ctsLessonSeed(lesson));
  assert.equal(draft.date, "");
  assert.equal(draft.programDay, "19");
  const changed = { ...draft, date: "2027-03-10", className: "Planning example" };
  const restored = readDrafts(JSON.stringify({ version: 1, drafts: saveDraft([], changed) }))[0];
  assert.equal(restored.lessonId, "pv102-03");
  assert.equal(restored.date, "2027-03-10");
  assert.equal(restored.courseDay, "3");
  assert.ok(lessonMarkdown(restored).includes("program day 19"));
});

test("old saved drafts retain every original field without requiring a lesson reference", () => {
  const legacy = Object.fromEntries(DRAFT_FIELDS.map((field) => [field, field === "id" ? "legacy-1" : `original ${field}`]));
  const [restored] = readDrafts(JSON.stringify({ version: 1, drafts: [legacy] }));
  for (const field of DRAFT_FIELDS) assert.equal(restored[field], legacy[field]);
  assert.equal(restored.lessonId, "");
});

test("reopening a source lesson resumes its draft; missing days start the correct blank plan", () => {
  const seed = ctsLessonSeed(lessons[18]);
  const saved = { ...newDraft(seed), className: "Example class", date: "2027-03-10" };
  assert.equal(initialDraft([saved], seed).id, saved.id);
  assert.equal(initialDraft([saved], seed).date, "2027-03-10");
  const missingSeed = ctsLessonSeed(lessons[35]);
  const blank = initialDraft([saved], missingSeed);
  assert.equal(blank.lessonId, "ebike101-04");
  assert.equal(blank.topic, "");
  assert.equal(blank.date, "");
});

test("every material URL points to a real file with the source checksum and file signature", () => {
  const checked = new Set();
  let references = 0;
  for (const lesson of lessons) {
    for (const resource of [...lesson.resources, ...lesson.additionalResources]) {
      references++;
      assert.match(resource.url, /^\/teaching\/cts\/assets\/[a-f0-9]{24}\.(pdf|docx|pptx)$/);
      if (checked.has(resource.url)) continue;
      checked.add(resource.url);
      const data = readFileSync(new URL(`../public${resource.url}`, import.meta.url));
      assert.equal(data.length, resource.bytes);
      assert.equal(createHash("sha256").update(data).digest("hex"), resource.sha256);
      assert.ok(resource.format === "PDF" ? data.subarray(0, 5).toString() === "%PDF-" : data.subarray(0, 2).toString() === "PK");
    }
  }
  assert.ok(references > 100, "Real teaching files should be linked, not only inventory text");
});

test("lesson text payloads match their routes and contain no operator filesystem paths", () => {
  let count = 0;
  for (const lesson of lessons.filter((item) => item.lessonUrl)) {
    assert.equal(lesson.lessonUrl, `/teaching/cts/lessons/${lesson.id}.json`);
    const raw = readFileSync(new URL(`../public${lesson.lessonUrl}`, import.meta.url), "utf8");
    const payload = JSON.parse(raw);
    assert.equal(payload.id, lesson.id);
    assert.ok(payload.markdown.length > 100);
    assert.ok(!/\b[A-Za-z]:[\\/]|\/Users\/|\/home\/|CANONICAL:\/\/|sk-proj-/.test(payload.markdown));
    count++;
  }
  assert.equal(count, 36);
  assert.ok(lessons.some((lesson) => lesson.status === "source_only"));
});

test("teaching downloads use the immutable reviewed GitHub document archive", () => {
  for (const lesson of lessons) for (const file of [...lesson.resources, ...lesson.additionalResources]) {
    const url = new URL(ctsMaterialUrl(file.url));
    assert.equal(url.hostname, "raw.githubusercontent.com");
    assert.ok(url.pathname.includes("/b3027aedaf6f76323f33bba196709955ce6733f7/public/teaching/cts/assets/"));
  }
  assert.throws(() => ctsMaterialUrl("/unexpected/file.pdf"));
});
