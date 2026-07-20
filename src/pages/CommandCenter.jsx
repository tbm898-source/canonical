import React from "react";
import { ArrowRight, BookOpen, CheckCircle2, Lock } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useNavModel } from "@/hooks/use-nav-model";
import { cohort6CurriculumCards, cohort6CurriculumProgress } from "@/data/commandCenterData";

export default function CommandCenter() {
  const { ownerAccess } = useNavModel();
  if (!ownerAccess.allowed) return <Navigate to="/start" replace />;

  return (
    <div className="mx-auto max-w-4xl py-5 sm:py-9">
      <div className="flex items-center gap-2 text-indigo-600">
        <Lock className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Owner only</p>
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Command Center</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Cohort 6 curriculum readiness, source inventory, and private Dropbox handoffs.
      </p>

      <section className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Curriculum index</p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">
              {cohort6CurriculumProgress.daysComplete}/{cohort6CurriculumProgress.totalDays} days complete
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              {cohort6CurriculumProgress.artifactsIndexed} private artifacts indexed
            </p>
          </div>
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {cohort6CurriculumCards.map((card) => (
          <Link key={card.id} to={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200">
            <div className="flex items-center justify-between gap-3">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{card.status}</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-950">{card.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{card.dateRange}</p>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
              <span>{card.daysComplete}/{card.totalDays} days</span>
              <span>{card.artifactCount} artifacts</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-indigo-700">
              Open curriculum <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
