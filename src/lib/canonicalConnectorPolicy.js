export const CONNECTOR_MODES = {
  DEMO: "demo",
  OWNER_PREVIEW: "owner_preview",
  OWNER_LIVE_DROPBOX: "owner_live_dropbox",
  OWNER_LIVE_ADAPTERS: "owner_live_adapters",
};

export const CONNECTOR_STATES = [
  "idle",
  "checking",
  "discovered",
  "needs_owner_approval",
  "ready",
  "blocked",
  "saving",
  "saved",
  "preparing",
  "prepared",
  "error",
];

export const RAILS = ["canonical", "aya", "prism"];

export const VISIBILITY_SCOPES = [
  "public_demo",
  "canonical_internal",
  "aya_classroom",
  "prism_private",
];

export const ARTIFACT_TYPES = [
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

const SAFE_TYPE_MATRIX = {
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

export function createDefaultClassification(brief, mode = CONNECTOR_MODES.DEMO) {
  const demo = mode === CONNECTOR_MODES.DEMO;
  return {
    rail: "canonical",
    visibility_scope: demo ? "public_demo" : "canonical_internal",
    artifact_type: "lesson_plan",
    module_key: brief.module_key || "EDM101",
    session_key: brief.session_key || "",
    session_title: brief.session_title || "Untitled instructional session",
    session_date: brief.session_date || "",
    warnings: demo
      ? ["Demo packet is local preview only. No connector actions are allowed."]
      : ["Owner packet is draft until reviewed and approved."],
  };
}

export function getSafeTypeMatrixKey(classification) {
  return `${classification?.rail}:${classification?.visibility_scope}`;
}

export function validateClassification(classification, options = {}) {
  const errors = [];
  const warnings = [...(classification?.warnings || [])];
  const required = [
    "rail",
    "visibility_scope",
    "artifact_type",
    "module_key",
    "session_key",
    "session_title",
    "session_date",
  ];

  for (const field of required) {
    if (!classification?.[field]) errors.push(`Missing required classification field: ${field}`);
  }

  if (classification?.rail && !RAILS.includes(classification.rail)) {
    errors.push(`Unsupported rail: ${classification.rail}`);
  }

  if (
    classification?.visibility_scope &&
    !VISIBILITY_SCOPES.includes(classification.visibility_scope)
  ) {
    errors.push(`Unsupported visibility_scope: ${classification.visibility_scope}`);
  }

  if (classification?.artifact_type && !ARTIFACT_TYPES.includes(classification.artifact_type)) {
    errors.push(`Unsupported artifact_type: ${classification.artifact_type}`);
  }

  const matrixKey = getSafeTypeMatrixKey(classification);
  const allowedTypes = SAFE_TYPE_MATRIX[matrixKey];
  if (!allowedTypes) {
    errors.push(
      `Unsafe rail/visibility combination: ${classification?.rail || "missing"} + ${
        classification?.visibility_scope || "missing"
      }`,
    );
  } else if (!allowedTypes.has(classification.artifact_type)) {
    errors.push(
      `Artifact type ${classification.artifact_type} is not allowed for ${matrixKey}`,
    );
  }

  if (classification?.rail === "prism" && options.target_service === "google_classroom") {
    errors.push("PRISM-private material cannot be exported to Google Classroom.");
  }

  if (
    classification?.visibility_scope === "prism_private" &&
    ["aya_classroom", "public_demo"].includes(options.destination_scope)
  ) {
    errors.push("PRISM-private material cannot be exported to AYA classroom or public demo scopes.");
  }

  if (options.mode === CONNECTOR_MODES.DEMO && options.connectorCall) {
    errors.push("Demo mode cannot call backend connectors.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    destination_scope: classification?.visibility_scope || "",
  };
}

export function containsUnsafePublicText(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  const patterns = [
    /C:\\Users\\/i,
    /C:\/Users\//i,
    /\/Users\/[^/\s]+/i,
    /access[_-]?token/i,
    /refresh[_-]?token/i,
    /api[_-]?key/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /local_cursor_sdk/i,
    /AI_DRAFTS/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

export function buildExportManifest({
  artifact_id,
  classification,
  saved_at = null,
  destination_path = "",
  saved_files = [],
  classroom_draft_status = "prepared",
  clickup_draft_status = "prepared",
  warnings = [],
}) {
  return {
    artifact_id,
    module_key: classification.module_key,
    session_key: classification.session_key,
    session_title: classification.session_title,
    session_date: classification.session_date,
    rail: classification.rail,
    visibility_scope: classification.visibility_scope,
    artifact_type: classification.artifact_type,
    generated_at: new Date().toISOString(),
    saved_at,
    destination_path,
    saved_files,
    classroom_draft_status,
    clickup_draft_status,
    warnings,
    generator_version: "canonical-connector-spine-v2",
  };
}
