import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/AuthContext";
import { lessonMarkdown, newDraft, readDrafts, saveDraft } from "@/lib/lessonDrafts";

const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-950 focus:border-indigo-600 focus:outline focus:outline-2 focus:outline-indigo-200";

export default function LessonPlanner() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const account = isAuthenticated ? user?.id || user?.email : "preview";
  if (isAuthenticated && !account) return <p role="status">Loading your workspace…</p>;
  return <Planner key={`${account}:${location.key}`} storageKey={`canonical.lesson-drafts.v1:${account}`} seed={location.state || {}} />;
}

function Planner({ storageKey, seed }) {
  const [initial] = useState(() => {
    try { return { drafts: readDrafts(localStorage.getItem(storageKey)), error: "" }; }
    catch { return { drafts: [], error: "Saved drafts could not be read. Your existing browser data has been left untouched. You can still write and download a plan." }; }
  });
  const [drafts, setDrafts] = useState(initial.drafts);
  const [draft, setDraft] = useState(() => seed.topic ? newDraft(seed) : initial.drafts[0] || newDraft());
  const [message, setMessage] = useState(initial.error);
  const [dirty, setDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveError, setSaveError] = useState(Boolean(initial.error));

  useEffect(() => {
    const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(field, value) {
    const next = saveDraft(drafts, { ...draft, [field]: value });
    setDraft(next[0]);
    const saved = persist(next);
    setDirty(!saved);
    setShowPreview(false);
    if (saved) setMessage("");
  }

  function persist(nextDrafts) {
    if (initial.error) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, drafts: nextDrafts }));
      setDrafts(nextDrafts);
      setSaveError(false);
      return true;
    } catch {
      setSaveError(true);
      setMessage("This browser could not save your draft. Download a copy before leaving this page.");
      return false;
    }
  }

  function save() {
    if (!draft.className.trim() || !draft.topic.trim() || !draft.date) {
      setMessage("Add a class name, topic, and session date before saving.");
      return false;
    }
    const next = saveDraft(drafts, draft);
    if (!persist(next)) return false;
    setDraft(next[0]);
    setDirty(false);
    setMessage("Saved in this browser. You can return to this draft from the list below.");
    return true;
  }

  function select(next) {
    if (dirty && !save()) return;
    setDraft(next);
    setDirty(false);
    setShowPreview(false);
    setMessage("");
  }

  function download() {
    const url = URL.createObjectURL(new Blob([lessonMarkdown(draft)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `lesson-${draft.date || "draft"}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="lesson-planner mx-auto max-w-4xl py-4 sm:py-8">
      <div className="lesson-controls">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Plan the next class</h1>
        <p className="mt-3 leading-7 text-slate-600">Start from where the class stopped. Keep the useful pieces, choose the next date, and write a plan you can teach from.</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">Drafts save automatically on this browser only. Download a copy to keep elsewhere. Use lesson and activity notes; keep student names and records out.</p>
        <form onSubmit={(event) => { event.preventDefault(); save(); }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">Class name <span className="font-normal text-slate-500">(required)</span><input required maxLength={160} className={fieldClass} value={draft.className} onChange={(event) => update("className", event.target.value)} placeholder="e.g. Tuesday life design" /></label>
            <label className="text-sm font-semibold text-slate-800">Next session date <span className="font-normal text-slate-500">(required)</span><input required type="date" className={fieldClass} value={draft.date} onInput={(event) => update("date", event.currentTarget.value)} /></label>
            <label className="text-sm font-semibold text-slate-800">Program<input maxLength={200} className={fieldClass} value={draft.program} onChange={(event) => update("program", event.target.value)} placeholder="e.g. Design Thinking for a Joyful Life" /></label>
            <label className="text-sm font-semibold text-slate-800">Topic <span className="font-normal text-slate-500">(required)</span><input required maxLength={240} className={fieldClass} value={draft.topic} onChange={(event) => update("topic", event.target.value)} placeholder="What are you working on?" /></label>
          </div>
          <Link to="/curriculum" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-700">Browse curriculum for ideas</Link>
          <div className="mt-4 space-y-5">
            <label className="block text-sm font-semibold text-slate-800">Where did the class stop?<textarea rows={3} maxLength={12000} className={fieldClass} value={draft.completed} onChange={(event) => update("completed", event.target.value)} placeholder="Topics covered, activities finished, and where you paused." /></label>
            <label className="block text-sm font-semibold text-slate-800">What needs time next session?<textarea rows={4} maxLength={12000} className={fieldClass} value={draft.remaining} onChange={(event) => update("remaining", event.target.value)} placeholder="Unfinished work, a new activity, discussion questions, or materials to prepare." /></label>
            <label className="block text-sm font-semibold text-slate-800">What should happen first?<textarea rows={2} maxLength={12000} className={fieldClass} value={draft.nextStep} onChange={(event) => update("nextStep", event.target.value)} placeholder="One clear opening task for the next class." /></label>
          </div>
          <p className="mt-4 text-sm text-slate-600" aria-live="polite">{dirty ? "Unsaved changes" : draft.savedAt ? "Draft saved in this browser" : "New draft"}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={Boolean(initial.error)} className="min-h-11 rounded-xl bg-indigo-700 px-5 font-semibold text-white disabled:opacity-50">Save draft</button>
            <button type="button" onClick={() => setShowPreview(true)} className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold">Preview plan</button>
            <button type="button" onClick={download} className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold">Download plan</button>
          </div>
          {message && <p role={saveError ? "alert" : "status"} className="mt-4 text-sm leading-6 text-slate-700">{message}</p>}
        </form>
      </div>
      {showPreview && <section className="lesson-print mt-6 rounded-2xl border border-slate-200 bg-white p-6" aria-label="Lesson preview">
        <div className="lesson-controls mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Lesson preview</h2><button onClick={() => window.print()} className="min-h-11 rounded-xl bg-slate-950 px-5 font-semibold text-white">Print plan</button></div>
        <div className="teaching-markdown break-words text-base leading-7 text-slate-800"><ReactMarkdown>{lessonMarkdown(draft)}</ReactMarkdown></div>
      </section>}
      <section className="lesson-controls mt-8" aria-labelledby="saved-drafts-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="saved-drafts-title" className="text-xl font-bold text-slate-950">Saved lesson drafts</h2><button onClick={() => select(newDraft())} className="min-h-11 font-semibold text-indigo-700">Start another lesson</button></div>
        {!drafts.length && <p className="mt-3 text-sm text-slate-600">Your saved lessons will appear here, grouped by the class name and date you choose.</p>}
        <ul className="mt-3 space-y-2">{drafts.map((item) => <li key={item.id}><button onClick={() => select(item)} aria-current={item.id === draft.id ? "true" : undefined} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-400"><span className="block font-semibold text-slate-950">{item.className || "New class"} · {item.date || "Date not chosen"}</span><span className="mt-1 block text-sm text-slate-600">{item.topic || "Untitled lesson"}</span></button></li>)}</ul>
      </section>
    </div>
  );
}
