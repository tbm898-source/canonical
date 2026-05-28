import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, GraduationCap, Plug, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import CapabilityBadge from "./CapabilityBadge";
import { canPreviewClassroomExport } from "@/lib/artifactPacketAdapter";

async function invokeBase44Function(functionName, payload) {
  const { base44 } = await import("@/api/base44Client");
  const response = await base44.functions.invoke(functionName, payload);
  return response?.data ?? response;
}

function isValidCourseId(value) {
  return /^[A-Za-z0-9_-]{5,}$/.test(String(value || "").trim());
}

export default function LiveClassroomExportPanel({ artifact, onArtifactUpdated }) {
  const [connectorState, setConnectorState] = useState("checking");
  const [connectorMessage, setConnectorMessage] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("");
  const [confirmLiveWrite, setConfirmLiveWrite] = useState(false);
  const [exportState, setExportState] = useState({ status: "idle", result: null, error: null });

  const classroomAllowed = canPreviewClassroomExport(artifact);
  const moduleKey = String(artifact?.module_key || "");

  useEffect(() => {
    if (!classroomAllowed) return undefined;

    let cancelled = false;

    async function checkConnector() {
      setConnectorState("checking");
      try {
        const result = await invokeBase44Function("canonicalConnectorHealth", {});
        const classroom = result?.connectors?.google_classroom;
        const connected = classroom?.status === "connected";

        if (cancelled) return;

        if (connected) {
          setConnectorState("connected");
          setConnectorMessage(classroom?.message || "Google Classroom connector is available.");
          return;
        }

        setConnectorState("disconnected");
        setConnectorMessage(
          classroom?.message ||
            "Google Classroom is not connected on this Base44 app. Connect it in Base44 Integrations (OAuth). A GCP API key alone cannot post coursework.",
        );
      } catch (err) {
        if (cancelled) return;
        setConnectorState("disconnected");
        setConnectorMessage(
          err?.message ||
            "Could not verify Google Classroom connector health. Connect Google Classroom in Base44 Integrations first.",
        );
      }
    }

    checkConnector();
    return () => {
      cancelled = true;
    };
  }, [classroomAllowed]);

  const courseIdHint = useMemo(() => {
    const trimmed = targetCourseId.trim();
    if (!trimmed) return "";
    if (isValidCourseId(trimmed)) return "";
    return "Course ID must come from the Classroom course URL or API (not the course name).";
  }, [targetCourseId]);

  if (!artifact || artifact.review_status !== "approved") return null;

  if (!classroomAllowed) {
    return (
      <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <GraduationCap className="h-4 w-4 text-slate-600" />
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700/80">
            Live Google Classroom export (Milestone 8 slice 3)
          </h4>
          <CapabilityBadge label="Blocked" />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-700/75">
          PRISM-private artifacts cannot be posted to Google Classroom. Generate and approve an
          AYA / classroom-safe artifact (rail: aya, visibility: aya_classroom) to use live Classroom
          export.
        </p>
      </section>
    );
  }

  const connectorReady = connectorState === "connected";
  const exportReady =
    connectorReady &&
    isValidCourseId(targetCourseId) &&
    confirmLiveWrite &&
    exportState.status !== "loading";

  const capabilityLabel =
    connectorState === "checking"
      ? "Owner available"
      : connectorReady
        ? "Live write enabled"
        : "Blocked by config";

  async function exportToClassroom() {
    if (!exportReady) return;
    setExportState({ status: "loading", result: null, error: null });
    try {
      const result = await invokeBase44Function("exportOwnerApprovedArtifactToClassroom", {
        generation_artifact_id: artifact.generation_artifact_id,
        generation_plan_id: artifact.generation_plan_id,
        artifact,
        confirm_live_write: true,
        target_course_id: targetCourseId.trim(),
        classroom_topic_hint: moduleKey,
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
        error: validationMessage || result?.error || "Live Google Classroom export did not succeed.",
      });
    } catch (err) {
      setExportState({
        status: "error",
        result: null,
        error: err?.message || "Network error during live Google Classroom export.",
      });
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-sky-200/80 bg-sky-50/30 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-sky-700" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-sky-900/80">
          Live Google Classroom export (Milestone 8 slice 3)
        </h4>
        <CapabilityBadge label={capabilityLabel} />
      </div>

      <p className="mt-2 text-xs leading-5 text-sky-900/75">
        Publishes classroom-safe coursework from this approved artifact. Requires Google Classroom
        OAuth in Base44 Integrations — not a browser API key pasted into this form.
      </p>

      <div className="mt-3 rounded-lg border border-sky-200/80 bg-white/70 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-900/80">
          <Plug className="h-3.5 w-3.5" />
          Connector status
        </div>
        <p className="mt-1 text-xs leading-5 text-sky-900/70">
          {connectorState === "checking"
            ? "Checking Google Classroom connector..."
            : connectorMessage}
        </p>
        {connectorState === "disconnected" ? (
          <p className="mt-2 text-[11px] leading-5 text-amber-900/80">
            In Base44 → Integrations → connect <strong>Google Classroom</strong> with the Google
            account that owns your course. Enable the Classroom API in Google Cloud if prompted.
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-sky-900/70">
          Google Classroom course ID
        </label>
        <input
          type="text"
          value={targetCourseId}
          onChange={(event) => setTargetCourseId(event.target.value.trim())}
          placeholder="123456789012"
          disabled={!connectorReady || exportState.status === "loading"}
          className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 font-mono text-xs text-[#0a0a0a]/80 disabled:opacity-60"
        />
        <p className="mt-1 text-[11px] text-sky-900/60">
          From the course URL after <span className="font-mono">/c/</span> or from the Classroom
          API. Use an AYA / CTS course — never a PRISM-private destination.
        </p>
        {courseIdHint ? <p className="mt-1 text-[11px] text-amber-800/90">{courseIdHint}</p> : null}
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-sky-950/80">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmLiveWrite}
          onChange={(event) => setConfirmLiveWrite(event.target.checked)}
          disabled={!connectorReady || !isValidCourseId(targetCourseId) || exportState.status === "loading"}
        />
        <span>
          I confirm this classroom-safe artifact should be published live to course{" "}
          <span className="font-mono">{targetCourseId.trim() || "(course id required)"}</span>.
        </span>
      </label>

      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          disabled={!exportReady}
          onClick={exportToClassroom}
          className="gap-1.5 bg-sky-800 text-white hover:bg-sky-900 disabled:opacity-50"
        >
          <GraduationCap className="h-3.5 w-3.5" />
          {exportState.status === "loading" ? "Publishing..." : "Post to Google Classroom (live)"}
        </Button>
      </div>

      {exportState.status === "error" ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Live Classroom export failed
          </div>
          <p className="mt-1 text-xs text-rose-700/90">{exportState.error}</p>
        </div>
      ) : null}

      {exportState.status === "ready" && exportState.result?.classroom ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
          <div className="text-[11px] font-semibold text-emerald-800">Posted to Google Classroom</div>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-black/5 bg-white p-2 text-[10px] leading-5 text-[#0a0a0a]/80">
            {JSON.stringify(exportState.result.classroom, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
