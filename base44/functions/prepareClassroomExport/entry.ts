import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const RAILS = ["canonical", "aya", "prism"];
const VISIBILITY_SCOPES = ["public_demo", "canonical_internal", "aya_classroom", "prism_private"];
const ARTIFACT_TYPES = [
  "lesson_plan",
  "student_packet",
  "instructor_guide",
  "quiz",
  "answer_key",
  "slide_outline",
  "classroom_post",
  "clickup_task_batch",
  "evidence_note",
  "facilitator_overlay",
  "ai_continuity_prompt",
  "manifest",
  "template",
  "SOP",
  "export_index",
  "packet_metadata",
];

const SAFE_TYPE_MATRIX: Record<string, Set<string>> = {
  "aya:aya_classroom": new Set([
    "lesson_plan",
    "student_packet",
    "instructor_guide",
    "quiz",
    "answer_key",
    "slide_outline",
    "classroom_post",
    "manifest",
  ]),
  "prism:prism_private": new Set([
    "facilitator_overlay",
    "ai_continuity_prompt",
    "evidence_note",
    "manifest",
    "lesson_plan",
    "instructor_guide",
  ]),
  "canonical:canonical_internal": new Set([
    "template",
    "SOP",
    "manifest",
    "lesson_plan",
    "instructor_guide",
    "evidence_note",
    "export_index",
    "packet_metadata",
    "slide_outline",
    "classroom_post",
    "clickup_task_batch",
  ]),
  "canonical:public_demo": new Set([
    "lesson_plan",
    "student_packet",
    "instructor_guide",
    "quiz",
    "answer_key",
    "slide_outline",
    "classroom_post",
    "clickup_task_batch",
    "evidence_note",
    "manifest",
    "packet_metadata",
  ]),
};

function nowIso() {
  return new Date().toISOString();
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (/token|secret|authorization|oauth|bearer/i.test(error.message)) {
      return "Connector request failed without exposing credentials.";
    }
    return error.message.slice(0, 240);
  }
  return "Unknown connector error.";
}

function containsUnsafePublicText(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return [
    /C:\\Users\\/i,
    /C:\/Users\//i,
    /\/Users\/[^/\s]+/i,
    /access[_-]?token/i,
    /refresh[_-]?token/i,
    /api[_-]?key/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /local_cursor_sdk/i,
    /AI_DRAFTS/i,
  ].some((pattern) => pattern.test(text));
}

function validateClassification(classification: Record<string, any> | null | undefined, options: Record<string, unknown> = {}) {
  const errors: string[] = [];
  const warnings = [...(classification?.warnings || [])];
  const required = ["rail", "visibility_scope", "artifact_type", "module_key", "session_key", "session_title", "session_date"];

  for (const field of required) {
    if (!classification?.[field]) errors.push(`Missing required classification field: ${field}`);
  }
  if (classification?.rail && !RAILS.includes(classification.rail)) errors.push(`Unsupported rail: ${classification.rail}`);
  if (classification?.visibility_scope && !VISIBILITY_SCOPES.includes(classification.visibility_scope)) {
    errors.push(`Unsupported visibility_scope: ${classification.visibility_scope}`);
  }
  if (classification?.artifact_type && !ARTIFACT_TYPES.includes(classification.artifact_type)) {
    errors.push(`Unsupported artifact_type: ${classification.artifact_type}`);
  }

  const matrixKey = `${classification?.rail}:${classification?.visibility_scope}`;
  const allowedTypes = SAFE_TYPE_MATRIX[matrixKey];
  if (!allowedTypes) {
    errors.push(`Unsafe rail/visibility combination: ${matrixKey}`);
  } else if (!allowedTypes.has(String(classification?.artifact_type))) {
    errors.push(`Artifact type ${classification?.artifact_type} is not allowed for ${matrixKey}`);
  }

  if (classification?.rail === "prism" && options.target_service === "google_classroom") {
    errors.push("PRISM-private material cannot be exported to Google Classroom.");
  }
  if (
    classification?.visibility_scope === "prism_private" &&
    ["aya_classroom", "public_demo"].includes(String(options.destination_scope || ""))
  ) {
    errors.push("PRISM-private material cannot be exported to AYA classroom or public demo scopes.");
  }

  return { ok: errors.length === 0, errors, warnings, destination_scope: classification?.visibility_scope || "" };
}

async function safeCreateConnectorRun(base44: any, data: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CanonicalConnectorRun.create(data);
  } catch (_error) {
    // Audit trail only: never fail user response on log-write issues.
  }
}

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
