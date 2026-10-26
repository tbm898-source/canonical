import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ctsMaterialUrl } from "@/lib/ctsAssets";
import { ctsLessons, getCourse, getLesson, lessonPath, ctsLessonSeed, LESSON_STATUS_LABELS } from "@/lib/ctsCourses";

export default function CTSLesson() {
  const { courseCode, courseDay } = useParams();
  const lesson = getLesson(courseCode, courseDay);
  return lesson ? <Lesson key={lesson.id} lesson={lesson} /> : <div className="py-8"><h1 className="text-2xl font-bold">Lesson not found</h1><Link to="/curriculum" className="mt-4 inline-flex min-h-11 items-center text-indigo-700">Back to curriculum</Link></div>;
}

function Lesson({ lesson }) {
  const course = getCourse(lesson.courseCode);
  const alternatives = lesson.additionalResources || [];
  const [notes, setNotes] = useState({ status: lesson.lessonUrl ? "loading" : "empty", markdown: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!lesson.lessonUrl) return;
    const abort = new AbortController();
    setNotes({ status: "loading", markdown: "" });
    fetch(lesson.lessonUrl, { signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Lesson notes could not be loaded");
      const data = await response.json();
      if (data.id !== lesson.id || typeof data.markdown !== "string") throw new Error("Unexpected lesson response");
      if (!abort.signal.aborted) setNotes({ status: "ready", markdown: data.markdown });
    }).catch(() => { if (!abort.signal.aborted) setNotes({ status: "error", markdown: "" }); });
    return () => abort.abort();
  }, [lesson.id, lesson.lessonUrl, attempt]);

  const groups = Object.values(lesson.resources.reduce((result, resource) => {
    result[resource.kind] ||= { kind: resource.kind, label: resource.label, files: [] };
    result[resource.kind].files.push(resource);
    return result;
  }, {}));
  const materialOrder = ["run_sheet", "student_packet", "instructor_packet", "slides", "lab", "worksheet", "student_guide", "quiz", "answers", "whiteboard", "exit_ticket", "verification"];
  groups.sort((a, b) => materialOrder.indexOf(a.kind) - materialOrder.indexOf(b.kind));
  groups.forEach((group) => group.files.sort((a, b) => ["PDF", "DOCX", "PPTX"].indexOf(a.format) - ["PDF", "DOCX", "PPTX"].indexOf(b.format)));
  const position = ctsLessons.findIndex((item) => item.id === lesson.id);
  const previous = ctsLessons[position - 1];
  const next = ctsLessons[position + 1];

  return <div className="mx-auto max-w-4xl py-4 sm:py-8">
    <Link to={`/courses/${course.code}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700">← {course.code} lessons</Link>
    <p className="mt-4 text-sm font-semibold text-indigo-700">{course.code} · Course day {lesson.courseDay} of 8 · Program day {lesson.programDay} of 40</p>
    <h1 className="mt-2 text-3xl font-bold text-slate-950">{lesson.title}</h1>
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600"><span>{LESSON_STATUS_LABELS[lesson.status]}</span>{lesson.referenceDate && <span>Cohort 6 reference date: {lesson.referenceDate}</span>}</div>
    {lesson.sourceNote && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950">{lesson.sourceNote}</p>}
    <Link to="/plan" state={ctsLessonSeed(lesson)} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-indigo-700 px-5 font-semibold text-white">{lesson.status === "missing" ? "Start a blank plan for this day" : "Plan this lesson"}</Link>
    <p className="mt-2 text-sm text-slate-600">Choose your session date in the planner. Moving the date will not change this lesson's course or program day.</p>
    {lesson.status === "missing" ? <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-xl font-bold text-slate-950">This day still needs material</h2><p className="mt-2 leading-7 text-slate-700">No daily folder was found for this position in the supplied cohort material. The place in the eight-day course is reserved; no lesson has been invented to fill it.</p></section> : <>
      <section className="mt-7" aria-labelledby="materials-heading"><h2 id="materials-heading" className="text-xl font-bold text-slate-950">Teaching materials</h2>
        {!groups.length && <p className="mt-3 leading-7 text-slate-600">Source notes are available below. Separate printable packets and slides were not found for this lesson.</p>}
        <ul className="mt-4 space-y-3">{groups.map((group) => <li key={group.label} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-semibold text-slate-950">{group.label}</h3><div className="flex flex-wrap gap-2">{group.files.map((file) => <a key={file.url} href={ctsMaterialUrl(file.url)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-indigo-700" aria-label={`Open ${group.label} ${file.format}`}>Open {file.format}</a>)}</div></li>)}</ul>
        {groups.length > 0 && <p className="mt-3 text-sm leading-6 text-slate-600">These are the original teaching files from Cohort 6. Files open or download from our teaching archive. Save PDFs to print; Word and PowerPoint files are editable downloads.</p>}
        {alternatives.length > 0 && <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold text-slate-950">Other teaching versions ({alternatives.length})</summary><p className="mt-2 text-sm leading-6 text-slate-600">Distinct versions found in the same daily folder. Compare before choosing; exact duplicate files are omitted.</p><ul className="mt-3 space-y-3">{alternatives.map((file) => <li key={file.url}><a href={ctsMaterialUrl(file.url)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center break-words text-sm font-semibold text-indigo-700">{file.label} · {file.format}</a></li>)}</ul></details>}
      </section>
      <details open={lesson.status === "source_only"} className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-xl font-bold text-slate-950">Lesson notes</summary><p className="mt-2 text-sm leading-6 text-slate-600">Prior-cohort reference. Dates, equipment and assumptions in the original notes should be reviewed for your next class.</p>
        {notes.status === "loading" && <p role="status" className="mt-4">Loading lesson notes…</p>}
        {notes.status === "error" && <div className="mt-4"><p role="alert">The notes could not be loaded. The file links above are still available.</p><button onClick={() => setAttempt((value) => value + 1)} className="mt-2 min-h-11 font-semibold text-indigo-700">Try loading notes again</button></div>}
        {notes.status === "empty" && <p className="mt-4 text-slate-600">No separate text notes were found. Use the teaching files above.</p>}
        {notes.status === "ready" && <div className="teaching-markdown mt-5 overflow-x-auto text-sm leading-7 text-slate-700"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h1: ({ children }) => <h3>{children}</h3>, h2: ({ children }) => <h3>{children}</h3>, h3: ({ children }) => <h4 className="mt-4 font-semibold">{children}</h4> }}>{notes.markdown}</ReactMarkdown></div>}
      </details>
    </>}
    <nav aria-label="Lesson sequence" className="mt-7 flex flex-wrap justify-between gap-4">{previous && <Link to={lessonPath(previous)} className="min-h-11 font-semibold text-indigo-700">← Program day {previous.programDay}</Link>}{next && <Link to={lessonPath(next)} className="ml-auto min-h-11 font-semibold text-indigo-700">Program day {next.programDay} →</Link>}</nav>
  </div>;
}
