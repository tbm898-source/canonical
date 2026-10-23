import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";

export default function Start() {
  return (
    <div className="mx-auto max-w-4xl py-4 sm:py-8">
      <p className="text-sm font-semibold text-indigo-700">Your teaching workspace</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Pick up where your class left off.</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Find your curriculum, plan the next session, and keep a draft you can come back to.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/plan" className="rounded-2xl bg-slate-950 p-6 text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
          <CalendarDays className="h-7 w-7" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-semibold">Plan the next class</h2>
          <p className="mt-2 leading-6 text-slate-300">Choose a date and topic. Note what you finished and what still needs time.</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold">Open lesson planner <ArrowRight className="h-4 w-4" /></span>
        </Link>
        <Link to="/curriculum" className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
          <BookOpen className="h-7 w-7 text-indigo-700" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-semibold text-slate-950">Browse curriculum</h2>
          <p className="mt-2 leading-6 text-slate-600">Design Thinking for a Joyful Life, solar instruction, and construction materials.</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold text-indigo-700">Open curriculum library <ArrowRight className="h-4 w-4" /></span>
        </Link>
      </div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Start with a teaching module</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Design Thinking for a Joyful Life is ready to browse. Open a module and use its questions and activities to start your next plan.</p>
        <Link to="/curriculum" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-700">Explore Design Thinking <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  );
}
