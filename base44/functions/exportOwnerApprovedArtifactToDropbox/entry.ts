// Owner-only live Dropbox export for approved Owner Assistant artifacts (Milestone 8 slice 1).
// Validates owner/admin, approved artifact envelope, accepted spine map, then writes packet files.
// ClickUp and Classroom live writes remain deferred to later M8 slices.
//
// Inlined helpers below (Base44 deploy cannot resolve ../_shared/ imports).
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const OUTPUT_TYPE_TO_ARTIFACT_TYPE: Record<string, string> = {
  daily_run: "lesson_plan",
  slide_outline: "slide_outline",
  student_handout: "student_packet",
  quiz: "quiz",
  instructor_guide: "instructor_guide",
  evidence_checklist: "evidence_note",
  google_classroom_export: "classroom_post",
  prism_facilitator_overlay: "facilitator_overlay",
};

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

const OWNER_ROLES = new Set(["admin", "owner"]);
const ALLOWED_EXPORT_READINESS = new Set(["ready_dry_run", "ready_live"]);

function nowIso() {
  return new Date().toISOString();
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (/token|secret|authorization|oauth|bearer/i.test(error.message)) {
      return "Backend request failed without exposing credentials.";
    }
    return error.message.slice(0, 240);
  }
  return "Unknown backend error.";
}

function rolesRecordList(response: any) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.records)) return response.records;
  return [];
}

function collectRoles(value: unknown, key = "", roles: string[] = []) {
  const roleKeys = new Set([
    "role",
    "roles",
    "portal_role",
    "app_role",
    "app_roles",
    "app_user_role",
    "user_role",
    "permissions",
  ]);
  const ownerFlagKeys = new Set(["is_admin", "admin", "isOwner", "is_owner"]);

  if (value == null) return roles;
  if (typeof value === "boolean" && ownerFlagKeys.has(key) && value) {
    roles.push("admin");
    return roles;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    if (roleKeys.has(key)) roles.push(String(value));
    return roles;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectRoles(item, key, roles));
    return roles;
  }
  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([nextKey, nextValue]) =>
      collectRoles(nextValue, nextKey, roles),
    );
  }
  return roles;
}

async function requireOwnerAdmin(base44: any) {
  const currentUser = await base44.auth.me();
  const email = String(currentUser?.email || "").toLowerCase();
  const roleSources: unknown[] = [currentUser];

  if (email) {
    try {
      const matchingUsers = await base44.asServiceRole.entities.User.filter(
        { email },
        "-updated_date",
        5,
      );
      const appUser =
        rolesRecordList(matchingUsers).find(
          (record: Record<string, unknown>) =>
            String(record?.email || "").toLowerCase() === email,
        ) || rolesRecordList(matchingUsers)[0];
      if (appUser) roleSources.push(appUser);
    } catch (_error) {
      // role enrichment is best-effort
    }
  }

  const roles = roleSources
    .flatMap((source) => collectRoles(source))
    .map((role) => role.toLowerCase());
  if (!roles.some((role) => OWNER_ROLES.has(role))) {
    throw new Error("Owner/admin role required for this backend action.");
  }

  return { email, roles: [...new Set(roles)] };
}

type ValidationError = {
  field: string;
  code?: string;
  message: string;
};

function emptyEnvelope(extra: Record<string, unknown> = {}) {
  return {
    success: false,
    connector: "dropbox",
    mode: "owner_assistant_live_dropbox",
    artifact: null,
    dropbox: null,
    warnings: [] as string[],
    error: null as string | null,
    timestamp: nowIso(),
    validation_errors: [] as ValidationError[],
    ...extra,
  };
}

