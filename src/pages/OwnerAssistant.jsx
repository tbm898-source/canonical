import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Database,
  FileText,
  Layers,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { getOwnerAccessState } from "@/lib/ownerAccessPolicy";
import {
  GENERATION_PROFILES,
  M1_OUTPUT_DESTINATIONS,
  profileSupportsRail,
  profileSupportsVisibility,
} from "@/lib/generationProfiles";
import OwnerAssistantGate from "@/components/owner-assistant/OwnerAssistantGate";
import CapabilityBadge from "@/components/owner-assistant/CapabilityBadge";
import GenerationPlanCard from "@/components/owner-assistant/GenerationPlanCard";
import GenerationArtifactCard from "@/components/owner-assistant/GenerationArtifactCard";
import SourceRecordPicker from "@/components/owner-assistant/SourceRecordPicker";

const PROGRAM_KEY = "PRISM_DTJL";

const IDENTITY_FIELDS = [
  { key: "title", label: "Title" },
  { key: "program_key", label: "Program key" },
  { key: "program_family", label: "Program family" },
  { key: "ownership_rail", label: "Ownership rail" },
  { key: "visibility_scope", label: "Visibility scope" },
  { key: "status", label: "Status" },
  { key: "source_version", label: "Source version" },
  { key: "evidence_status", label: "Evidence status" },
  { key: "canonical_path", label: "Canonical path" },
];

