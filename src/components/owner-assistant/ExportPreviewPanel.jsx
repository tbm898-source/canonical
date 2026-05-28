import React, { useState } from "react";
import { Cloud, DatabaseZap, GraduationCap, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import CapabilityBadge from "./CapabilityBadge";
import {
  artifactToPacketJson,
  canPreviewClassroomExport,
  canPreviewClickUpExport,
  canPreviewDropboxExport,
} from "@/lib/artifactPacketAdapter";

export default function ExportPreviewPanel({ artifact }) {
  const [dropboxState, setDropboxState] = useState({ status: "idle", result: null, error: null });
  const [classroomState, setClassroomState] = useState({ status: "idle", result: null, error: null });
  const [clickupState, setClickupState] = useState({ status: "idle", result: null, error: null });

  if (!artifact || artifact.review_status !== "approved") return null;

  const packetJson = artifactToPacketJson(artifact);
  const classification = packetJson.packet_metadata;
  const classroomAllowed = canPreviewClassroomExport(artifact);

  async function invokeConnector(functionName, payload, setState) {
    setState({ status: "loading", result: null, error: null });
    try {
      const { base44 } = await import("@/api/base44Client");
      const response = await base44.functions.invoke(functionName, payload);
      const result = response?.data ?? response;
      if (result?.success) {
        setState({ status: "ready", result, error: null });
        return;
      }
      setState({
        status: "error",
        result,
        error: result?.error || "Connector dry-run did not succeed.",
      });
    } catch (err) {
      setState({
        status: "error",
        result: null,
        error: err?.message || "Network error during connector dry-run.",
      });
    }
  }

  function previewDropbox() {
    if (!canPreviewDropboxExport(artifact)) return;
    invokeConnector(
      "saveInstructionalPacketToDropbox",
      {
        session_key: classification.session_key,
        module_key: classification.module_key,
        session_title: classification.session_title,
        session_date: classification.session_date,
        packet_json: packetJson,
        packet_markdown: artifact.body_markdown || "",
        visibility_scope: classification.visibility_scope,
        rail: classification.rail,
        artifact_type: classification.artifact_type,
        approved_destination_path: "",
        dry_run: true,
      },
      setDropboxState,
    );
  }

  function previewClassroom() {
    if (!classroomAllowed) return;
    invokeConnector(
      "prepareClassroomExport",
      {
        packet_json: packetJson,
        target_course_id: "",
        classroom_topic_hint: classification.module_key,
        dry_run: true,
      },
      setClassroomState,
    );
  }

  function previewClickUp() {
    if (!canPreviewClickUpExport(artifact)) return;
    invokeConnector(
      "prepareClickUpExport",
      {
        packet_json: packetJson,
        target_list_id: "",
        dry_run: true,
      },
      setClickupState,
    );
  }

  return (
    <section className="mt-5 border-t border-black/5 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Cloud className="h-4 w-4 text-indigo-600" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
          Export preview (dry-run only)
        </h4>
        <CapabilityBadge label="Dry-run available" />
      </div>
      <p className="mt-2 text-xs leading-5 text-[#0a0a0a]/60">
        Preview connector payloads for this approved artifact. No live writes. Google Classroom is
        blocked for PRISM-private material.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={dropboxState.status === "loading"}
          onClick={previewDropbox}
          className="gap-1.5"
        >
          <DatabaseZap className="h-3.5 w-3.5" />
          {dropboxState.status === "loading" ? "Previewing..." : "Preview Dropbox"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!classroomAllowed || classroomState.status === "loading"}
          onClick={previewClassroom}
          className="gap-1.5 disabled:opacity-50"
          title={
            classroomAllowed
              ? "Dry-run Google Classroom draft"
              : "PRISM-private artifacts cannot export to Classroom"
          }
        >
          <GraduationCap className="h-3.5 w-3.5" />
          {classroomState.status === "loading" ? "Previewing..." : "Preview Classroom"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={clickupState.status === "loading"}
          onClick={previewClickUp}
          className="gap-1.5"
        >
          <ListChecks className="h-3.5 w-3.5" />
          {clickupState.status === "loading" ? "Previewing..." : "Preview ClickUp"}
        </Button>
      </div>

      {!classroomAllowed ? (
        <p className="mt-2 text-[11px] text-amber-800/80">
          Classroom preview disabled: PRISM-private visibility cannot target Google Classroom.
        </p>
      ) : null}

      <PreviewResult label="Dropbox" state={dropboxState} />
      <PreviewResult label="Google Classroom" state={classroomState} />
      <PreviewResult label="ClickUp" state={clickupState} />
    </section>
  );
}

function PreviewResult({ label, state }) {
  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <p className="mt-3 text-xs text-[#0a0a0a]/55">
        {label}: preparing dry-run preview...
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-2">
        <div className="text-[11px] font-semibold text-rose-700">{label} preview failed</div>
        <p className="mt-1 text-xs text-rose-700/90">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2">
      <div className="text-[11px] font-semibold text-indigo-800">{label} dry-run preview</div>
      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-black/5 bg-white p-2 text-[10px] leading-5 text-[#0a0a0a]/80">
        {JSON.stringify(state.result, null, 2)}
      </pre>
    </div>
  );
}
