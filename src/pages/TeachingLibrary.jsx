import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/AuthContext";
import { getOwnerAccessState } from "@/lib/ownerAccessPolicy";

export default function TeachingLibrary() {
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  const { liveOwnerAccess } = getOwnerAccessState({ user, isAuthenticated, allowLocalPreview: false });
  const viewerId = user?.id || user?.email || "";
  const [load, setLoad] = useState({ status: "idle", modules: [], message: "", viewerId: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!liveOwnerAccess) return;
    let cancelled = false;
    setLoad({ status: "loading", modules: [], message: "", viewerId });
    (async () => {
      try {
        const { base44 } = await import("@/api/base44Client");
        const response = await base44.functions.invoke("getCanonicalProgramFull", { program_key: "PRISM_DTJL" });
        const data = response?.data ?? response;
        if (!data?.success || !data?.program) throw new Error("The curriculum could not be loaded. Your account or the website connection may need attention.");
        const modules = (data.modules || []).filter((module) => module.sequence_order > 0).sort((a, b) => a.sequence_order - b.sequence_order);
        if (!modules.length) throw new Error("The program exists, but no modules were returned. Try again or check the website connection.");
        if (!cancelled) setLoad({ status: "ready", modules, message: "", viewerId });
      } catch (error) {
        if (!cancelled) setLoad({ status: "error", modules: [], message: error.message, viewerId });
      }
    })();
    return () => { cancelled = true; };
  }, [liveOwnerAccess, attempt, viewerId]);

  const modules = liveOwnerAccess && load.viewerId === viewerId && load.status === "ready" ? load.modules : [];
  return (
    <div className="mx-auto max-w-4xl py-4 sm:py-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">Curriculum library</h1>
      <p className="mt-3 leading-7 text-slate-600">Choose a program. Read what is available, then use it to prepare your next session.</p>
      <section className="mt-8 rounded-2xl border border-indigo-200 bg-white p-5 sm:p-7" aria-labelledby="design-thinking-title">
        <p className="text-sm font-semibold text-indigo-700">Life design</p>
        <h2 id="design-thinking-title" className="mt-2 text-2xl font-bold text-slate-950">Design Thinking for a Joyful Life</h2>
        <p className="mt-3 leading-7 text-slate-600">A curriculum framework for exploring possible futures, trying small experiments, and building confidence through action.</p>
        {!liveOwnerAccess && (
          <div className="mt-5 rounded-xl bg-indigo-50 p-4">
            <p className="text-sm leading-6 text-slate-700">This program is included. Its teaching modules currently require the curriculum owner's account.</p>
            {!isAuthenticated ? <button onClick={navigateToLogin} className="mt-3 min-h-11 rounded-xl bg-indigo-700 px-5 font-semibold text-white">Sign in to open modules</button> : <p className="mt-2 text-sm leading-6 text-slate-700">Your account is signed in but does not have that access. This is an account restriction, not missing curriculum.</p>}
          </div>
        )}
        {liveOwnerAccess && <div aria-live="polite">
          {load.status === "loading" && <p className="mt-5 text-slate-600" role="status">Loading teaching modules…</p>}
          {load.status === "error" && <div className="mt-5 rounded-xl bg-amber-50 p-4"><p role="alert" className="text-sm leading-6 text-amber-950">{load.message}</p><button onClick={() => setAttempt((value) => value + 1)} className="mt-2 min-h-11 font-semibold text-indigo-700">Try again</button></div>}
        </div>}
        <div className="mt-5 space-y-3">
          {modules.map((module) => <details key={module.module_key} className="rounded-xl border border-slate-200">
            <summary className="cursor-pointer p-4 font-semibold text-slate-950">{module.sequence_order}. {module.title}</summary>
            <div className="border-t border-slate-100 p-4">
              {module.teaching_outline ? <div className="teaching-markdown text-sm leading-7 text-slate-700"><ReactMarkdown>{module.teaching_outline}</ReactMarkdown></div> : <p className="text-sm leading-6 text-slate-600">The module is indexed. Its teaching outline has not yet reached this website version.</p>}
              <Link to="/plan" state={{ topic: module.title, program: "Design Thinking for a Joyful Life" }} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white">Plan a session with this module</Link>
            </div>
          </details>)}
        </div>
      </section>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-950">Solar & construction</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Browse the existing PV101 and RCS daily indexes, including objectives, activities, and links to teaching folders.</p>
          {liveOwnerAccess ? <Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-indigo-700" to="/Curriculum/Cohort6">Open daily materials</Link> : <p className="mt-3 text-sm text-slate-600">Daily indexes currently use the curriculum owner's account.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold text-slate-950">Sample solar lesson</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Explore a PV102 sample and turn rough notes into a packet outline. This example is separate from your lesson plans.</p>
          <Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-indigo-700" to="/ProgramHelper?mode=demo">Open sample lesson</Link>
        </section>
      </div>
    </div>
  );
}
