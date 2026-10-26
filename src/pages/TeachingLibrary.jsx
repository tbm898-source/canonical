import React from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import curriculum from "@content/teaching/design-thinking.json";
import CTSCourseList from "@/components/teaching/CTSCourseList";

export default function TeachingLibrary() {
  return (
    <div className="mx-auto max-w-4xl py-4 sm:py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">Curriculum library</h1>
      <p className="mt-3 leading-7 text-slate-600">Open a module, explore its activities, and plan your next class.</p>
      <CTSCourseList />
      <section className="mt-8 rounded-2xl border border-indigo-200 bg-white p-5 sm:p-7" aria-labelledby="design-thinking-title">
        <p className="text-sm font-semibold text-indigo-700">Life design · 6 teaching modules</p>
        <h2 id="design-thinking-title" className="mt-2 text-2xl font-bold text-slate-950">{curriculum.title}</h2>
        <p className="mt-3 leading-7 text-slate-600">Explore possible futures, try small experiments, and build confidence through action. Each module includes its central question, concepts, and activities to develop into a lesson.</p>
        <div className="mt-5 space-y-3">
          {curriculum.modules.map((module) => <details key={module.sequence} className="rounded-xl border border-slate-200">
            <summary className="cursor-pointer p-4 font-semibold text-slate-950">{module.sequence}. {module.title}</summary>
            <div className="border-t border-slate-100 p-4">
              <div className="teaching-markdown text-sm leading-7 text-slate-700"><ReactMarkdown>{module.outline}</ReactMarkdown></div>
              <Link to="/plan" state={{ topic: module.title, program: curriculum.title }} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white">Plan a session with this module</Link>
            </div>
          </details>)}
        </div>
      </section>
    </div>
  );
}
