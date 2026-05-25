export const CONNECTOR_MODES = {
  DEMO: "demo",
  OWNER_PREVIEW: "owner_preview",
  OWNER_LIVE_DROPBOX: "owner_live_dropbox",
  OWNER_LIVE_ADAPTERS: "owner_live_adapters",
} as const;

export const CONNECTOR_TYPES = ["dropbox", "google_classroom", "clickup", "gmail"] as const;

export const EXPECTED_SPINE_FOLDERS = [
  "CANONICAL",
  "00_ADMIN",
  "00_MASTERS",
  "00_START_HERE",
  "00_STUDENT_PACKET",
  "00_SUBSTITUTE",
  "01_Curriculum_Canonical",
  "02_Instructor_Resources",
  "03_Cohort_Evidence",
  "04_Exports",
  "05_Manifests",
  "06_Workbench_Drafts",
  "07_Classroom_Ready",
  "08_ClickUp_Ready",
  "09_PRISM_Private",
  "90_REVIEW",
  "99_UNSORTED",
  "99_PROCESSED",
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

export type Classification = {
  rail?: string;
  visibility_scope?: string;
  artifact_type?: string;
  module_key?: string;
  session_key?: string;
  session_title?: string;
  session_date?: string;
  warnings?: string[];
};

export function nowIso() {
  return new Date().toISOString();
}

export function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (/token|secret|authorization|oauth|bearer/i.test(error.message)) {
      return "Connector request failed without exposing credentials.";
    }
    return error.message.slice(0, 240);
  }
  return "Unknown connector error.";
}

export function validateClassification(
  classification: Classification | null | undefined,
  options: Record<string, unknown> = {},
) {
  const errors: string[] = [];
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
    if (!classification?.[field as keyof Classification]) {
      errors.push(`Missing required classification field: ${field}`);
    }
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

export function containsUnsafePublicText(value: unknown) {
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

export function joinDropboxPath(...parts: string[]) {
  const normalized = parts
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return normalized ? `/${normalized}` : "";
}

export function filenameToken(value: string) {
  return String(value || "artifact")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90) || "artifact";
}

export function buildManifest({
  artifact_id,
  classification,
  saved_at,
  destination_path,
  saved_files,
  warnings,
}: {
  artifact_id: string;
  classification: Required<Classification>;
  saved_at: string | null;
  destination_path: string;
  saved_files: string[];
  warnings: string[];
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
    generated_at: nowIso(),
    saved_at,
    destination_path,
    saved_files,
    classroom_draft_status: "prepared",
    clickup_draft_status: "prepared",
    warnings,
    generator_version: "canonical-connector-spine-v2",
  };
}

export async function safeCreateConnectorRun(base44: any, data: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CanonicalConnectorRun.create(data);
  } catch (_error) {
    // Connector run records are audit aids. They must never cause the user-facing
    // connector function to fail or expose backend details.
  }
}
