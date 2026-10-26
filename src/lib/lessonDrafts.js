export const DRAFT_FIELDS = ["id", "className", "program", "topic", "date", "completed", "remaining", "nextStep", "savedAt"];
const LESSON_FIELDS = ["lessonId", "courseCode", "courseDay", "programDay"];

export function readDrafts(raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (parsed.version !== 1 || !Array.isArray(parsed.drafts)) throw new Error("Unrecognized draft format");
  return parsed.drafts.map((draft) => {
    if (!draft || typeof draft !== "object" || !DRAFT_FIELDS.every((field) => typeof draft[field] === "string")) throw new Error("Invalid lesson draft");
    for (const field of LESSON_FIELDS) {
      if (draft[field] != null && typeof draft[field] !== "string") throw new Error("Invalid lesson reference");
    }
    return Object.fromEntries([...DRAFT_FIELDS, ...LESSON_FIELDS].map((field) => [field, draft[field] || ""]));
  });
}

export function newDraft(seed = {}) {
  return {
    id: globalThis.crypto.randomUUID(), className: "", program: seed.program || "", topic: seed.topic || "",
    date: "", completed: "", remaining: "", nextStep: "", savedAt: "",
    ...Object.fromEntries(LESSON_FIELDS.map((field) => [field, seed[field] || ""])),
  };
}

export function initialDraft(drafts, seed = {}) {
  if (seed.lessonId) return drafts.find((draft) => draft.lessonId === seed.lessonId) || newDraft(seed);
  if (seed.topic) return drafts.find((draft) => draft.topic === seed.topic && draft.program === seed.program) || newDraft(seed);
  return drafts[0] || newDraft();
}

export function saveDraft(drafts, draft, timestamp = new Date().toISOString()) {
  const saved = { ...draft, savedAt: timestamp };
  return [saved, ...drafts.filter((item) => item.id !== draft.id)];
}

export function lessonMarkdown(draft) {
  const reference = draft.lessonId ? `\nSource lesson: ${draft.courseCode} course day ${draft.courseDay} / program day ${draft.programDay}\n` : "";
  return `# ${draft.topic || "Lesson plan"}\n\nClass: ${draft.className || "Not chosen"}\nProgram: ${draft.program || "Not chosen"}\nDate: ${draft.date || "Not chosen"}\n${reference}\n## Where we stopped\n${draft.completed || "Not recorded."}\n\n## Work for this session\n${draft.remaining || "Not recorded."}\n\n## First next step\n${draft.nextStep || "Not recorded."}\n\n---\nTeaching preparation draft. Review before use.\n`;
}