function artifactToPacketJson(artifact: Record<string, any>) {
  const outputType = String(artifact.profile?.output_type || "lesson_plan");
  const artifactType = OUTPUT_TYPE_TO_ARTIFACT_TYPE[outputType] || "lesson_plan";
  const moduleKey = String(artifact.module_key || "MODULE_PENDING");
  const programKey = String(artifact.program_key || "PROGRAM_PENDING");
  const sessionKey = `${moduleKey}_OWNER_ASSISTANT`;
  const bodyMarkdown = String(artifact.body_markdown || "");
  const rail = String(artifact.rail || "canonical");
  const visibilityScope = String(artifact.visibility_scope || "canonical_internal");

  const classroomDraft =
    artifact.body_json && typeof artifact.body_json === "object"
      ? artifact.body_json
      : {
          title: `${programKey} — ${outputType.replace(/_/g, " ")}`,
          body:
            bodyMarkdown.slice(0, 1200) ||
            "Owner-approved artifact from Canonical Assistant.",
          topic: moduleKey,
          materials: [],
          due_date: null,
          visibility_scope: visibilityScope === "prism_private" ? "aya_classroom" : visibilityScope,
        };

  return {
    packet_metadata: {
      rail,
      visibility_scope: visibilityScope,
      artifact_type: artifactType,
      program_key: programKey,
      module_key: moduleKey,
      session_key: sessionKey,
      session_title: `${programKey} / ${moduleKey}`,
      session_date: new Date().toISOString().slice(0, 10),
      generation_artifact_id: artifact.generation_artifact_id,
      generation_plan_id: artifact.generation_plan_id,
      output_type: outputType,
      review_status: artifact.review_status,
      export_readiness_status: artifact.export_readiness_status,
      warnings: [],
    },
    instructor_materials:
      outputType === "student_handout" || outputType === "quiz"
        ? []
        : [bodyMarkdown].filter(Boolean),
    student_materials:
      outputType === "student_handout" || outputType === "quiz" ? [bodyMarkdown].filter(Boolean) : [],
    slide_outline: outputType === "slide_outline" ? bodyMarkdown.split("\n").filter(Boolean) : [],
    classroom_draft: classroomDraft,
    clickup_task_candidates: [
      {
        id: "review_approved_artifact",
        name: `Review ${outputType} — ${moduleKey}`,
        description: `Owner-approved artifact ${artifact.generation_artifact_id} linked to plan ${artifact.generation_plan_id}.`,
        tags: [rail, "review", "owner-assistant"],
      },
    ],
    export_manifest: {
      warnings: ["Live Dropbox export from Owner Assistant approved artifact."],
      missing_artifacts: [],
      generated_at: artifact.generated_at || nowIso(),
    },
  };
}

function validateClassification(classification: Record<string, any> | null | undefined) {
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
    if (!classification?.[field]) errors.push(`Missing required classification field: ${field}`);
  }
  if (classification?.rail && !RAILS.includes(classification.rail)) {
    errors.push(`Unsupported rail: ${classification.rail}`);
  }
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

  return { ok: errors.length === 0, errors, warnings };
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

function joinDropboxPath(...parts: string[]) {
  const normalized = parts
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return normalized ? `/${normalized}` : "";
}

function normalizeDropboxPath(value: string) {
  const normalized = String(value || "")
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/+$/g, "")
    .toLowerCase();
  return normalized && !normalized.startsWith("/") ? `/${normalized}` : normalized;
}

function filenameToken(value: string) {
  return (
    String(value || "artifact")
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 90) || "artifact"
  );
}

async function uploadDropboxFile(accessToken: string, path: string, content: string) {
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path,
        mode: "add",
        autorename: true,
        mute: true,
        strict_conflict: false,
      }),
    },
    body: content,
  });

  if (!response.ok) {
    throw new Error(`Dropbox upload failed with status ${response.status}`);
  }

  const metadata = await response.json();
  return metadata.path_display || path;
}

async function safeCreateConnectorRun(base44: any, data: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CanonicalConnectorRun.create(data);
  } catch (_error) {
    // Audit trail only
  }
}

function validateExportRequest(payload: any) {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== "object") {
    errors.push({
      field: "(root)",
      code: "invalid_request",
      message: "Request body must be a JSON object.",
    });
    return { errors, normalized: null };
  }

  const generationArtifactId = String(payload.generation_artifact_id || "").trim();
  const generationPlanId = String(payload.generation_plan_id || "").trim();
  const confirmLiveWrite = payload.confirm_live_write === true;
  const canonicalSpineMapId = String(payload.canonical_spine_map_id || "").trim();
  const approvedDestinationPath = String(payload.approved_destination_path || "").trim();
  const acceptedSpineMap =
    payload.accepted_spine_map && typeof payload.accepted_spine_map === "object"
      ? payload.accepted_spine_map
      : null;
  const artifact = payload.artifact;

  if (!generationArtifactId) {
    errors.push({
      field: "generation_artifact_id",
      code: "missing",
      message: "generation_artifact_id is required.",
    });
  }
  if (!generationPlanId) {
    errors.push({
      field: "generation_plan_id",
      code: "missing",
      message: "generation_plan_id is required.",
    });
  }
  if (!artifact || typeof artifact !== "object") {
    errors.push({
      field: "artifact",
      code: "missing",
      message: "artifact envelope is required.",
    });
  }
  if (!confirmLiveWrite) {
    errors.push({
      field: "confirm_live_write",
      code: "must_be_true",
      message: "confirm_live_write must be true before a live Dropbox export.",
    });
  }
  if (!canonicalSpineMapId && !acceptedSpineMap?.accepted_by_owner && !approvedDestinationPath) {
    errors.push({
      field: "canonical_spine_map_id",
      code: "missing",
      message:
        "An accepted CANONICAL spine map or an approved destination path is required before live Dropbox export.",
    });
  }

  return {
    errors,
    normalized: errors.length
      ? null
      : {
          generation_artifact_id: generationArtifactId,
          generation_plan_id: generationPlanId,
          artifact,
          confirm_live_write: confirmLiveWrite,
          canonical_spine_map_id: canonicalSpineMapId,
          approved_destination_path: approvedDestinationPath,
          accepted_spine_map: acceptedSpineMap,
        },
  };
}