export default function OwnerAssistant() {
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  const ownerAccess = useMemo(
    () =>
      getOwnerAccessState({
        user,
        isAuthenticated,
        allowLocalPreview: false,
      }),
    [user, isAuthenticated],
  );

  /** @type {[{status: string, payload?: any, error?: string}, (next: any) => void]} */
  const [state, setState] = useState(
    /** @type {{status: string, payload?: any, error?: string}} */ ({ status: "idle" }),
  );
  const [selectedModuleKey, setSelectedModuleKey] = useState(/** @type {string | null} */ (null));
  const [selectedProfileId, setSelectedProfileId] = useState(/** @type {string | null} */ (null));
  const [selectedDestinationId, setSelectedDestinationId] = useState(
    /** @type {string | null} */ (null),
  );
  const [selectedSourceRecordIds, setSelectedSourceRecordIds] = useState(
    /** @type {string[]} */ ([]),
  );

  useEffect(() => {
    setSelectedSourceRecordIds([]);
  }, [selectedProfileId]);

  useEffect(() => {
    if (!ownerAccess.allowed) {
      setState({ status: "idle" });
      return undefined;
    }

    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      try {
        const { base44 } = await import("@/api/base44Client");
        const response = await base44.functions.invoke("getCanonicalProgramFull", {
          program_key: PROGRAM_KEY,
        });
        if (cancelled) return;
        const result = response?.data ?? response;
        if (!result || result.success !== true) {
          setState({
            status: "error",
            error: result?.error || "Backend rejected the request.",
          });
          return;
        }
        if (!result.program) {
          setState({ status: "not_seeded", payload: result });
          return;
        }
        setState({ status: "ready", payload: result });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          error: err?.message || "Network error while loading owner PRISM data.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ownerAccess.allowed]);

  const program = state.status === "ready" ? state.payload?.program ?? null : null;
  const modules =
    state.status === "ready" && Array.isArray(state.payload?.modules)
      ? state.payload.modules
      : [];
  const warnings =
    state.status === "ready" && Array.isArray(state.payload?.warnings)
      ? state.payload.warnings
      : [];

  useEffect(() => {
    if (!modules.length) {
      setSelectedModuleKey(null);
      return;
    }
    setSelectedModuleKey((prev) => {
      if (prev && modules.some((m) => m?.module_key === prev)) return prev;
      return modules[0]?.module_key ?? null;
    });
  }, [modules]);

  const [planState, setPlanState] = useState(
    /** @type {{status: string, plan?: any, error?: string, validation_errors?: any[]}} */ ({
      status: "idle",
    }),
  );
  const [artifactState, setArtifactState] = useState(
    /** @type {{status: string, artifact?: any, error?: string, validation_errors?: any[]}} */ ({
      status: "idle",
    }),
  );
  const [reviewLoading, setReviewLoading] = useState(false);

  async function handlePlanGeneration() {
    if (!program || !selectedModuleKey || !selectedProfileId || !selectedDestinationId) return;
    const railRaw = program?.ownership_rail || "";
    const rail = String(railRaw).toLowerCase().replace(/^prism.*/, "prism");
    setPlanState({ status: "loading" });
    setArtifactState({ status: "idle" });
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke("proposeOwnerGenerationPlan", {
        rail,
        program_key: program.program_key,
        module_key: selectedModuleKey,
        profile_id: selectedProfileId,
        output_destination_id: selectedDestinationId,
        source_record_ids: selectedSourceRecordIds,
        confirm_dry_run: true,
      });
      const result = response?.data ?? response;
      if (!result || typeof result !== "object") {
        setPlanState({ status: "error", error: "Empty response from plan validator." });
        return;
      }
      if (result.success === true && result.plan) {
        setPlanState({ status: "ready", plan: result.plan });
        return;
      }
      if (Array.isArray(result.validation_errors) && result.validation_errors.length) {
        setPlanState({
          status: "invalid",
          validation_errors: result.validation_errors,
        });
        return;
      }
      setPlanState({
        status: "error",
        error: result.error || "Plan validator did not return a plan.",
      });
    } catch (err) {
      setPlanState({
        status: "error",
        error: err?.message || "Network error while invoking proposeOwnerGenerationPlan.",
      });
    }
  }

  async function handleGenerateArtifact() {
    if (
      !program ||
      !selectedModuleKey ||
      !selectedProfileId ||
      !selectedDestinationId ||
      planState.status !== "ready" ||
      !planState.plan?.generation_plan_id
    ) {
      return;
    }
    const railRaw = program?.ownership_rail || "";
    const rail = String(railRaw).toLowerCase().replace(/^prism.*/, "prism");
    setArtifactState({ status: "loading" });
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke("runOwnerGeneration", {
        generation_plan_id: planState.plan.generation_plan_id,
        rail,
        program_key: program.program_key,
        module_key: selectedModuleKey,
        profile_id: selectedProfileId,
        output_destination_id: selectedDestinationId,
        source_record_ids: selectedSourceRecordIds,
        confirm_dry_run: true,
      });
      const result = response?.data ?? response;
      if (!result || typeof result !== "object") {
        setArtifactState({ status: "error", error: "Empty response from generation runner." });
        return;
      }
      if (result.success === true && result.artifact) {
        setArtifactState({ status: "ready", artifact: result.artifact });
        return;
      }
      if (Array.isArray(result.validation_errors) && result.validation_errors.length) {
        setArtifactState({
          status: "invalid",
          validation_errors: result.validation_errors,
        });
        return;
      }
      setArtifactState({
        status: "error",
        error: result.error || "Generation runner did not return an artifact.",
      });
    } catch (err) {
      setArtifactState({
        status: "error",
        error: err?.message || "Network error while invoking runOwnerGeneration.",
      });
    }
  }

  async function handleReviewArtifact(reviewAction) {
    if (
      artifactState.status !== "ready" ||
      !artifactState.artifact ||
      artifactState.artifact.review_status !== "draft"
    ) {
      return;
    }
    setReviewLoading(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke("reviewOwnerGenerationArtifact", {
        review_action: reviewAction,
        generation_artifact_id: artifactState.artifact.generation_artifact_id,
        generation_plan_id: artifactState.artifact.generation_plan_id,
        artifact: artifactState.artifact,
        confirm_dry_run: true,
      });
      const result = response?.data ?? response;
      if (!result || typeof result !== "object") {
        setArtifactState({
          status: "error",
          error: "Empty response from review gate.",
        });
        return;
      }
      if (result.success === true && result.artifact) {
        setArtifactState({ status: "ready", artifact: result.artifact });
        return;
      }
      if (Array.isArray(result.validation_errors) && result.validation_errors.length) {
        setArtifactState({
          status: "invalid",
          validation_errors: result.validation_errors,
        });
        return;
      }
      setArtifactState({
        status: "error",
        error: result.error || "Review gate did not return an updated artifact.",
      });
    } catch (err) {
      setArtifactState({
        status: "error",
        error: err?.message || "Network error while invoking reviewOwnerGenerationArtifact.",
      });
    } finally {
      setReviewLoading(false);
    }
  }

  function handleArtifactUpdated(updatedArtifact) {
    if (!updatedArtifact || typeof updatedArtifact !== "object") return;
    setArtifactState({ status: "ready", artifact: updatedArtifact });
  }

  const planButtonDisabled =
    !program ||
    !selectedModuleKey ||
    !selectedProfileId ||
    !selectedDestinationId ||
    planState.status === "loading";

  const generateButtonDisabled =
    planState.status !== "ready" ||
    !planState.plan?.generation_plan_id ||
    artifactState.status === "loading";

  if (!ownerAccess.allowed) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
        <PageHeader />
        <OwnerAssistantGate ownerAccess={ownerAccess} onSignIn={navigateToLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a]">
      <PageHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <StatusBanner state={state} />
        <ProgramIdentityPanel program={program} warnings={warnings} />
        <ModulePickerPanel
          modules={modules}
          selectedModuleKey={selectedModuleKey}
          onSelect={setSelectedModuleKey}
        />
        <PlanningControlsPanel
          program={program}
          selectedProfileId={selectedProfileId}
          onSelectProfile={setSelectedProfileId}
          selectedDestinationId={selectedDestinationId}
          onSelectDestination={setSelectedDestinationId}
          selectedSourceRecordIds={selectedSourceRecordIds}
          onSelectSourceRecordIds={setSelectedSourceRecordIds}
          ownerAccessAllowed={ownerAccess.allowed}
          planState={planState}
          planButtonDisabled={planButtonDisabled}
          onPlanGeneration={handlePlanGeneration}
          artifactState={artifactState}
          generateButtonDisabled={generateButtonDisabled}
          onGenerateArtifact={handleGenerateArtifact}
          reviewLoading={reviewLoading}
          onApproveArtifact={() => handleReviewArtifact("approve")}
          onRejectArtifact={() => handleReviewArtifact("reject")}
          onArtifactUpdated={handleArtifactUpdated}
        />
      </main>
    </div>
  );
}

