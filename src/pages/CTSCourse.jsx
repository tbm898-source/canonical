import React from "react";
import { Link, useParams } from "react-router-dom";
import { getCourse, lessonPath, LESSON_STATUS_LABELS } from "@/lib/ctsCourses";

export default function CTSCourse() {
  const { courseCode } = useParams();
  const course = getCourse(courseCode);
  if (!course) return <div className="py-8"><h1 className="text-2xl font-bold">Course not found</h1><Link to="/curriculum" className="mt-4 inline-flex min-h-11 items-center text-indigo-700">Back to curriculum</Link></div>;
  return <div className="mx-auto max-w-4xl py-4 sm:py-8">
    <Link to="/curriculum" className="inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700">← Curriculum library</Link>
    <p className="mt-4 text-sm font-semibold text-indigo-700">{course.code} · 2 weeks · 8 course days</p>
    <h1 className="mt-2 text-3xl font-bold text-slate-950">{course.title}</h1>
    <p className="mt-3 leading-7 text-slate-600">Program days {course.days[0].programDay}–{course.days[7].programDay}. These lessons come from Cohort 6; you choose a new session date when planning your class.</p>
    <ol className="mt-6 space-y-3">
      {course.days.map((lesson) => <li key={lesson.id}>
        <Link to={lessonPath(lesson)} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-500">
          <div className="min-w-0"><p className="text-sm font-semibold text-indigo-700">Course day {lesson.courseDay} · Program day {lesson.programDay}</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{lesson.title}</h2></div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lesson.status === "missing" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-700"}`}>{LESSON_STATUS_LABELS[lesson.status]}</span>
        </Link>
      </li>)}
    </ol>
  </div>;
}
