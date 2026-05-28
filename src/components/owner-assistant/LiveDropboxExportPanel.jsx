import React, { useMemo, useState } from "react";
import { AlertTriangle, DatabaseZap, MapPin, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import CapabilityBadge from "./CapabilityBadge";
import { artifactToPacketJson } from "@/lib/artifactPacketAdapter";

async function invokeBase44Function(functionName, payload) {
  const { base44 } = await import("@/api/base44Client");
  const response = await base44.functions.invoke(functionName, payload);
  return response?.data ?? response;
}

export default function LiveDropboxExportPanel({ artifact, onArtifactUpdated }) {
  const [spineState, setSpineState] = useState("idle");
  const [spine, setSpine] = useState(null);
  const [acceptedSpineMap, setAcceptedSpineMap] = useState(null);
  const [confirmLiveWrite, setConfirmLiveWrite] = useState(false);
  const [exportState, setExportState] = useState({ status: "idle", result: null, error: null });

  const classification = useMemo(() => {
    if (!artifact) return null;
    return artifactToPacketJson(artifact).packet_metadata;
  }, [artifact]);

  const destinationPath = useMemo(() => {
    if (!acceptedSpineMap || !classification) return "";
    return (
      acceptedSpineMap.recommended_artifact_paths?.[classification.visibility_scope] ||
      acceptedSpineMap.recommended_paths?.[classification.visibility_scope] ||
      ""
    );
  }, [acceptedSpineMap, classification]);

  if (!artifact || artifact.review_status !== "approved") return null;

  const alreadyExported = artifact.export_readiness_status === "ready_live";
  const exportReady =
    Boolean(acceptedSpineMap?.canonical_spine_map_id) &&
    Boolean(destinationPath) &&
    confirmLiveWrite &&
    exportState.status !== "loading";

  async function discoverSpine() {
    setSpineState("checking");
    try {
      const result = await invokeBase44Function("canonicalSpineDiscovery", {
        accept_discovered_map: false,
      });
      setSpine(result);
      setSpineState(result?.success ? "needs_owner_approval" : "error");
    } catch (err) {
      setSpine(null);
      setSpineState("error");
    }
  }

  async function approveSpine() {
    setSpineState("checking");
    try {
      const result = await invokeBase44Function("canonicalSpineDiscovery", {
        accept_discovered_map: true,
        selected_root_path: spine?.candidate_roots?.[0]?.root_path || "",
      });
      setAcceptedSpineMap(result);
      setSpine(result);
      setSpineState(result?.success && result?.canonical_spine_map_id ? "ready" : "error");
    } catch (err) {
      setSpineState("error");
    }
  }

  async function exportToDropbox() {
    if (!exportReady || !classification) return;
    setExportState({ status: "loading", result: null, error: null });
    try {
      const result = await invokeBase44Function("exportOwnerApprovedArtifactToDropbox", {
        generation_artifact_id: artifact.generation_artifact_id,
        generation_plan_id: artifact.generation_plan_id,
        artifact,
        confirm_live_write: true,
        canonical_spine_map_id: acceptedSpineMap.canonical_spine_map_id,
        approved_destination_path: destinationPath,
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
        error: validationMessage || result?.error || "Live Dropbox export did not succeed.",
      });
    } catch (err) {
      setExportState({
        status: "error",
        result: null,
        error: err?.message || "Network error during live Dropbox export.",
      });
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/30 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-700" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/80">
          Live Dropbox export (Milestone 8)
        </h4>
        <CapabilityBadge label={alreadyExported ? "Live write enabled" : "Owner available"} />
      </div>

      <p className="mt-2 text-xs leading-5 text-amber-900/75">
        Writes JSON, Markdown, and manifest files to your accepted CANONICAL spine path. Requires
        spine discovery approval and an explicit owner confirmation. ClickUp and Classroom live
        writes are not enabled in this slice.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={spineState === "checking"}
          onClick={discoverSpine}
          className="gap-1.5"
        >
          <MapPin className="h-3.5 w-3.5" />
          {spineState === "checking" ? "Discovering..." : "Discover spine"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={spineState !== "needs_owner_approval" || spineState === "checking"}
          onClick={approveSpine}
          className="gap-1.5"
        >
          Approve discovered spine
        </Button>
      </div>

      {spineState === "needs_owner_approval" && spine?.candidate_roots?.[0]?.root_path ? (
        <p className="mt-2 text-[11px] text-amber-900/70">
          Candidate root: <span className="font-mono">{spine.candidate_roots[0].root_path}</span>
        </p>
      ) : null}

      {spineState === "ready" && destinationPath ? (
        <p className="mt-2 text-[11px] text-emerald-800/80">
          Destination for <span className="font-mono">{classification.visibility_scope}</span>:{" "}
          <span className="font-mono">{destinationPath}</span>
        </p>
      ) : null}

      {spineState === "error" ? (
        <p className="mt-2 text-[11px] text-rose-700">
          Spine discovery failed or no confident CANONICAL root was found.
        </p>
      ) : null}

      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-950/80">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmLiveWrite}
          onChange={(event) => setConfirmLiveWrite(event.target.checked)}
          disabled={spineState !== "ready" || exportState.status === "loading"}
        />
        <span>
          I confirm this approved artifact should be written live to Dropbox at the resolved spine
          destination. This action cannot be undone from this panel.
        </span>
      </label>

      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          disabled={!exportReady}
          onClick={exportToDropbox}
          className="gap-1.5 bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50"
        >
          <DatabaseZap className="h-3.5 w-3.5" />
          {exportState.status === "loading" ? "Saving to Dropbox..." : "Save to Dropbox (live)"}
        </Button>
      </div>

      {exportState.status === "error" ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Live export failed
          </div>
          <p className="mt-1 text-xs text-rose-700/90">{exportState.error}</p>
        </div>
      ) : null}

      {exportState.status === "ready" && exportState.result?.dropbox ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <div className="text-[11px] font-semibold text-emerald-800">Saved to Dropbox</div>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-black/5 bg-white p-2 text-[10px] leading-5 text-[#0a0a0a]/80">
            {JSON.stringify(exportState.result.dropbox, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