function PageHeader() {
  return (
    <header className="border-b border-black/5 bg-[#fafafa]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/Home" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a0a0a]">
            <span className="text-xs font-bold tracking-tight text-white">C</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">CANONICAL</span>
        </Link>
        <Link
          to="/Home"
          className="inline-flex items-center gap-2 text-sm text-[#0a0a0a]/60 transition-colors hover:text-[#0a0a0a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </header>
  );
}

function StatusBanner({ state }) {
  const status = state.status;
  const tone =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "loading" || status === "idle"
        ? "bg-slate-50 text-slate-700 border-slate-100"
        : status === "not_seeded"
          ? "bg-amber-50 text-amber-800 border-amber-100"
          : "bg-rose-50 text-rose-700 border-rose-100";

  const label =
    status === "loading"
      ? "loading"
      : status === "ready"
        ? "ready"
        : status === "not_seeded"
          ? "not_seeded"
          : status === "error"
            ? "error"
            : "idle";

  return (
    <section className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0a0a0a]/70" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Owner Assistant
            </h1>
            <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-[#0a0a0a]/60">
              Milestone 8 slice 1 (plan + generate + review + export + live Dropbox)
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#0a0a0a]/60">
            Owner-only surface for planning and generating teaching artifacts against PRISM-private
            program data. Reads from server-gated functions and produces deterministic dry-run
            artifact bodies. No LLM, no file writes, no connector calls, no publish.
          </p>
        </div>
        <div className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium ${tone}`}>
          {label}
          {status === "error" && state.error ? (
            <div className="mt-1 max-w-xs text-[11px] font-normal opacity-80">{state.error}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <FeatureLabel>Backend wired (deterministic generation)</FeatureLabel>
        <FeatureLabel>declared_only (output destinations)</FeatureLabel>
        <FeatureLabel>live_disabled (connector writes)</FeatureLabel>
        <FeatureLabel>owner_available (PRISM read)</FeatureLabel>
      </div>
    </section>
  );
}

function FeatureLabel({ children }) {
  return (
    <span className="inline-flex items-center rounded-md border border-black/10 bg-white px-2 py-0.5 text-[11px] font-medium tracking-tight text-[#0a0a0a]/60">
      {children}
    </span>
  );
}

function ProgramIdentityPanel({ program, warnings }) {
  return (
    <Section
      icon={Database}
      title="PRISM program identity"
      caption={
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          Owner-only data. Do not export to demo, public, AYA classroom, or Google Classroom destinations.
        </span>
      }
    >
      {!program ? (
        <EmptyState text="Program identity will appear once the backend returns a payload." />
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {IDENTITY_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-[#0a0a0a]/45">
                  {field.label}
                </dt>
                <dd className="mt-0.5 break-words font-mono text-sm text-[#0a0a0a]/85">
                  {formatFieldValue(program[field.key])}
                </dd>
              </div>
            ))}
          </dl>
          {warnings.length ? (
            <ul className="mt-5 space-y-1.5 border-t border-black/5 pt-4">
              {warnings.map((warning, idx) => (
                <li
                  key={idx}
                  className="rounded-md bg-amber-50/70 px-3 py-2 text-xs leading-5 text-amber-900"
                >
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </Section>
  );
}

function ModulePickerPanel({ modules, selectedModuleKey, onSelect }) {
  return (
    <Section icon={Layers} title="Module" caption="Select a module to plan against. Selection-only; nothing is submitted.">
      {!modules.length ? (
        <EmptyState text="No modules returned for this program yet." />
      ) : (
        <ul className="space-y-2">
          {modules.map((module) => {
            const isSelected = module.module_key === selectedModuleKey;
            return (
              <li key={module.module_key}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                    isSelected
                      ? "border-[#0a0a0a]/40 bg-white"
                      : "border-black/5 bg-white/60 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="owner-assistant-module"
                    value={module.module_key}
                    checked={isSelected}
                    onChange={() => onSelect(module.module_key)}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#0a0a0a]">
                        {module.title || module.module_key}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {module.module_key}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-[#0a0a0a]/55">
                      <span>
                        status: <span className="font-mono">{module.status || "unknown"}</span>
                      </span>
                      <span>
                        visibility:{" "}
                        <span className="font-mono">{module.visibility_scope || "unknown"}</span>
                      </span>
                    </div>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

function PlanningControlsPanel({
  program,
  selectedProfileId,
  onSelectProfile,
  selectedDestinationId,
  onSelectDestination,
  selectedSourceRecordIds,
  onSelectSourceRecordIds,
  ownerAccessAllowed,
  planState,
  planButtonDisabled,
  onPlanGeneration,
  artifactState,
  generateButtonDisabled,
  onGenerateArtifact,
  reviewLoading,
  onApproveArtifact,
  onRejectArtifact,
  onArtifactUpdated,
}) {
  const programRail = program?.ownership_rail
    ? String(program.ownership_rail).toLowerCase().replace(/^prism.*/, "prism")
    : null;
  const programVisibility = program?.visibility_scope || null;
  const selectedProfile =
    GENERATION_PROFILES.find((p) => p.profile_id === selectedProfileId) || null;

  return (
    <Section
      icon={FileText}
      title="Generation planning controls"
      caption="Profiles incompatible with this program's rail or visibility scope are disabled. The validator will reject mismatches server-side as a second line of defense."
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
            Generation profile
          </h3>
          <ul className="mt-3 space-y-2">
            {GENERATION_PROFILES.map((profile) => {
              const isSelected = profile.profile_id === selectedProfileId;
              const railSupported = programRail
                ? profileSupportsRail(profile, programRail)
                : true;
              const visibilitySupported = programVisibility
                ? profileSupportsVisibility(profile, programVisibility)
                : true;
              const compatible = railSupported && visibilitySupported;
              return (
                <li key={profile.profile_id}>
                  <label
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                      compatible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    } ${
                      isSelected
                        ? "border-[#0a0a0a]/40 bg-white"
                        : "border-black/5 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="owner-assistant-profile"
                      value={profile.profile_id}
                      checked={isSelected}
                      disabled={!compatible}
                      aria-disabled={!compatible}
                      onChange={() => {
                        if (compatible) onSelectProfile(profile.profile_id);
                      }}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#0a0a0a]">
                          {profile.title}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {profile.profile_id}
                        </Badge>
                        {programRail && !railSupported ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            not applicable to {programRail}
                          </span>
                        ) : null}
                        {programVisibility && !visibilitySupported ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            not allowed for {programVisibility}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#0a0a0a]/60">
                        {profile.summary}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-[#0a0a0a]/45">
                        <span>
                          rails:{" "}
                          <span className="font-mono">{profile.allowed_rails.join(", ")}</span>
                        </span>
                        <span>
                          format: <span className="font-mono">{profile.format}</span>
                        </span>
                        <span>
                          status: <span className="font-mono">{profile.status}</span>
                        </span>
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <SourceRecordPicker
          ownerAccessAllowed={ownerAccessAllowed}
          selectedProfile={selectedProfile}
          selectedSourceRecordIds={selectedSourceRecordIds}
          onChange={onSelectSourceRecordIds}
        />

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
            Output destination
          </h3>
          <ul className="mt-3 space-y-2">
            {M1_OUTPUT_DESTINATIONS.map((destination) => {
              const isSelected = destination.id === selectedDestinationId;
              return (
                <li key={destination.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                      isSelected
                        ? "border-[#0a0a0a]/40 bg-white"
                        : "border-black/5 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="owner-assistant-destination"
                      value={destination.id}
                      checked={isSelected}
                      onChange={() => onSelectDestination(destination.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#0a0a0a]">
                          {destination.title}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {destination.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#0a0a0a]/60">
                        {destination.description}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/5 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={onPlanGeneration}
              disabled={planButtonDisabled}
              aria-disabled={planButtonDisabled}
              className="bg-[#0a0a0a] text-white hover:bg-[#0a0a0a]/90 disabled:opacity-60"
            >
              {planState?.status === "loading" ? "Validating..." : "Plan generation"}
            </Button>
            <CapabilityBadge label="Dry-run available" />
            <CapabilityBadge label="Owner available" />
            <CapabilityBadge label="Backend wired" />
          </div>
          <p className="text-xs text-[#0a0a0a]/55">
            Calls the owner-gated <span className="font-mono">proposeOwnerGenerationPlan</span>{" "}
            backend function. No artifact body is produced, no file is written, and no connector is
            called. Live writes remain disabled.
          </p>
          <GenerationPlanCard state={planState} />
          <div className="mt-4 flex flex-col gap-2 border-t border-black/5 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={onGenerateArtifact}
                disabled={generateButtonDisabled}
                aria-disabled={generateButtonDisabled}
                variant="outline"
                className="disabled:opacity-60"
              >
                {artifactState?.status === "loading" ? "Generating..." : "Generate artifact (dry-run)"}
              </Button>
              <CapabilityBadge label="Backend wired" />
            </div>
            <p className="text-xs text-[#0a0a0a]/55">
              Requires an approved plan above. Calls{" "}
              <span className="font-mono">runOwnerGeneration</span> to produce a deterministic
              template body. Still no file write and no connector call.
            </p>
            <GenerationArtifactCard
              state={artifactState}
              onApprove={onApproveArtifact}
              onReject={onRejectArtifact}
              onArtifactUpdated={onArtifactUpdated}
              reviewLoading={reviewLoading}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

function Section({ icon: Icon, title, caption, children }) {
  return (
    <section className="mb-8 rounded-2xl border border-black/5 bg-white/70 p-6 shadow-sm">
      <header className="mb-5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#0a0a0a]/60" />
          <h2 className="text-sm font-semibold tracking-tight text-[#0a0a0a]">{title}</h2>
        </div>
        {caption ? (
          <p className="mt-1.5 text-xs leading-5 text-[#0a0a0a]/55">{caption}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-black/10 bg-white/50 px-4 py-6 text-center text-sm text-[#0a0a0a]/55">
      {text}
    </div>
  );
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
