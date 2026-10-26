export function ctsLessonSeed(lesson) {
  return {
    topic: lesson.status === "missing" ? "" : lesson.title,
    program: `CTS · ${lesson.courseCode}`,
    lessonId: lesson.id,
    courseCode: lesson.courseCode,
    courseDay: String(lesson.courseDay),
    programDay: String(lesson.programDay),
  };
}
