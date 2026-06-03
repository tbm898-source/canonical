import React from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import PublicPageShell from "@/components/public/PublicPageShell";
import docsIndex from "@content/docs/index.json";
import canonicalModel from "@content/docs/canonical-model.md?raw";
import connectorSpine from "@content/docs/connector-spine.md?raw";
import instructionalDataModel from "@content/docs/instructional-data-model.md?raw";
import base44SyncNotes from "@content/docs/base44-sync-notes.md?raw";

const docBodies = {
  "canonical-model": canonicalModel,
  "connector-spine": connectorSpine,
  "instructional-data-model": instructionalDataModel,
  "base44-sync-notes": base44SyncNotes,
};

function MarkdownArticle({ body }) {
  return (
    <article className="prose prose-slate max-w-none rounded-3xl border border-black/5 bg-white p-8 shadow-sm prose-headings:tracking-tight prose-p:text-[#0a0a0a]/65 prose-li:text-[#0a0a0a]/65">
      <ReactMarkdown>{body}</ReactMarkdown>
    </article>
  );
}

export default function Docs() {
  const { docId } = useParams();
  const selectedDoc = docId ? docsIndex.docs.find((doc) => doc.doc_id === docId) : null;
  const selectedBody = selectedDoc ? docBodies[selectedDoc.doc_id] : null;

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Docs
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-[#0a0a0a] sm:text-6xl">
            Public architecture notes for the CANONICAL spine.
          </h1>
          <p className="mt-6 text-base leading-7 text-[#0a0a0a]/60">
            These docs expose the safe structure of the system: model, connector posture, instructional records, and Base44 sync state. Private source internals stay out of public routes.
          </p>
        </header>

        {!selectedDoc ? (
          <section className="mt-12 grid gap-3 md:grid-cols-2">
            {docsIndex.docs.map((doc) => (
              <Link
                key={doc.doc_id}
                to={`/Docs/${doc.doc_id}`}
                className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <BookOpen className="mb-5 h-8 w-8 text-indigo-600" />
                <h2 className="text-lg font-semibold text-[#0a0a0a]">{doc.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">{doc.summary}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
                  Open doc
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="mt-12 grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <aside className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#0a0a0a]/45">
                Doc Index
              </h2>
              <div className="grid gap-2">
                {docsIndex.docs.map((doc) => (
                  <Link
                    key={doc.doc_id}
                    to={`/Docs/${doc.doc_id}`}
                    className={`rounded-2xl px-4 py-3 text-sm transition ${
                      doc.doc_id === selectedDoc.doc_id
                        ? "bg-indigo-50 font-semibold text-indigo-700"
                        : "text-[#0a0a0a]/60 hover:bg-[#fafafa]"
                    }`}
                  >
                    {doc.title}
                  </Link>
                ))}
              </div>
            </aside>
            {selectedBody ? (
              <MarkdownArticle body={selectedBody} />
            ) : (
              <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Doc not found</h2>
                <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/60">
                  This doc is registered but does not have a public body yet.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </PublicPageShell>
  );
}