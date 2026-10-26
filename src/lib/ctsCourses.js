import catalog from "@content/teaching/cts/catalog.json";
export { ctsLessonSeed } from "./ctsSequence";

export const ctsCatalog = catalog;
export const ctsLessons = catalog.courses.flatMap((course) => course.days);

export function getCourse(code = "") {
  return catalog.courses.find((course) => course.code === code.toUpperCase()) || null;
}

export function getLesson(code, day) {
  const course = getCourse(code);
  return course?.days.find((lesson) => lesson.courseDay === Number(day)) || null;
}

export function lessonPath(lesson) {
  return `/courses/${lesson.courseCode}/lessons/${lesson.courseDay}`;
}

export const LESSON_STATUS_LABELS = {
  materials_available: "Materials available",
  source_only: "Source notes available",
  inventory_only: "Files need review",
  missing: "Material not found",
};
