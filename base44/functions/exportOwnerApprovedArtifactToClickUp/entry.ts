// Owner-only live ClickUp export for approved Owner Assistant artifacts (Milestone 8 slice 2).
// Validates owner/admin, approved artifact envelope, target list id, then creates curated tasks.
// Google Classroom live writes remain deferred to M8 slice 3.
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
const MAX_LIVE_TASKS = 3;

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
    connector: "clickup",
    mode: "owner_assistant_live_clickup",
    artifact: null,
    clickup: null,
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
    instructor_materials: [],
    student_materials: [],
    slide_outline: [],
    classroom_draft: null,
    clickup_task_candidates: [
      {
        id: "review_approved_artifact",
        name: `Review ${outputType} — ${moduleKey}`,
        description: `Owner-approved artifact ${artifact.generation_artifact_id} linked to plan ${artifact.generation_plan_id}.`,
        tags: [rail, "review", "owner-assistant"],
      },
    ],
    export_manifest: {
      warnings: ["Live ClickUp export from Owner Assistant approved artifact."],
      missing_artifacts: [],
      generated_at: artifact.generated_at || nowIso(),
    },
  };
}

function task(title: string, tag: string, source: string) {
  return {
    name: title,
    description: source,
    tags: [tag, "canonical-program-helper"],
  };
}

function buildTaskCandidates(packet: Record<string, any>) {
  const candidates = [
    ...(packet.clickup_task_candidates || []),
    ...(packet.export_manifest?.warnings || []).slice(0, 1).map((item: string) =>
      task(`Review warning: ${item}`, "review", item),
    ),
  ];

  if (!candidates.length) {
    candidates.push(
      task(
        `Review ${packet.packet_metadata?.session_title || "generated session"} packet`,
        "review",
        "No explicit task candidates were included, so create a review task candidate.",
      ),
    );
  }

  return candidates.slice(0, MAX_LIVE_TASKS).map((candidate: Record<string, unknown>, index: number) => ({
    id: candidate.id || `candidate_${index + 1}`,
    name: String(candidate.name || candidate.title || `Task candidate ${index + 1}`).slice(0, 180),
    description: String(candidate.description || "").slice(0, 1200),
    tags: Array.isArray(candidate.tags) ? candidate.tags.map(String).slice(0, 8) : ["review"],
  }));
}

async function safeCreateConnectorRun(base44: any, data: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CanonicalConnectorRun.create(data);
  } catch (_error) {
    // Audit trail only
  }
}

async function createClickUpTask(
  accessToken: string,
  listId: string,
  candidate: { name: string; description: string; tags: string[] },
) {
  const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: "POST",
    headers: {
      Authorization: accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: candidate.name,
      description: candidate.description,
      tags: candidate.tags,
    }),
  });

  if (!response.ok) {
    throw new Error(`ClickUp task creation failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    task_id: data.id,
    task_url: data.url,
    name: data.name,
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
  const targetListId = String(payload.target_list_id || "").trim();
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
      message: "confirm_live_write must be true before a live ClickUp export.",
    });
  }
  if (!targetListId) {
    errors.push({
      field: "target_list_id",
      code: "missing",
      message: "target_list_id is required before live ClickUp export.",
    });
  } else if (!/^\d{6,}$/.test(targetListId)) {
    errors.push({
      field: "target_list_id",
      code: "invalid_format",
      message: "target_list_id must be a numeric ClickUp list ID from the list URL, not the list name.",
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
          target_list_id: targetListId,
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
      message: "Only approved artifacts can be exported to ClickUp.",
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
    next_actions: ["export_classroom_live"],
  };
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `owner_assistant_clickup_${Date.now()}`;

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

    const candidates = buildTaskCandidates(packetJson);
    for (const candidate of candidates) {
      if (containsUnsafePublicText(candidate)) {
        return Response.json(
          emptyEnvelope({
            error: "Unsafe text detected in ClickUp task candidate. Export blocked.",
          }),
        );
      }
    }

    if (classification.visibility_scope === "prism_private") {
      for (const candidate of candidates) {
        const combined = `${candidate.name}\n${candidate.description}`;
        if (combined.length > 1400) {
          return Response.json(
            emptyEnvelope({
              error: "PRISM-private ClickUp tasks must use short curated summaries only.",
            }),
          );
        }
      }
    }

    let accessToken = "";
    try {
      const connection = await base44.asServiceRole.connectors.getConnection("clickup");
      accessToken = connection?.accessToken || "";
    } catch (_error) {
      accessToken = "";
    }
    if (!accessToken) {
      return Response.json(
        emptyEnvelope({
          error:
            "ClickUp connector is not connected on this Base44 app. Connect ClickUp in Base44 Integrations, then retry.",
        }),
      );
    }

    const createdTasks = [];
    const warnings: string[] = [];

    for (const candidate of candidates) {
      try {
        const created = await createClickUpTask(accessToken, normalized.target_list_id, candidate);
        createdTasks.push({
          candidate_id: candidate.id,
          ...created,
          tags: candidate.tags,
          dry_run: false,
        });
      } catch (error) {
        warnings.push(`Failed to create task "${candidate.name}": ${safeErrorMessage(error)}`);
      }
    }

    if (!createdTasks.length) {
      return Response.json(
        emptyEnvelope({
          error: warnings.join(" ") || "No ClickUp tasks were created.",
          warnings,
        }),
      );
    }

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "clickup",
      function_name: "exportOwnerApprovedArtifactToClickUp",
      mode: "owner_assistant_live_clickup",
      status: "saved",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: "Created curated ClickUp review tasks from an owner-approved artifact.",
      safe_metadata: {
        generation_artifact_id: artifact.generation_artifact_id,
        target_list_id: normalized.target_list_id,
        created_task_count: createdTasks.length,
      },
      warnings,
    });

    return Response.json({
      success: true,
      connector: "clickup",
      mode: "owner_assistant_live_clickup",
      artifact: applyExportTransition(artifact),
      clickup: {
        target_list_id: normalized.target_list_id,
        created_tasks: createdTasks,
      },
      warnings,
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
