// Owner-only live Google Classroom export for approved Owner Assistant artifacts (M8 slice 3).
// AYA / classroom-safe artifacts only. PRISM-private material is blocked.
// Uses Base44 google_classroom connector OAuth — not a browser API key.
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

const OWNER_ROLES = new Set(["admin", "owner"]);
const ALLOWED_EXPORT_READINESS = new Set(["ready_dry_run", "ready_live"]);
const CLASSROOM_SAFE_VISIBILITY = new Set(["aya_classroom", "public_demo"]);
const CLASSROOM_SAFE_RAILS = new Set(["aya", "canonical"]);

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
    connector: "google_classroom",
    mode: "owner_assistant_live_classroom",
    artifact: null,
    classroom: null,
    warnings: [] as string[],
    error: null as string | null,
    timestamp: nowIso(),
    validation_errors: [] as ValidationError[],
    ...extra,
  };
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
            "Owner-approved artifact from Canonical Assistant. Complete assigned work and evidence capture.",
          topic: moduleKey,
          materials: [],
          due_date: null,
          visibility_scope: "aya_classroom",
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
    classroom_draft: classroomDraft,
    export_manifest: {
      warnings: ["Live Google Classroom export from Owner Assistant approved artifact."],
      missing_artifacts: [],
      generated_at: artifact.generated_at || nowIso(),
    },
  };
}

function validateClassroomEligibility(classification: Record<string, any>) {
  const errors: string[] = [];

  if (classification.rail === "prism" || classification.visibility_scope === "prism_private") {
    errors.push("PRISM-private material cannot be exported to Google Classroom.");
  }
  if (!CLASSROOM_SAFE_RAILS.has(String(classification.rail || ""))) {
    errors.push(`Rail "${classification.rail}" is not eligible for Google Classroom live export.`);
  }
  if (!CLASSROOM_SAFE_VISIBILITY.has(String(classification.visibility_scope || ""))) {
    errors.push(
      `Visibility "${classification.visibility_scope}" is not classroom-safe. Use aya_classroom or public_demo artifacts only.`,
    );
  }

  return errors;
}

function buildClassroomDraft(packet: Record<string, any>, topicHint: string) {
  const meta = packet.packet_metadata || {};
  const draft = packet.classroom_draft || {};
  return {
    title:
      draft.title ||
      `${meta.session_title || "Session"} - Classroom Materials`,
    body:
      draft.body ||
      "Use the session materials for today's AYA/CTS instructional work. Complete the reflection and evidence prompts before the end of class.",
    topic: topicHint || draft.topic || meta.module_key || "",
    materials: draft.materials || [],
    due_date: draft.due_date || null,
    visibility_scope: "aya_classroom",
  };
}

async function safeCreateConnectorRun(base44: any, data: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CanonicalConnectorRun.create(data);
  } catch (_error) {
    // Audit trail only
  }
}

async function createClassroomCourseWork(
  accessToken: string,
  courseId: string,
  draft: Record<string, unknown>,
) {
  const payload: Record<string, unknown> = {
    title: String(draft.title || "Canonical session materials").slice(0, 500),
    description: String(draft.body || "").slice(0, 15000),
    workType: "ASSIGNMENT",
    state: "PUBLISHED",
  };

  const response = await fetch(
    `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let detail = `status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) detail = errorBody.error.message.slice(0, 200);
    } catch (_error) {
      // ignore parse errors
    }
    throw new Error(`Google Classroom courseWork create failed: ${detail}`);
  }

  const data = await response.json();
  return {
    course_work_id: data.id,
    course_id: courseId,
    alternate_link: data.alternateLink || "",
    title: data.title,
    state: data.state,
  };
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
  const targetCourseId = String(payload.target_course_id || "").trim();
  const classroomTopicHint = String(payload.classroom_topic_hint || "").trim();
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
      message: "confirm_live_write must be true before a live Google Classroom export.",
    });
  }
  if (!targetCourseId) {
    errors.push({
      field: "target_course_id",
      code: "missing",
      message: "target_course_id is required before live Google Classroom export.",
    });
  } else if (!/^[A-Za-z0-9_-]{5,}$/.test(targetCourseId)) {
    errors.push({
      field: "target_course_id",
      code: "invalid_format",
      message: "target_course_id must be the Google Classroom course ID from the course URL or API.",
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
          target_course_id: targetCourseId,
          classroom_topic_hint: classroomTopicHint,
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
      message: "Only approved artifacts can be exported to Google Classroom.",
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
    next_actions: ["review_classroom_post"],
  };
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `owner_assistant_classroom_${Date.now()}`;

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
    const classroomErrors = validateClassroomEligibility(classification);

    if (classroomErrors.length) {
      return Response.json(
        emptyEnvelope({
          error: classroomErrors.join(" "),
        }),
      );
    }

    const draft = buildClassroomDraft(packetJson, normalized.classroom_topic_hint);
    if (containsUnsafePublicText(draft) || containsUnsafePublicText(artifact.body_markdown)) {
      return Response.json(
        emptyEnvelope({
          error: "Unsafe public/classroom text detected. Export blocked.",
        }),
      );
    }

    let accessToken = "";
    try {
      const connection = await base44.asServiceRole.connectors.getConnection("google_classroom");
      accessToken = connection?.accessToken || "";
    } catch (_error) {
      accessToken = "";
    }

    if (!accessToken) {
      return Response.json(
        emptyEnvelope({
          error:
            "Google Classroom connector is not connected on this Base44 app. Connect Google Classroom in Base44 Integrations (OAuth). Browser API keys cannot post coursework.",
        }),
      );
    }

    const created = await createClassroomCourseWork(
      accessToken,
      normalized.target_course_id,
      draft,
    );

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "google_classroom",
      function_name: "exportOwnerApprovedArtifactToClassroom",
      mode: "owner_assistant_live_classroom",
      status: "saved",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: "Published classroom-safe coursework from an owner-approved artifact.",
      safe_metadata: {
        generation_artifact_id: artifact.generation_artifact_id,
        target_course_id: normalized.target_course_id,
        course_work_id: created.course_work_id,
      },
      warnings: [],
    });

    return Response.json({
      success: true,
      connector: "google_classroom",
      mode: "owner_assistant_live_classroom",
      artifact: applyExportTransition(artifact),
      classroom: {
        target_course_id: normalized.target_course_id,
        classroom_draft: draft,
        course_work: created,
      },
      warnings: [],
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
