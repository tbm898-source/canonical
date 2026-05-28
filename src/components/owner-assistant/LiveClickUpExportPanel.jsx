import React, { useState } from "react";
import { AlertTriangle, ListChecks, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import CapabilityBadge from "./CapabilityBadge";

async function invokeBase44Function(functionName, payload) {
  const { base44 } = await import("@/api/base44Client");
  const response = await base44.functions.invoke(functionName, payload);
  return response?.data ?? response;
}

export default function LiveClickUpExportPanel({ artifact, onArtifactUpdated }) {
  const [targetListId, setTargetListId] = useState("");
  const [confirmLiveWrite, setConfirmLiveWrite] = useState(false);
  const [exportState, setExportState] = useState({ status: "idle", result: null, error: null });

  if (!artifact || artifact.review_status !== "approved") return null;

  const exportReady =
    Boolean(targetListId.trim()) &&
    confirmLiveWrite &&
    exportState.status !== "loading";

  async function exportToClickUp() {
    if (!exportReady) return;
    setExportState({ status: "loading", result: null, error: null });
    try {
      const result = await invokeBase44Function("exportOwnerApprovedArtifactToClickUp", {
        generation_artifact_id: artifact.generation_artifact_id,
        generation_plan_id: artifact.generation_plan_id,
        artifact,
        confirm_live_write: true,
        target_list_id: targetListId.trim(),
      });

      if (result?.success && result?.artifact) {
        setExportState({ status: "ready", result, error: null });
        onArtifactUpdated?.(result.artifact);
        return;
      }

      const validationMessage = Array.isArray(result?.validation_errors)
        ? result.validation_errors.map((entry) => entry.message).join(" ")
        : null;
      setExportState({
        status: "error",
        result,
        error: validationMessage || result?.error || "Live ClickUp export did not succeed.",
      });
    } catch (err) {
      setExportState({
        status: "error",
        result: null,
        error: err?.message || "Network error during live ClickUp export.",
      });
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-violet-200/80 bg-violet-50/30 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-violet-700" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-violet-900/80">
          Live ClickUp export (Milestone 8 slice 2)
        </h4>
        <CapabilityBadge label="Owner available" />
      </div>

      <p className="mt-2 text-xs leading-5 text-violet-900/75">
        Creates curated review tasks in ClickUp from this approved artifact. Task bodies use safe
        summaries only — not raw PRISM-private markdown. Google Classroom live export is not enabled
        yet.
      </p>

      <div className="mt-4">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-violet-900/70">
          ClickUp target list ID
        </label>
        <input
          type="text"
          value={targetListId}
          onChange={(event) => setTargetListId(event.target.value)}
          placeholder="901234567890"
          className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 font-mono text-xs text-[#0a0a0a]/80"
        />
        <p className="mt-1 text-[11px] text-violet-900/60">
          Paste the numeric list ID from your ClickUp list URL. Use a private owner/review list for
          PRISM artifacts.
        </p>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-violet-950/80">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmLiveWrite}
          onChange={(event) => setConfirmLiveWrite(event.target.checked)}
          disabled={!targetListId.trim() || exportState.status === "loading"}
        />
        <span>
          I confirm curated ClickUp tasks should be created live in list{" "}
          <span className="font-mono">{targetListId.trim() || "(list id required)"}</span>.
        </span>
      </label>

      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          disabled={!exportReady}
          onClick={exportToClickUp}
          className="gap-1.5 bg-violet-800 text-white hover:bg-violet-900 disabled:opacity-50"
        >
          <ListChecks className="h-3.5 w-3.5" />
          {exportState.status === "loading" ? "Creating tasks..." : "Create ClickUp tasks (live)"}
        </Button>
      </div>

      {exportState.status === "error" ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Live ClickUp export failed
          </div>
          <p className="mt-1 text-xs text-rose-700/90">{exportState.error}</p>
        </div>
      ) : null}

      {exportState.status === "ready" && exportState.result?.clickup ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <div className="text-[11px] font-semibold text-emerald-800">ClickUp tasks created</div>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-black/5 bg-white p-2 text-[10px] leading-5 text-[#0a0a0a]/80">
            {JSON.stringify(exportState.result.clickup, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
