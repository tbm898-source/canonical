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

function spineAccepted(result) {
  return Boolean(
    result?.accepted_spine_map?.accepted_by_owner ||
      (result?.success && result?.canonical_spine_map_id),
  );
}

export default function LiveDropboxExportPanel({ artifact, onArtifactUpdated }) {
  const [spineState, setSpineState] = useState("idle");
  const [spine, setSpine] = useState(null);
  const [acceptedSpineMap, setAcceptedSpineMap] = useState(null);
  const [spineError, setSpineError] = useState("");
  const [manualDestinationPath, setManualDestinationPath] = useState("");
  const [confirmLiveWrite, setConfirmLiveWrite] = useState(false);
  const [exportState, setExportState] = useState({ status: "idle", result: null, error: null });

  const classification = useMemo(() => {
    if (!artifact) return null;
    return artifactToPacketJson(artifact).packet_metadata;
  }, [artifact]);

  const discoveredDestinationPath = useMemo(() => {
    if (!spine || !classification) return "";
    return (
      spine.recommended_artifact_paths?.[classification.visibility_scope] ||
      acceptedSpineMap?.recommended_artifact_paths?.[classification.visibility_scope] ||
      acceptedSpineMap?.recommended_paths?.[classification.visibility_scope] ||
      ""
    );
  }, [spine, acceptedSpineMap, classification]);

  const destinationPath = manualDestinationPath.trim() || discoveredDestinationPath;

  if (!artifact || artifact.review_status !== "approved") return null;

  const alreadyExported = artifact.export_readiness_status === "ready_live";
  const exportReady =
    Boolean(destinationPath) &&
    confirmLiveWrite &&
    exportState.status !== "loading" &&
    (spineAccepted(acceptedSpineMap) || Boolean(manualDestinationPath.trim()));

  async function discoverSpine() {
    setSpineState("checking");
    setSpineError("");
    try {
      const result = await invokeBase44Function("canonicalSpineDiscovery", {
        accept_discovered_map: false,
      });
      setSpine(result);

      if (!result?.success) {
        setSpineState("error");
        setSpineError(
          result?.error ||
            (Array.isArray(result?.warnings) ? result.warnings.join(" ") : "") ||
            "Dropbox spine discovery failed.",
        );
        return;
      }

      if (!Array.isArray(result.candidate_roots) || result.candidate_roots.length === 0) {
        setSpineState("no_candidates");
        setSpineError(
          Array.isArray(result.warnings) && result.warnings.length
            ? result.warnings.join(" ")
            : "No CANONICAL spine root was found in connected Dropbox.",
        );
        return;
      }

      setSpineState("needs_owner_approval");
      const autoPath =
        result.recommended_artifact_paths?.[classification?.visibility_scope] || "";
      if (autoPath && !manualDestinationPath) {
        setManualDestinationPath(autoPath);
      }
    } catch (err) {
      setSpine(null);
      setSpineState("error");
      setSpineError(err?.message || "Network error during spine discovery.");
    }
  }

  async function approveSpine() {
    setSpineState("checking");
    setSpineError("");
    try {
      const result = await invokeBase44Function("canonicalSpineDiscovery", {
        accept_discovered_map: true,
        selected_root_path: spine?.candidate_roots?.[0]?.root_path ?? "",
      });
      setAcceptedSpineMap(result);
      setSpine(result);

      if (!spineAccepted(result)) {
        setSpineState("error");
        setSpineError(
          result?.error ||
            "Spine approval did not return an accepted map. Entity API may be unavailable and discovery may have found no root.",
        );
        return;
      }

      const autoPath =
        result.recommended_artifact_paths?.[classification?.visibility_scope] ||
        result.accepted_spine_map?.recommended_paths?.[classification.visibility_scope] ||
        "";
      if (autoPath && !manualDestinationPath) {
        setManualDestinationPath(autoPath);
      }

      setSpineState("ready");
      if (result.accepted_spine_map?.persistence === "stateless") {
        setSpineError(
          "Spine accepted statelessly for this session (entity API not provisioned). Export will still proceed with the resolved path.",
        );
      }
    } catch (err) {
      setSpineState("error");
      setSpineError(err?.message || "Network error during spine approval.");
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
        canonical_spine_map_id: acceptedSpineMap?.canonical_spine_map_id || "",
        accepted_spine_map:
          acceptedSpineMap?.accepted_spine_map ||
          (spineAccepted(acceptedSpineMap)
            ? {
                accepted_by_owner: true,
                recommended_paths: acceptedSpineMap?.recommended_artifact_paths || {},
                root_path: acceptedSpineMap?.candidate_roots?.[0]?.root_path || "",
              }
            : null),
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
        spine discovery approval and an explicit owner confirmation. If discovery cannot find your
        spine automatically, enter a Dropbox folder path manually below.
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

      {spineState === "needs_owner_approval" && spine?.candidate_roots?.[0] ? (
        <div className="mt-2 space-y-1 text-[11px] text-amber-900/70">
          <p>
            Candidate root:{" "}
            <span className="font-mono">
              {spine.candidate_roots[0].root_path || "(Dropbox root)"}
            </span>
          </p>
          {discoveredDestinationPath ? (
            <p>
              Suggested <span className="font-mono">{classification.visibility_scope}</span> path:{" "}
              <span className="font-mono">{discoveredDestinationPath}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {spineState === "ready" && destinationPath ? (
        <p className="mt-2 text-[11px] text-emerald-800/80">
          Destination for <span className="font-mono">{classification.visibility_scope}</span>:{" "}
          <span className="font-mono">{destinationPath}</span>
        </p>
      ) : null}

      {(spineState === "error" || spineState === "no_candidates") && spineError ? (
        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
          <p className="text-[11px] text-rose-700">{spineError}</p>
        </div>
      ) : null}

      {spineState === "ready" && spineError ? (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
          <p className="text-[11px] text-amber-800">{spineError}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/70">
          Dropbox destination path
        </label>
        <input
          type="text"
          value={manualDestinationPath}
          onChange={(event) => setManualDestinationPath(event.target.value)}
          placeholder="/CANONICAL/09_PRISM_Private/exports"
          className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-[#0a0a0a]/80"
        />
        <p className="mt-1 text-[11px] text-amber-900/60">
          For PRISM-private artifacts, target your private export folder (for example{" "}
          <span className="font-mono">09_PRISM_Private</span>). Discovery will pre-fill this when
          possible.
        </p>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-950/80">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmLiveWrite}
          onChange={(event) => setConfirmLiveWrite(event.target.checked)}
          disabled={!destinationPath || exportState.status === "loading"}
        />
        <span>
          I confirm this approved artifact should be written live to Dropbox at{" "}
          <span className="font-mono">{destinationPath || "(path required)"}</span>. This action
          cannot be undone from this panel.
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
