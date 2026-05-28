// Owner-only artifact review gate (Milestone 4).
//
// Stateless review transition: draft -> approved | rejected.
// Does NOT persist artifacts (entity API unavailable). Client holds the
// artifact envelope and sends it back for validated status transition.
// No file writes, no connector calls, no LLM.
//
// Inlined helpers below (Base44 deploy cannot resolve ../_shared/ imports).
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

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

const OWNER_ROLES = new Set(["admin", "owner"]);

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

const ALLOWED_REVIEW_ACTIONS = new Set(["approve", "reject"]);
const ALLOWED_REVIEW_STATUSES = new Set(["draft", "approved", "rejected", "needs_review"]);

function emptyEnvelope(extra: Record<string, unknown> = {}) {
  return {
    success: false,
    artifact: null,
    warnings: [] as string[],
    error: null as string | null,
    timestamp: nowIso(),
    validation_errors: [] as ValidationError[],
    ...extra,
  };
}

function validateReviewRequest(payload: any) {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== "object") {
    errors.push({
      field: "(root)",
      code: "invalid_request",
      message: "Request body must be a JSON object.",
    });
    return { errors, normalized: null };
  }

  const reviewAction = String(payload.review_action || "").trim().toLowerCase();
  const generationArtifactId = String(payload.generation_artifact_id || "").trim();
  const generationPlanId = String(payload.generation_plan_id || "").trim();
  const confirmDryRun = payload.confirm_dry_run === true;
  const artifact = payload.artifact;

  if (!reviewAction) {
    errors.push({ field: "review_action", code: "missing", message: "review_action is required." });
  } else if (!ALLOWED_REVIEW_ACTIONS.has(reviewAction)) {
    errors.push({
      field: "review_action",
      code: "invalid_value",
      message: 'review_action must be "approve" or "reject".',
    });
  }

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
      message: "artifact envelope is required for stateless review.",
    });
  }

  if (!confirmDryRun) {
    errors.push({
      field: "confirm_dry_run",
      code: "must_be_true",
      message: "confirm_dry_run must be true. Review transitions are dry-run only in Milestone 4.",
    });
  }

  return {
    errors,
    normalized: errors.length
      ? null
      : {
          review_action: reviewAction as "approve" | "reject",
          generation_artifact_id: generationArtifactId,
          generation_plan_id: generationPlanId,
          artifact,
          confirm_dry_run: confirmDryRun,
        },
  };
}

function validateArtifactForReview(
  normalized: NonNullable<ReturnType<typeof validateReviewRequest>["normalized"]>,
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

  const currentStatus = String(artifact.review_status || "");
  if (!ALLOWED_REVIEW_STATUSES.has(currentStatus)) {
    errors.push({
      field: "artifact.review_status",
      code: "invalid_status",
      message: `artifact.review_status "${currentStatus}" is not a known review status.`,
    });
  } else if (currentStatus !== "draft") {
    errors.push({
      field: "artifact.review_status",
      code: "invalid_transition",
      message: `Only artifacts in "draft" status can be reviewed. Current status: "${currentStatus}".`,
    });
  }

  const contractValidation = artifact.contract_validation as
    | { missing_sections?: string[] }
    | undefined;
  if (
    normalized.review_action === "approve" &&
    Array.isArray(contractValidation?.missing_sections) &&
    contractValidation.missing_sections.length > 0
  ) {
    errors.push({
      field: "artifact.contract_validation",
      code: "missing_sections",
      message: `Cannot approve artifact with missing contract sections: ${contractValidation.missing_sections.join(", ")}.`,
    });
  }

  return errors;
}

function applyReviewTransition(
  artifact: Record<string, unknown>,
  reviewAction: "approve" | "reject",
) {
  const reviewedAt = nowIso();
  if (reviewAction === "approve") {
    return {
      ...artifact,
      review_status: "approved",
      export_readiness_status: "ready_dry_run",
      reviewed_at: reviewedAt,
      capability_label: "Dry-run available",
      next_actions: ["preview_export_dry_run"],
    };
  }
  return {
    ...artifact,
    review_status: "rejected",
    export_readiness_status: "not_ready",
    reviewed_at: reviewedAt,
    capability_label: "Backend wired",
    next_actions: ["revise_plan_or_regenerate"],
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    try {
      await requireOwnerAdmin(base44);
    } catch (error) {
      return Response.json(
        emptyEnvelope({
          error: safeErrorMessage(error),
        }),
        { status: 403 },
      );
    }

    const payload = await req.json().catch(() => ({}));
    const { errors: structuralErrors, normalized } = validateReviewRequest(payload);
    const artifactErrors = normalized ? validateArtifactForReview(normalized) : [];
    const validationErrors = [...structuralErrors, ...artifactErrors];

    if (validationErrors.length || !normalized) {
      return Response.json(
        emptyEnvelope({
          validation_errors: validationErrors,
        }),
        { status: 200 },
      );
    }

    const updatedArtifact = applyReviewTransition(
      normalized.artifact as Record<string, unknown>,
      normalized.review_action,
    );

    const warnings = [
      "Stateless review transition. Artifact is not persisted server-side until entity API or Dropbox store lands.",
      "Export preview (Milestone 7) remains not implemented; ready_dry_run gates future connector dry-runs only.",
    ];

    return Response.json(
      {
        success: true,
        artifact: updatedArtifact,
        warnings,
        error: null,
        timestamp: nowIso(),
        validation_errors: [] as ValidationError[],
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      emptyEnvelope({
        error: safeErrorMessage(error),
      }),
      { status: 500 },
    );
  }
});
