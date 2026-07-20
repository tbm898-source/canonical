import React, { useMemo, useState } from "react";
import { CalendarDays, ExternalLink, FolderLock, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useNavModel } from "@/hooks/use-nav-model";
import pv101 from "@/content/curriculum/pv101-cohort-6-days-1-8.json";
import rcsDay1 from "@/content/curriculum/rcs-cohort-6-day-1.json";
import rcsDays2To8 from "@/content/curriculum/rcs-cohort-6-days-2-8.json";

const courses = {
  PV101: { ...pv101, days: pv101.days },
  RCS: { ...rcsDay1, days: [...rcsDay1.days, ...rcsDays2To8.days] },
};

function ListSection({ title, items }) {
  return (
    <section>
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
        {items.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}
      </ul>
    </section>
  );
}

function DayCard({ day }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              CTS Day {day.ctsDay} · {day.course} Day {day.courseDay}
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-950">{day.title}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4" /> {day.date}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {day.artifactCount} files
          </span>
        </div>
      </summary>
      <div className="border-t border-slate-100 p-5">
        <div className="grid gap-6 md:grid-cols-2">
          <ListSection title="Objectives" items={day.objectives} />
          <ListSection title="Agenda" items={day.agenda} />
          <ListSection title="Hands-on work" items={day.handsOn} />
          <ListSection title="Safety controls" items={day.safetyControls} />
          <ListSection title="Evidence" items={day.evidence} />
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Resource groups</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {day.resourceGroups.map((group) => (
                <span key={group.name} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-800">
                  {group.name} · {group.count}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Canonical Dropbox path</p>
          <code className="mt-2 block break-all text-xs text-slate-700">{day.canonicalDropboxPath}</code>
          <a href={day.dropboxUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
            Open private daily folder <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <details className="mt-4 rounded-xl border border-slate-200">
          <summary className="cursor-pointer p-4 text-sm font-semibold text-slate-800">
            Artifact inventory ({day.artifactCount})
          </summary>
          <ul className="max-h-80 overflow-auto border-t border-slate-100 p-4 text-xs text-slate-600">
            {day.artifactInventory.map((artifact) => (
              <li key={artifact.relativePath} className="border-b border-slate-100 py-2 last:border-0">
                <span className="font-medium text-slate-800">{artifact.name}</span>
                <span className="ml-2 text-slate-400">[{artifact.resourceGroup}]</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </details>
  );
}

export default function Cohort6Curriculum() {
  const { ownerAccess } = useNavModel();
  const location = useLocation();
  const navigate = useNavigate();
  const initialCourse = useMemo(() => location.pathname.includes("/RCS/") ? "RCS" : "PV101", [location.pathname]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);

  if (!ownerAccess.allowed) return <Navigate to="/start" replace />;
  const curriculum = courses[selectedCourse];
  const switchCourse = (course) => {
    setSelectedCourse(course);
    navigate(`/Curriculum/${course}/Cohort6`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl py-5 sm:py-9">
      <div className="flex items-center gap-2 text-indigo-600">
        <FolderLock className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">Owner-only curriculum</p>
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">CTS Cohort 6</h1>
          <p className="mt-2 text-sm text-slate-600">Complete PV101 and RCS daily curriculum index · 16 days · 365 private artifacts</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1" aria-label="Course">
          {Object.keys(courses).map((course) => (
            <button key={course} type="button" onClick={() => switchCourse(course)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${selectedCourse === course ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
              {course}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Metadata only. Teaching-file bodies remain in the private Canonical Dropbox and are not bundled with the application.</p>
      </div>

      <div className="mt-6 grid gap-4">
        {curriculum.days.map((day) => <DayCard key={day.folder} day={day} />)}
      </div>
    </div>
  );
}
