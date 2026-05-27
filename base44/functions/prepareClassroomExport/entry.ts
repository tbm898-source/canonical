import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  containsUnsafePublicText,
  nowIso,
  safeCreateConnectorRun,
  safeErrorMessage,
  validateClassification,
} from "../_shared/canonicalPolicy.ts";

async function loadPacket(base44: any, payload: Record<string, any>) {
  if (payload.packet_json) return payload.packet_json;
  if (!payload.packet_id) return null;
  const record = await base44.asServiceRole.entities.CanonicalGeneratedArtifact.get(payload.packet_id);
  return record?.generated_json || null;
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `classroom_dry_run_${Date.now()}`;

  try {
    const payload = await req.json();
    const base44 = createClientFromRequest(req);
    const packet = await loadPacket(base44, payload);

    if (!packet) {
      return Response.json({
        success: false,
        connector: "google_classroom",
        mode: "dry_run",
        classroom_draft: null,
        warnings: [],
        error: "A packet_id or packet_json is required for Classroom dry-run.",
      });
    }

    const classification = packet.packet_metadata || payload.classification || {};
    const validation = validateClassification(
      {
        ...classification,
        rail: "aya",
        visibility_scope: "aya_classroom",
        artifact_type: classification.artifact_type === "facilitator_overlay" ? "lesson_plan" : "classroom_post",
      },
      { target_service: "google_classroom", destination_scope: "aya_classroom" },
    );

    if (classification.visibility_scope === "prism_private" || classification.rail === "prism") {
      validation.errors.push("PRISM-private packets cannot be prepared for Google Classroom.");
    }

    if (containsUnsafePublicText(packet.facilitator_overlay) || containsUnsafePublicText(packet.ai_continuity_notes)) {
      validation.errors.push("Raw facilitator or AI continuity notes are not allowed in Classroom dry-run.");
    }

    if (validation.errors.length) {
      return Response.json({
        success: false,
        connector: "google_classroom",
        mode: "dry_run",
        classroom_draft: null,
        warnings: validation.warnings,
        error: validation.errors.join(" "),
      });
    }

    const draft = {
      title: packet.classroom_draft?.title || `${packet.packet_metadata?.session_title || "Session"} - Classroom Materials`,
      body:
        packet.classroom_draft?.body ||
        "Use the attached/session materials for today's AYA/CTS instructional work. Complete the reflection and evidence prompts before the end of class.",
      topic: payload.classroom_topic_hint || packet.classroom_draft?.topic || packet.packet_metadata?.module_key || "",
      materials: packet.classroom_draft?.materials || [],
      due_date: packet.classroom_draft?.due_date || null,
      visibility_scope: "aya_classroom",
      target_course_id: payload.target_course_id || "",
    };

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "google_classroom",
      function_name: "prepareClassroomExport",
      mode: "dry_run",
      status: "prepared",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: "Prepared a Google Classroom draft without posting live.",
      safe_metadata: {
        has_target_course_id: Boolean(payload.target_course_id),
        title: draft.title,
      },
      warnings: validation.warnings,
    });

    return Response.json({
      success: true,
      connector: "google_classroom",
      mode: "dry_run",
      classroom_draft: draft,
      warnings: validation.warnings,
      error: null,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        connector: "google_classroom",
        mode: "dry_run",
        classroom_draft: null,
        warnings: [],
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