function validateArtifactForExport(
  normalized: NonNullable<ReturnType<typeof validateExportRequest>["normalized"]>,
) {
  const errors: ValidationError[] = [];
  const artifact = normalized.artifact as Record<string, unknown>;

  if (String(artifact.generation_artifact_id || "") !== normalized.generation_artifact_id) {
    errors.push({
      field: "generation_artifact_id",
      code: "artifact_id_mismatch",
      message: "generation_artifact_id does not match artifact.generation_artifact_id.",
    });
  }
  if (String(artifact.generation_plan_id || "") !== normalized.generation_plan_id) {
    errors.push({
      field: "generation_plan_id",
      code: "plan_id_mismatch",
      message: "generation_plan_id does not match artifact.generation_plan_id.",
    });
  }
  if (String(artifact.review_status || "") !== "approved") {
    errors.push({
      field: "artifact.review_status",
      code: "not_approved",
      message: "Only approved artifacts can be exported to Dropbox.",
    });
  }
  const exportReadiness = String(artifact.export_readiness_status || "");
  if (!ALLOWED_EXPORT_READINESS.has(exportReadiness)) {
    errors.push({
      field: "artifact.export_readiness_status",
      code: "not_ready",
      message: `Artifact export readiness "${exportReadiness}" is not eligible for live export.`,
    });
  }

  const contractValidation = artifact.contract_validation as
    | { missing_sections?: string[] }
    | undefined;
  if (
    Array.isArray(contractValidation?.missing_sections) &&
    contractValidation.missing_sections.length > 0
  ) {
    errors.push({
      field: "artifact.contract_validation",
      code: "missing_sections",
      message: `Cannot export artifact with missing contract sections: ${contractValidation.missing_sections.join(", ")}.`,
    });
  }

  return errors;
}

function applyExportTransition(artifact: Record<string, unknown>) {
  return {
    ...artifact,
    export_readiness_status: "ready_live",
    capability_label: "Live write enabled",
    next_actions: ["export_clickup_live", "export_classroom_live"],
  };
}

