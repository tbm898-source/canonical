import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  DatabaseZap,
  FileUp,
  GraduationCap,
  ListChecks,
  Lock,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONNECTOR_MODES,
  validateClassification,
} from "@/lib/canonicalConnectorPolicy";

function unwrapResponse(response) {
  return response?.data ?? response;
}

async function invokeBase44Function(functionName, payload) {
  const { base44 } = await import("@/api/base44Client");
  return base44.functions.invoke(functionName, payload);
}

function StatusPill({ state }) {
  const palette = {
    idle: "bg-slate-50 text-slate-600 border-slate-100",
    checking: "bg-blue-50 text-blue-700 border-blue-100",
    discovered: "bg-indigo-50 text-indigo-700 border-indigo-100",
    needs_owner_approval: "bg-amber-50 text-amber-800 border-amber-100",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blocked: "bg-rose-50 text-rose-700 border-rose-100",
    saving: "bg-blue-50 text-blue-700 border-blue-100",
    saved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    preparing: "bg-blue-50 text-blue-700 border-blue-100",
    prepared: "bg-emerald-50 text-emerald-700 border-emerald-100",
    error: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${palette[state] || palette.idle}`}>
      {state.replace(/_/g, " ")}
    </span>
  );
}

function IntegrationCard({ icon: Icon, title, state, children, action }) {
  return (
    <article className="min-w-0 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Icon className="h-4 w-4 text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-[#0a0a0a]">{title}</h4>
        </div>
        <StatusPill state={state} />
      </div>
      <div className="mt-4 text-sm leading-6 text-[#0a0a0a]/55">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </article>
  );
}

function SafeJsonBlock({ value }) {
  if (!value) return null;
  return (
    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#fafafa] p-3 text-xs leading-5 text-[#0a0a0a]/55">
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

const declaredBackendFunctions = [
  "canonicalConnectorHealth",
  "canonicalSpineDiscovery",
  "saveInstructionalPacketToDropbox",
  "prepareClassroomExport",
  "prepareClickUpExport",
  "canonicalDropboxFileOps",
];

export default function LiveIntegrationsPanel({ owner, generatedPackage }) {
  const [healthState, setHealthState] = useState("idle");
  const [health, setHealth] = useState(null);
  const [spineState, setSpineState] = useState("idle");
  const [spine, setSpine] = useState(null);
  const [acceptedSpineMap, setAcceptedSpineMap] = useState(null);
  const [dropboxState, setDropboxState] = useState("idle");
  const [dropboxSave, setDropboxSave] = useState(null);
  const [classroomState, setClassroomState] = useState("idle");
  const [classroomDraft, setClassroomDraft] = useState(null);
  const [clickUpState, setClickUpState] = useState("idle");
  const [clickUpDraft, setClickUpDraft] = useState(null);

  const classification = generatedPackage?.classification;
  const validation = useMemo(
    () =>
      validateClassification(classification, {
        mode: owner ? CONNECTOR_MODES.OWNER_PREVIEW : CONNECTOR_MODES.DEMO,
      }),
    [classification, owner],
  );
  const modeLabel = owner
    ? acceptedSpineMap
      ? CONNECTOR_MODES.OWNER_LIVE_DROPBOX
      : CONNECTOR_MODES.OWNER_PREVIEW
    : CONNECTOR_MODES.DEMO;
  const connectorBlockedMessage = owner ? "Generate a packet first." : "Connector disabled in demo.";
  const canCallBackend = owner;
  const canSaveDropbox =
    owner &&
    Boolean(generatedPackage) &&
    Boolean(acceptedSpineMap?.canonical_spine_map_id) &&
    validation.ok;

  const safeCall = async (stateSetter, fn, onSuccess) => {
    if (!canCallBackend) {
      stateSetter("blocked");
      return;
    }
    try {
      const result = unwrapResponse(await fn());
      onSuccess(result);
    } catch (error) {
      onSuccess({ success: false, error: error.message || "Backend function call failed." });
      stateSetter("error");
    }
  };

  const checkHealth = () => {
    setHealthState("checking");
    safeCall(
      setHealthState,
      () => invokeBase44Function("canonicalConnectorHealth", {}),
      (result) => {
        setHealth(result);
        setHealthState(result.success ? "ready" : "error");
      },
    );
  };

  const discoverSpine = () => {
    setSpineState("checking");
    safeCall(
      setSpineState,
      () => invokeBase44Function("canonicalSpineDiscovery", { accept_discovered_map: false }),
      (result) => {
        setSpine(result);
        setSpineState(result.success ? "needs_owner_approval" : "error");
      },
    );
  };

  const approveSpine = () => {
    setSpineState("checking");
    safeCall(
      setSpineState,
      () =>
        invokeBase44Function("canonicalSpineDiscovery", {
          accept_discovered_map: true,
          selected_root_path: spine?.candidate_roots?.[0]?.root_path || "",
        }),
      (result) => {
        setAcceptedSpineMap(result);
        setSpine(result);
        setSpineState(result.success && result.canonical_spine_map_id ? "ready" : "error");
      },
    );
  };

  const saveDropbox = () => {
    if (!generatedPackage) {
      setDropboxState("blocked");
      return;
    }
    setDropboxState("saving");
    safeCall(
      setDropboxState,
      () =>
        invokeBase44Function("saveInstructionalPacketToDropbox", {
          session_key: classification.session_key,
          module_key: classification.module_key,
          session_title: classification.session_title,
          session_date: classification.session_date,
          packet_json: generatedPackage.packetJson,
          packet_markdown: generatedPackage.packetMarkdown,
          visibility_scope: classification.visibility_scope,
          rail: classification.rail,
          artifact_type: classification.artifact_type,
          canonical_spine_map_id: acceptedSpineMap?.canonical_spine_map_id,
          approved_destination_path:
            acceptedSpineMap?.recommended_artifact_paths?.[classification.visibility_scope] || "",
          dry_run: false,
        }),
      (result) => {
        setDropboxSave(result);
        setDropboxState(result.success ? "saved" : "error");
      },
    );
  };

  const prepareClassroom = () => {
    if (!generatedPackage) {
      setClassroomState("blocked");
      return;
    }
    setClassroomState("preparing");
    safeCall(
      setClassroomState,
      () =>
        invokeBase44Function("prepareClassroomExport", {
          packet_json: generatedPackage.packetJson,
          target_course_id: "",
          classroom_topic_hint: generatedPackage.brief.module_key,
          dry_run: true,
        }),
      (result) => {
        setClassroomDraft(result);
        setClassroomState(result.success ? "prepared" : "error");
      },
    );
  };

  const prepareClickUp = () => {
    if (!generatedPackage) {
      setClickUpState("blocked");
      return;
    }
    setClickUpState("preparing");
    safeCall(
      setClickUpState,
      () =>
        invokeBase44Function("prepareClickUpExport", {
          packet_json: generatedPackage.packetJson,
          target_list_id: "",
          dry_run: true,
        }),
      (result) => {
        setClickUpDraft(result);
        setClickUpState(result.success ? "prepared" : "error");
      },
    );
  };

  return (
    <section id="integrations" className="mb-6 scroll-mt-24 rounded-3xl border border-black/5 bg-[#fafafa] p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            <Cloud className="h-3.5 w-3.5" />
            Live Integrations
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#0a0a0a]">
            Connector spine controls
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#0a0a0a]/50">
            Dropbox is treated as the discovered CANONICAL spine. Classroom and ClickUp stay dry-run only in V1, and demo mode never calls backend connectors.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
          {modeLabel.replace(/_/g, " ")}
        </span>
      </div>

      {!owner && (
        <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Demo mode: connector calls, real Dropbox paths, Classroom posting, ClickUp creation, and Gmail/email sending are disabled.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <IntegrationCard
          icon={DatabaseZap}
          title="Connector Health"
          state={healthState}
          action={
            <Button variant="outline" className="gap-2" onClick={checkHealth} disabled={!owner}>
              <RefreshCcw className="h-4 w-4" />
              {owner ? "Check connectors" : "Owner mode required"}
            </Button>
          }
        >
          <p>Checks Dropbox, Google Classroom, ClickUp, and Gmail shared owner connectors without exposing tokens.</p>
          <SafeJsonBlock value={health?.connectors || health?.error} />
        </IntegrationCard>

        {owner && (
          <IntegrationCard icon={DatabaseZap} title="Backend Function Availability" state="ready">
            <p>
              Owner workbench expects these Base44 backend functions to be deployed. They are shown as declared app capabilities, not proof of live connector writes.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {declaredBackendFunctions.map((functionName) => (
                <span
                  key={functionName}
                  className="rounded-full bg-[#fafafa] px-3 py-1 text-[11px] font-semibold text-[#0a0a0a]/55"
                >
                  {functionName}
                </span>
              ))}
            </div>
          </IntegrationCard>
        )}

        <IntegrationCard
          icon={Lock}
          title="CANONICAL Spine"
          state={spineState}
          action={
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2" onClick={discoverSpine} disabled={!owner}>
                <RefreshCcw className="h-4 w-4" />
                {owner ? "Discover Dropbox spine" : "Connector disabled in demo"}
              </Button>
              <Button
                className="gap-2 bg-[#0a0a0a] hover:bg-[#1a1a1a]"
                onClick={approveSpine}
                disabled={!owner || !spine?.success}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve spine map
              </Button>
            </div>
          }
        >
          <p>Reads Dropbox folder metadata only. It does not create folders, move files, or write files.</p>
          <SafeJsonBlock
            value={
              spine
                ? {
                    candidate_roots: spine.candidate_roots,
                    detected_spine_folders: spine.detected_spine_folders,
                    missing_expected_folders: spine.missing_expected_folders,
                    recommended_artifact_paths: spine.recommended_artifact_paths,
                    canonical_spine_map_id: spine.canonical_spine_map_id,
                    warnings: spine.warnings,
                    error: spine.error,
                  }
                : null
            }
          />
        </IntegrationCard>

        <IntegrationCard
          icon={FileUp}
          title="Dropbox Save"
          state={dropboxState}
          action={
            <Button
              className="gap-2 bg-[#0a0a0a] hover:bg-[#1a1a1a]"
              onClick={saveDropbox}
              disabled={!canSaveDropbox}
            >
              <FileUp className="h-4 w-4" />
              {owner ? "Save approved packet" : "Preview only"}
            </Button>
          }
        >
          <p>
            {generatedPackage
              ? `Packet classified as ${classification.rail} / ${classification.visibility_scope} / ${classification.artifact_type}.`
              : connectorBlockedMessage}
          </p>
          {!validation.ok && (
            <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs leading-5 text-rose-800">
              {validation.errors.join(" ")}
            </div>
          )}
          <SafeJsonBlock value={dropboxSave || acceptedSpineMap?.recommended_artifact_paths || null} />
        </IntegrationCard>

        <IntegrationCard
          icon={GraduationCap}
          title="Classroom Adapter"
          state={classroomState}
          action={
            <Button variant="outline" className="gap-2" onClick={prepareClassroom} disabled={!owner || !generatedPackage}>
              <GraduationCap className="h-4 w-4" />
              {owner ? "Prepare dry-run" : "Preview only"}
            </Button>
          }
        >
          <p>Dry-run only in V1. Produces AYA-safe Classroom draft metadata and never posts live.</p>
          <SafeJsonBlock value={classroomDraft?.classroom_draft || classroomDraft?.error} />
        </IntegrationCard>

        <IntegrationCard
          icon={ListChecks}
          title="ClickUp Adapter"
          state={clickUpState}
          action={
            <Button variant="outline" className="gap-2" onClick={prepareClickUp} disabled={!owner || !generatedPackage}>
              <ListChecks className="h-4 w-4" />
              {owner ? "Prepare dry-run" : "Preview only"}
            </Button>
          }
        >
          <p>Dry-run only in V1. Produces tagged task candidates but never creates live ClickUp tasks.</p>
          <SafeJsonBlock value={clickUpDraft?.task_candidates || clickUpDraft?.error} />
        </IntegrationCard>

        <IntegrationCard icon={ShieldAlert} title="Gmail / Email" state="blocked">
          <p>Future-disabled in V1. No live email sending is built or enabled.</p>
        </IntegrationCard>
      </div>
    </section>
  );
}
