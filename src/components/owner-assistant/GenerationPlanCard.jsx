import React from "react";
import { AlertTriangle, CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import CapabilityBadge from "./CapabilityBadge";

export default function GenerationPlanCard({ state }) {
  if (!state || state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <CardShell>
        <header className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#0a0a0a]/60" />
          <h3 className="text-sm font-semibold tracking-tight">Plan generation</h3>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            validating...
          </span>
        </header>
        <p className="mt-3 text-xs leading-5 text-[#0a0a0a]/60">
          Submitting the request to the owner-only plan validator. No artifact bodies are produced, no
          connectors are called.
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
            Plan validator error
          </h3>
        </header>
        <p className="mt-3 break-words text-xs leading-5 text-rose-700/90">
          {state.error || "The backend rejected the request."}
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
            Plan did not validate
          </h3>
        </header>
        <p className="mt-2 text-xs leading-5 text-amber-900/80">
          The plan validator refused this request. No plan was produced. Fix the issues below and try
          again.
        </p>
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
        ) : (
          <p className="mt-3 text-xs text-amber-900/80">No structured errors were returned.</p>
        )}
      </CardShell>
    );
  }

  if (state.status !== "ready" || !state.plan) return null;

  const plan = state.plan;
  return (
    <CardShell tone="success">
      <header className="flex flex-wrap items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold tracking-tight">Generation plan (dry-run)</h3>
        <CapabilityBadge label={plan.capability_label} />
        <span className="rounded-md border border-black/10 bg-white px-2 py-0.5 font-mono text-[11px] text-[#0a0a0a]/60">
          {plan.generation_plan_id}
        </span>
      </header>
      <p className="mt-2 text-xs leading-5 text-[#0a0a0a]/60">
        The plan validator approved this combination of rail, program, module, profile, and dry-run
        destination. No artifact body was produced. No file was written. No connector was called.
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Field label="Rail" value={plan.rail} />
        <Field label="Rail classification" value={plan.rail_classification} />
        <Field label="Program key" value={plan.program_key} />
        <Field label="Module key" value={plan.module_key} />
        <Field label="Profile" value={plan.profile?.profile_id} />
        <Field label="Output type" value={plan.profile?.output_type} />
        <Field label="Format" value={plan.profile?.format} />
        <Field label="Privacy classification" value={plan.privacy_classification} />
        <Field label="Visibility scope" value={plan.visibility_scope} />
        <Field label="Review status" value={plan.review_status} />
        <Field label="Export readiness" value={plan.export_readiness_status} />
        <Field label="Generated at" value={plan.generated_at} />
      </dl>

      <section className="mt-5 border-t border-black/5 pt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
          Destination
        </h4>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[#0a0a0a]/85">{plan.destination?.id}</span>
          <span className="rounded-md border border-black/10 bg-white px-2 py-0.5 text-[11px] text-[#0a0a0a]/60">
            mode: {plan.destination?.mode}
          </span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
            live_write_enabled: {String(plan.destination?.live_write_enabled)}
          </span>
        </div>
      </section>

      <section className="mt-5 border-t border-black/5 pt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
          Required sections (contract)
        </h4>
        {Array.isArray(plan.profile?.required_sections) && plan.profile.required_sections.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {plan.profile.required_sections.map((section) => (
              <li
                key={section}
                className="rounded-md border border-black/10 bg-white px-2 py-0.5 font-mono text-[11px] text-[#0a0a0a]/70"
              >
                {section}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-[#0a0a0a]/55">
            No required sections were declared for this profile.
          </p>
        )}
      </section>

      <section className="mt-5 border-t border-black/5 pt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
          Source references
        </h4>
        {Array.isArray(plan.source_references) && plan.source_references.length ? (
          <ul className="mt-2 space-y-1">
            {plan.source_references.map((ref, idx) => (
              <li key={idx} className="font-mono text-xs text-[#0a0a0a]/70">
                {ref?.source_record_id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#0a0a0a]/55">
            <ShieldCheck className="h-3.5 w-3.5" />
            No source records selected. The inbox manifest picker is a later milestone.
          </p>
        )}
      </section>

      <section className="mt-5 border-t border-black/5 pt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
          Next actions
        </h4>
        {Array.isArray(plan.next_actions) && plan.next_actions.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {plan.next_actions.map((action) => (
              <li
                key={action}
                className="rounded-md border border-black/10 bg-white px-2 py-0.5 font-mono text-[11px] text-[#0a0a0a]/70"
              >
                {action}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-[#0a0a0a]/55">No next actions declared.</p>
        )}
      </section>
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