async function resolveAcceptedSpineMap(base44: any, normalized: {
  canonical_spine_map_id: string;
  approved_destination_path: string;
  accepted_spine_map: Record<string, unknown> | null;
}) {
  if (normalized.accepted_spine_map?.accepted_by_owner) {
    return normalized.accepted_spine_map;
  }

  if (
    normalized.canonical_spine_map_id &&
    !normalized.canonical_spine_map_id.startsWith("stateless_")
  ) {
    try {
      const spineMap = await base44.asServiceRole.entities.CanonicalSpineMap.get(
        normalized.canonical_spine_map_id,
      );
      if (spineMap?.accepted_by_owner) return spineMap;
    } catch (_error) {
      // fall through to manual path handling
    }
  }

  if (normalized.approved_destination_path) {
    return {
      accepted_by_owner: true,
      recommended_paths: {},
      manual_destination_path: normalized.approved_destination_path,
    };
  }

  return null;
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `owner_assistant_dropbox_${Date.now()}`;

  try {
    const base44 = createClientFromRequest(req);

    try {
      await requireOwnerAdmin(base44);
    } catch (error) {
      return Response.json(
        emptyEnvelope({ error: safeErrorMessage(error) }),
        { status: 403 },
      );
    }

    const payload = await req.json().catch(() => ({}));
    const { errors: structuralErrors, normalized } = validateExportRequest(payload);
    const artifactErrors = normalized ? validateArtifactForExport(normalized) : [];
    const validationErrors = [...structuralErrors, ...artifactErrors];

    if (validationErrors.length || !normalized) {
      return Response.json(
        emptyEnvelope({
          validation_errors: validationErrors,
          error: validationErrors[0]?.message || "Export request failed validation.",
        }),
      );
    }

    const artifact = normalized.artifact as Record<string, any>;
    const packetJson = artifactToPacketJson(artifact);
    const classification = packetJson.packet_metadata;
    const validation = validateClassification(classification);

    if (!validation.ok) {
      return Response.json(
        emptyEnvelope({
          error: validation.errors.join(" "),
          warnings: validation.warnings,
        }),
      );
    }

    if (
      ["public_demo", "aya_classroom"].includes(String(classification.visibility_scope)) &&
      (containsUnsafePublicText(packetJson) || containsUnsafePublicText(artifact.body_markdown))
    ) {
      return Response.json(
        emptyEnvelope({
          error: "Unsafe public/classroom text detected. Export blocked.",
        }),
      );
    }

    const spineMap = await resolveAcceptedSpineMap(base44, normalized);
    if (!spineMap?.accepted_by_owner) {
      return Response.json(
        emptyEnvelope({
          error: "Destination requires an owner-accepted CANONICAL spine map.",
        }),
      );
    }

    const recommendedPath =
      spineMap?.recommended_paths?.[classification.visibility_scope] ||
      spineMap?.recommended_artifact_paths?.[classification.visibility_scope] ||
      "";
    const destinationPath =
      normalized.approved_destination_path ||
      recommendedPath ||
      String(spineMap.manual_destination_path || "");

    if (!destinationPath) {
      return Response.json(
        emptyEnvelope({
          error: "No approved Dropbox destination path could be resolved for this visibility scope.",
        }),
      );
    }

    if (
      recommendedPath &&
      !normalizeDropboxPath(destinationPath).startsWith(normalizeDropboxPath(recommendedPath))
    ) {
      return Response.json(
        emptyEnvelope({
          error: "Approved destination does not match the accepted CANONICAL spine map.",
        }),
      );
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("dropbox");
    if (!accessToken) {
      return Response.json(
        emptyEnvelope({
          error: "Dropbox connector is not available.",
        }),
      );
    }

    const packetMarkdown = String(artifact.body_markdown || "");
    const artifactId = String(artifact.generation_artifact_id);
    const baseName = filenameToken(
      `${classification.module_key}_${classification.session_key}_${classification.artifact_type}`,
    );

    const jsonPath = joinDropboxPath(destinationPath, `${baseName}.json`);
    const markdownPath = joinDropboxPath(destinationPath, `${baseName}.md`);

    const savedJsonPath = await uploadDropboxFile(
      accessToken,
      jsonPath,
      JSON.stringify(packetJson, null, 2),
    );
    const savedMarkdownPath = await uploadDropboxFile(accessToken, markdownPath, packetMarkdown);

    const savedAt = nowIso();
    const manifest = {
      artifact_id: artifactId,
      module_key: classification.module_key,
      session_key: classification.session_key,
      session_title: classification.session_title,
      session_date: classification.session_date,
      rail: classification.rail,
      visibility_scope: classification.visibility_scope,
      artifact_type: classification.artifact_type,
      generated_at: nowIso(),
      saved_at: savedAt,
      destination_path: destinationPath,
      saved_files: [savedJsonPath, savedMarkdownPath],
      export_source: "owner_assistant_live_dropbox",
      warnings: validation.warnings,
      generator_version: "canonical-owner-assistant-m8",
    };
    const manifestPath = joinDropboxPath(destinationPath, `${baseName}_manifest.json`);
    const savedManifestPath = await uploadDropboxFile(
      accessToken,
      manifestPath,
      JSON.stringify(manifest, null, 2),
    );

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "dropbox",
      function_name: "exportOwnerApprovedArtifactToDropbox",
      mode: "owner_assistant_live_dropbox",
      status: "saved",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary:
        "Saved owner-approved artifact packet JSON, Markdown, and manifest to Dropbox.",
      safe_metadata: {
        generation_artifact_id: artifactId,
        destination_path: destinationPath,
        saved_file_count: 3,
      },
      warnings: validation.warnings,
    });

    const dropbox = {
      saved_files: [savedJsonPath, savedMarkdownPath, savedManifestPath],
      destination_path: destinationPath,
      manifest_path: savedManifestPath,
    };

    return Response.json({
      success: true,
      connector: "dropbox",
      mode: "owner_assistant_live_dropbox",
      artifact: applyExportTransition(artifact),
      dropbox,
      warnings: validation.warnings,
      error: null,
      timestamp: nowIso(),
      validation_errors: [],
    });
  } catch (error) {
    return Response.json(
      emptyEnvelope({
        error: safeErrorMessage(error),
      }),
      { status: 200 },
    );
  }
});
