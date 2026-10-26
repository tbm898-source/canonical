import React from "react";
import { Link } from "react-router-dom";
import { ctsCatalog } from "@/lib/ctsCourses";

export default function CTSCourseList() {
  const found = ctsCatalog.courses.flatMap((course) => course.days).filter((day) => day.status !== "missing").length;
  return <section className="mt-8" aria-labelledby="cts-course-heading">
    <h2 id="cts-course-heading" className="text-2xl font-bold text-slate-950">CTS courses</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">10 weeks · 4 days a week · 40 program days. Each course lasts 2 weeks. Material was found for {found} of 40 days; calendar dates are chosen when you plan a class.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {ctsCatalog.courses.map((course) => {
        const present = course.days.filter((day) => day.status !== "missing").length;
        return <Link key={course.code} to={`/courses/${course.code}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
          <span className="text-sm font-semibold text-indigo-700">{course.code} · Program days {course.days[0].programDay}–{course.days[7].programDay}</span>
          <h3 className="mt-2 text-lg font-bold text-slate-950">{course.title}</h3>
          <p className="mt-3 text-sm text-slate-600">8 course days · {present}/8 days with material</p>
          <span className="mt-4 inline-block font-semibold text-indigo-700">Browse lessons →</span>
        </Link>;
      })}
    </div>
  </section>;
}
