import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, FileCode2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CapabilityBadge from "./CapabilityBadge";

export default function GenerationArtifactCard({
  state,
  onApprove,
  onReject,
  reviewLoading = false,
}) {
  if (!state || state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <CardShell>
        <header className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-[#0a0a0a]/60" />
          <h3 className="text-sm font-semibold tracking-tight">Artifact generation</h3>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            generating...
          </span>
        </header>
        <p className="mt-3 text-xs leading-5 text-[#0a0a0a]/60">
          Building a deterministic template artifact from the approved plan. No LLM, no file write,
          no connector call.
        </p>
      </CardShell>
    );
  }

  if (state.status === "error") {
    return (
      <CardShell tone="error">
        <header className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <h3 className="text-sm font-semibold tracking-tight text-rose-700">
            Artifact generation error
          </h3>
        </header>
        <p className="mt-3 break-words text-xs leading-5 text-rose-700/90">
          {state.error || "The backend rejected the generation request."}
        </p>
      </CardShell>
    );
  }

  if (state.status === "invalid") {
    const errors = Array.isArray(state.validation_errors) ? state.validation_errors : [];
    return (
      <CardShell tone="warning">
        <header className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <h3 className="text-sm font-semibold tracking-tight text-amber-800">
            Artifact did not validate
          </h3>
        </header>
        {errors.length ? (
          <ul className="mt-3 space-y-1.5">
            {errors.map((err, idx) => (
              <li
                key={idx}
                className="rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-xs text-amber-900"
              >
                <div className="font-mono text-[11px] text-amber-700">
                  {err?.field || "(field?)"} - {err?.code || "(code?)"}
                </div>
                <div className="mt-0.5">{err?.message || "No message provided."}</div>
              </li>
            ))}
          </ul>
        ) : null}
      </CardShell>
    );
  }

  if (state.status !== "ready" || !state.artifact) return null;

  const artifact = state.artifact;
  const sectionKeys = Object.keys(artifact.sections || {});
  const isDraft = artifact.review_status === "draft";
  const isApproved = artifact.review_status === "approved";
  const isRejected = artifact.review_status === "rejected";

  return (
    <CardShell tone={isRejected ? "warning" : isApproved ? "success" : "success"}>
      <header className="flex flex-wrap items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold tracking-tight">Generated artifact (dry-run)</h3>
        <CapabilityBadge label={artifact.capability_label} />
        <span className="rounded-md border border-black/10 bg-white px-2 py-0.5 font-mono text-[11px] text-[#0a0a0a]/60">
          {artifact.generation_artifact_id}
        </span>
      </header>
      <p className="mt-2 text-xs leading-5 text-[#0a0a0a]/60">
        Deterministic template body for{" "}
        <span className="font-mono">{artifact.profile?.output_type}</span>. Linked to plan{" "}
        <span className="font-mono">{artifact.generation_plan_id}</span>. No file was written. No
        connector was called.
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Field label="Output type" value={artifact.profile?.output_type} />
        <Field label="Format" value={artifact.profile?.format} />
        <Field label="Review status" value={artifact.review_status} />
        <Field label="Export readiness" value={artifact.export_readiness_status} />
        {artifact.reviewed_at ? <Field label="Reviewed at" value={artifact.reviewed_at} /> : null}
      </dl>

      {isDraft ? (
        <section className="mt-5 border-t border-black/5 pt-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
            Owner review
          </h4>
          <p className="mt-2 text-xs leading-5 text-[#0a0a0a]/60">
            Approve to mark this artifact ready for dry-run export preview (Milestone 7). Reject to
            send it back for revision. No file write occurs on either action.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={reviewLoading}
              onClick={onApprove}
              className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {reviewLoading ? "Reviewing..." : "Approve artifact"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={reviewLoading}
              onClick={onReject}
              className="gap-1.5 disabled:opacity-60"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject artifact
            </Button>
            <CapabilityBadge label="Owner available" />
          </div>
        </section>
      ) : null}

      {isApproved ? (
        <section className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs leading-5 text-emerald-800">
            Approved. Export readiness is <span className="font-mono">ready_dry_run</span>. Connector
            export preview is not implemented yet (Milestone 7).
          </p>
        </section>
      ) : null}

      {isRejected ? (
        <section className="mt-5 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
          <p className="text-xs leading-5 text-amber-900">
            Rejected. Regenerate from an updated plan or revise source records, then submit a new
            artifact for review.
          </p>
        </section>
      ) : null}

      {artifact.contract_validation ? (
        <section className="mt-5 border-t border-black/5 pt-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
            Contract validation
          </h4>
          <p className="mt-2 text-xs text-[#0a0a0a]/60">
            {artifact.contract_validation.missing_sections?.length
              ? `Missing sections: ${artifact.contract_validation.missing_sections.join(", ")}`
              : `All ${artifact.contract_validation.required_sections_present?.length || 0} required sections present.`}
          </p>
        </section>
      ) : null}

      {artifact.body_json ? (
        <CollapsibleBlock title="JSON body (Classroom export draft)" defaultOpen={false}>
          <pre className="max-h-64 overflow-auto rounded-lg border border-black/10 bg-white p-3 text-[11px] leading-5 text-[#0a0a0a]/80">
            {JSON.stringify(artifact.body_json, null, 2)}
          </pre>
        </CollapsibleBlock>
      ) : null}

      {artifact.body_markdown ? (
        <CollapsibleBlock title="Markdown body" defaultOpen>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-3 text-xs leading-5 text-[#0a0a0a]/80">
            {artifact.body_markdown}
          </pre>
        </CollapsibleBlock>
      ) : null}

      {sectionKeys.length ? (
        <CollapsibleBlock title={`Sections (${sectionKeys.length})`} defaultOpen={false}>
          <div className="space-y-3">
            {sectionKeys.map((key) => (
              <div key={key} className="rounded-lg border border-black/10 bg-white p-3">
                <div className="font-mono text-[11px] font-semibold text-[#0a0a0a]/70">{key}</div>
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#0a0a0a]/75">
                  {artifact.sections[key]}
                </pre>
              </div>
            ))}
          </div>
        </CollapsibleBlock>
      ) : null}
    </CardShell>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[#0a0a0a]/45">{label}</dt>
      <dd className="mt-0.5 break-words font-mono text-sm text-[#0a0a0a]/85">
        {value === null || value === undefined || value === "" ? "-" : String(value)}
      </dd>
    </div>
  );
}

function CollapsibleBlock({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mt-5 border-t border-black/5 pt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
          {title}
        </h4>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[#0a0a0a]/40" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#0a0a0a]/40" />
        )}
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function CardShell({ tone = null, children }) {
  const toneClass =
    tone === "error"
      ? "border-rose-200 bg-rose-50/40"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50/40"
        : tone === "success"
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-black/5 bg-white/70";
  return (
    <div className={`mt-4 rounded-2xl border p-5 shadow-sm ${toneClass}`}>{children}</div>
  );
}
