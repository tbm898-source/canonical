// Owner-only generation plan validator (Milestone 1).
//
// This function does NOT call any LLM, does NOT produce artifact bodies,
// does NOT write files, and does NOT invoke any connectors.
//
// It accepts a GenerationRequest envelope, runs structural validation
// against an inline mirror of the generation-profiles catalog and the
// M1 dry-run output destinations, and returns a structured
// GenerationPlan envelope. On any validation failure it returns
// { success: false, plan: null, validation_errors: [...] }.
//
// Inlined helpers below (Base44 deploy cannot resolve ../_shared/
// imports on this app; pattern confirmed in getCanonicalProgramFull
// 2026-05-27). Do not introduce shared imports here.
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

// Inlined mirror of src/lib/generationProfiles.js (M1 picker metadata only).
// Source of truth for full contracts remains content/generation-profiles/*.profile.json
// on disk; this function only needs rail/visibility membership to validate the
// request. Keep this catalog aligned with the frontend mirror by hand.
const ALLOWED_RAILS = new Set(["aya", "prism", "canonical"]);
const ALLOWED_VISIBILITY_SCOPES = new Set([
  "public_demo",
  "aya_classroom",
  "canonical_internal",
  "prism_private",
]);

type ProfileEntry = {
  profile_id: string;
  output_type: string;
  title: string;
  allowed_rails: string[];
  allowed_visibility_scopes: string[];
  format: string;
  required_sections: string[];
  status: string;
};

const GENERATION_PROFILES: ProfileEntry[] = [
  {
    profile_id: "canonical.daily_run.v0_1",
    output_type: "daily_run",
    title: "Daily Run",
    allowed_rails: ["aya", "canonical"],
    allowed_visibility_scopes: ["aya_classroom", "canonical_internal", "public_demo"],
    format: "markdown+json",
    required_sections: ["day_focus", "targets", "flow", "evidence", "next_step"],
    status: "approved",
  },
  {
    profile_id: "canonical.slide_outline.v0_1",
    output_type: "slide_outline",
    title: "Slide Outline",
    allowed_rails: ["aya", "canonical"],
    allowed_visibility_scopes: ["aya_classroom", "canonical_internal", "public_demo"],
    format: "markdown+json",
    required_sections: ["opening", "status", "targets", "decisions", "handoff"],
    status: "approved",
  },
  {
    profile_id: "canonical.student_handout.v0_1",
    output_type: "student_handout",
    title: "Student Handout",
    allowed_rails: ["aya"],
    allowed_visibility_scopes: ["aya_classroom", "public_demo"],
    format: "markdown+json",
    required_sections: ["objective", "tasks", "reflection", "submission"],
    status: "approved",
  },
  {
    profile_id: "canonical.quiz.v0_1",
    output_type: "quiz",
    title: "Quiz",
    allowed_rails: ["aya"],
    allowed_visibility_scopes: ["aya_classroom", "public_demo"],
    format: "markdown+json",
    required_sections: ["items", "rubric", "answer_key_reference"],
    status: "approved",
  },
  {
    profile_id: "canonical.instructor_guide.v0_1",
    output_type: "instructor_guide",
    title: "Instructor Guide",
    allowed_rails: ["aya", "canonical", "prism"],
    allowed_visibility_scopes: ["aya_classroom", "canonical_internal", "prism_private"],
    format: "markdown+json",
    required_sections: ["context", "teaching_moves", "risks", "evidence_checks", "next_day_bridge"],
    status: "approved",
  },
  {
    profile_id: "canonical.evidence_checklist.v0_1",
    output_type: "evidence_checklist",
    title: "Evidence Checklist",
    allowed_rails: ["aya", "canonical", "prism"],
    allowed_visibility_scopes: [
      "aya_classroom",
      "canonical_internal",
      "prism_private",
      "public_demo",
    ],
    format: "markdown+json",
    required_sections: ["required_evidence", "quality_criteria", "capture_method", "review_status"],
    status: "approved",
  },
  {
    profile_id: "canonical.google_classroom_export.v0_1",
    output_type: "google_classroom_export",
    title: "Google Classroom Export",
    allowed_rails: ["aya", "canonical"],
    allowed_visibility_scopes: ["aya_classroom"],
    format: "json",
    required_sections: ["title", "body", "topic", "materials"],
    status: "approved",
  },
  {
    profile_id: "canonical.prism_facilitator_overlay.v0_1",
    output_type: "prism_facilitator_overlay",
    title: "PRISM Facilitator Overlay",
    allowed_rails: ["prism"],
    allowed_visibility_scopes: ["prism_private"],
    format: "markdown+json",
    required_sections: [
      "facilitator_intent",
      "intervention_logic",
      "risk_flags",
      "continuity_prompt",
    ],
    status: "approved",
  },
];

// Inlined mirror of M1_OUTPUT_DESTINATIONS in src/lib/generationProfiles.js.
// All entries are dry-run only; live writes are not enabled in this milestone.
type DestinationEntry = {
  id: string;
  label: string;
  mode: "dry_run" | "local_preview";
  live_write_enabled: false;
  title: string;
};

const M1_OUTPUT_DESTINATIONS: DestinationEntry[] = [
  {
    id: "local_preview",
    title: "Local preview",
    label: "Dry-run available",
    mode: "local_preview",
    live_write_enabled: false,
  },
  {
    id: "owner_inbox_dry_run",
    title: "Owner inbox (dry run)",
    label: "Dry-run available",
    mode: "dry_run",
    live_write_enabled: false,
  },
  {
    id: "dropbox_owner_drop_zone_dry_run",
    title: "Dropbox owner drop zone (dry run)",
    label: "Dry-run available",
    mode: "dry_run",
    live_write_enabled: false,
  },
];

// Inlined mirror of program identity / module data served by
// getCanonicalProgramFull for PRISM_DTJL. Kept minimal: just what the plan
// validator needs to confirm rail / visibility / module membership.
type ProgramIndexEntry = {
  program_key: string;
  ownership_rail_raw: string;
  rail: "aya" | "prism" | "canonical";
  visibility_scope:
    | "public_demo"
    | "aya_classroom"
    | "canonical_internal"
    | "prism_private";
  module_keys: string[];
};

const PROGRAM_INDEX: Record<string, ProgramIndexEntry> = {
  PRISM_DTJL: {
    program_key: "PRISM_DTJL",
    ownership_rail_raw: "PRISM_CORE",
    rail: "prism",
    visibility_scope: "prism_private",
    module_keys: ["CATALYST_BLUEPRINT_V0_1"],
  },
};

// Server-side fixture catalog of source records (Milestone 2 first slice).
//
// Mirrors the catalog inside base44/functions/listOwnerInboxManifest/entry.ts.
// Both fixtures are server-side only and must NEVER be imported by src/.
// Privacy contract: no absolute paths, no "00_INBOX" tokens, no PRISM private
// framework names. When a real manifest source replaces the fixture (next M2
// slice), both files update together.
type SourceRecordFixture = {
  source_record_id: string;
  file_name: string;
  rail_guess: "aya" | "prism" | "canonical";
  privacy_guess: "public_demo" | "aya_classroom" | "canonical_internal" | "prism_private";
  usable_for: string[];
  confidence: number;
  review_required: boolean;
};

const SOURCE_RECORD_FIXTURES: readonly SourceRecordFixture[] = Object.freeze([
  {
    source_record_id: "src_aya_demo_001",
    file_name: "aya_overview_public.md",
    rail_guess: "aya",
    privacy_guess: "public_demo",
    usable_for: ["daily_run", "slide_outline", "evidence_checklist", "student_handout"],
    confidence: 0.92,
    review_required: false,
  },
  {
    source_record_id: "src_aya_classroom_002",
    file_name: "aya_unit_plan.md",
    rail_guess: "aya",
    privacy_guess: "aya_classroom",
    usable_for: [
      "student_handout",
      "quiz",
      "instructor_guide",
      "evidence_checklist",
      "google_classroom_export",
    ],
    confidence: 0.88,
    review_required: false,
  },
  {
    source_record_id: "src_canonical_internal_003",
    file_name: "canonical_operator_brief.md",
    rail_guess: "canonical",
    privacy_guess: "canonical_internal",
    usable_for: ["daily_run", "slide_outline", "instructor_guide", "evidence_checklist"],
    confidence: 0.81,
    review_required: false,
  },
  {
    source_record_id: "src_prism_private_004",
    file_name: "owner_facilitator_overlay_notes.md",
    rail_guess: "prism",
    privacy_guess: "prism_private",
    usable_for: ["instructor_guide", "evidence_checklist", "prism_facilitator_overlay"],
    confidence: 0.74,
    review_required: false,
  },
  {
    source_record_id: "src_aya_low_confidence_005",
    file_name: "aya_handout_draft.md",
    rail_guess: "aya",
    privacy_guess: "aya_classroom",
    usable_for: ["student_handout", "evidence_checklist"],
    confidence: 0.52,
    review_required: true,
  },
  {
    source_record_id: "src_canonical_low_confidence_006",
    file_name: "canonical_template_seed.md",
    rail_guess: "canonical",
    privacy_guess: "canonical_internal",
    usable_for: ["slide_outline", "evidence_checklist"],
    confidence: 0.61,
    review_required: true,
  },
]);

function findSourceRecord(sourceRecordId: string) {
  return SOURCE_RECORD_FIXTURES.find(
    (record) => record.source_record_id === sourceRecordId,
  );
}

function classifyRail(rail: string) {
  if (rail === "prism") return "PRISM_CORE";
  if (rail === "aya") return "AYA_CTS";
  if (rail === "canonical") return "CANONICAL_SYSTEM";
  return "UNKNOWN";
}

function classifyPrivacy(visibilityScope: string) {
  if (visibilityScope === "prism_private") return "owner_private";
  if (visibilityScope === "canonical_internal") return "operator_internal";
  if (visibilityScope === "aya_classroom") return "classroom_safe";
  if (visibilityScope === "public_demo") return "public_safe";
  return "unknown";
}

function makePlanId() {
  // Deterministic-ish: date + random suffix. No crypto dependency required;
  // this is a non-secret label, not a token.
  const stamp = nowIso().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `plan_${stamp}_${suffix}`;
}

type ValidationError = {
  field: string;
  code: string;
  message: string;
  source_record_id?: string;
};

type SourceReference = {
  source_record_id: string;
  file_name: string;
  rail: string;
  privacy: string;
  role: "primary_source";
};

function validateRequest(payload: any) {
  const errors: ValidationError[] = [];

  if (!payload || typeof payload !== "object") {
    errors.push({
      field: "(root)",
      code: "invalid_request",
      message: "Request body must be a JSON object.",
    });
    return { errors, normalized: null };
  }

  const rail = String(payload.rail || "").trim().toLowerCase();
  const programKey = String(payload.program_key || "").trim();
  const moduleKey = String(payload.module_key || "").trim();
  const profileId = String(payload.profile_id || "").trim();
  const destinationId = String(payload.output_destination_id || "").trim();
  const sourceRecordIdsRaw = payload.source_record_ids;
  const confirmDryRun = payload.confirm_dry_run === true;

  if (!rail) {
    errors.push({
      field: "rail",
      code: "missing",
      message: "rail is required.",
    });
  } else if (!ALLOWED_RAILS.has(rail)) {
    errors.push({
      field: "rail",
      code: "invalid_value",
      message: `rail must be one of: ${[...ALLOWED_RAILS].join(", ")}.`,
    });
  }

  if (!programKey) {
    errors.push({
      field: "program_key",
      code: "missing",
      message: "program_key is required.",
    });
  }

  if (!moduleKey) {
    errors.push({
      field: "module_key",
      code: "missing",
      message: "module_key is required.",
    });
  }

  const profile = GENERATION_PROFILES.find((p) => p.profile_id === profileId);
  if (!profileId) {
    errors.push({
      field: "profile_id",
      code: "missing",
      message: "profile_id is required.",
    });
  } else if (!profile) {
    errors.push({
      field: "profile_id",
      code: "unknown_profile",
      message: `profile_id "${profileId}" is not a known generation profile.`,
    });
  }

  const destination = M1_OUTPUT_DESTINATIONS.find((d) => d.id === destinationId);
  if (!destinationId) {
    errors.push({
      field: "output_destination_id",
      code: "missing",
      message: "output_destination_id is required.",
    });
  } else if (!destination) {
    errors.push({
      field: "output_destination_id",
      code: "unknown_destination",
      message: `output_destination_id "${destinationId}" is not a known M1 dry-run destination.`,
    });
  } else if (destination.live_write_enabled !== false) {
    errors.push({
      field: "output_destination_id",
      code: "live_write_not_allowed",
      message:
        "Only dry-run destinations are accepted in Milestone 1. live_write_enabled must be false.",
    });
  }

  let sourceRecordIds: string[] = [];
  if (sourceRecordIdsRaw !== undefined && sourceRecordIdsRaw !== null) {
    if (!Array.isArray(sourceRecordIdsRaw)) {
      errors.push({
        field: "source_record_ids",
        code: "invalid_type",
        message: "source_record_ids must be an array of strings when provided.",
      });
    } else {
      sourceRecordIds = sourceRecordIdsRaw
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);
    }
  }

  if (!confirmDryRun) {
    errors.push({
      field: "confirm_dry_run",
      code: "must_be_true",
      message:
        "confirm_dry_run must be true. The plan validator only proposes dry-run plans in Milestone 1.",
    });
  }

  return {
    errors,
    normalized: {
      rail,
      program_key: programKey,
      module_key: moduleKey,
      profile_id: profileId,
      profile,
      output_destination_id: destinationId,
      destination,
      source_record_ids: sourceRecordIds,
      confirm_dry_run: confirmDryRun,
    },
  };
}

function validateAgainstProgram(normalized: ReturnType<typeof validateRequest>["normalized"]) {
  const errors: ValidationError[] = [];
  if (!normalized) return errors;

  const program = PROGRAM_INDEX[normalized.program_key];
  if (!program) {
    errors.push({
      field: "program_key",
      code: "unknown_program",
      message: `program_key "${normalized.program_key}" is not known to the plan validator. Only PRISM_DTJL is wired in Milestone 1.`,
    });
    return errors;
  }

  if (normalized.rail && normalized.rail !== program.rail) {
    errors.push({
      field: "rail",
      code: "rail_program_mismatch",
      message: `rail "${normalized.rail}" does not match program "${program.program_key}" (rail=${program.rail}).`,
    });
  }

  if (
    normalized.module_key &&
    !program.module_keys.includes(normalized.module_key)
  ) {
    errors.push({
      field: "module_key",
      code: "unknown_module",
      message: `module_key "${normalized.module_key}" is not a known module of "${program.program_key}".`,
    });
  }

  const profile = normalized.profile;
  if (profile && normalized.rail) {
    if (!profile.allowed_rails.includes(normalized.rail)) {
      errors.push({
        field: "profile_id",
        code: "profile_rail_mismatch",
        message: `Profile "${profile.profile_id}" does not allow rail "${normalized.rail}".`,
      });
    }
  }

  if (profile && !profile.allowed_visibility_scopes.includes(program.visibility_scope)) {
    errors.push({
      field: "profile_id",
      code: "profile_visibility_mismatch",
      message: `Profile "${profile.profile_id}" does not allow visibility_scope "${program.visibility_scope}" required by program "${program.program_key}".`,
    });
  }

  return errors;
}

function validateSourceRecords(
  normalized: ReturnType<typeof validateRequest>["normalized"],
): { errors: ValidationError[]; references: SourceReference[] } {
  const errors: ValidationError[] = [];
  const references: SourceReference[] = [];
  if (!normalized) return { errors, references };

  const profile = normalized.profile;
  const sourceRecordIds = normalized.source_record_ids || [];

  // Without a known profile we cannot evaluate per-record compatibility;
  // the structural error on profile_id is already in the response.
  if (!profile || sourceRecordIds.length === 0) return { errors, references };

  for (const sourceRecordId of sourceRecordIds) {
    const record = findSourceRecord(sourceRecordId);
    if (!record) {
      errors.push({
        field: "source_record_ids",
        source_record_id: sourceRecordId,
        code: "not_found",
        message: `source_record_id "${sourceRecordId}" is not present in the inbox manifest.`,
      });
      continue;
    }

    let mismatched = false;

    if (!profile.allowed_rails.includes(record.rail_guess)) {
      mismatched = true;
      errors.push({
        field: "source_record_ids",
        source_record_id: sourceRecordId,
        code: "rail_mismatch",
        message: `Source "${record.file_name}" rail_guess "${record.rail_guess}" is not in profile "${profile.profile_id}" allowed_rails.`,
      });
    }

    if (!profile.allowed_visibility_scopes.includes(record.privacy_guess)) {
      mismatched = true;
      errors.push({
        field: "source_record_ids",
        source_record_id: sourceRecordId,
        code: "visibility_mismatch",
        message: `Source "${record.file_name}" privacy_guess "${record.privacy_guess}" is not in profile "${profile.profile_id}" allowed_visibility_scopes.`,
      });
    }

    if (
      !Array.isArray(record.usable_for) ||
      !record.usable_for.includes(profile.output_type)
    ) {
      mismatched = true;
      errors.push({
        field: "source_record_ids",
        source_record_id: sourceRecordId,
        code: "usable_for_mismatch",
        message: `Source "${record.file_name}" usable_for does not include profile output_type "${profile.output_type}".`,
      });
    }

    if (!mismatched) {
      references.push({
        source_record_id: record.source_record_id,
        file_name: record.file_name,
        rail: record.rail_guess,
        privacy: record.privacy_guess,
        role: "primary_source",
      });
    }
  }

  return { errors, references };
}

function emptyEnvelope(extra: Record<string, unknown> = {}) {
  return {
    success: false,
    plan: null,
    warnings: [] as string[],
    error: null as string | null,
    timestamp: nowIso(),
    ...extra,
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
          validation_errors: [],
        }),
        { status: 403 },
      );
    }

    const payload = await req.json().catch(() => ({}));
    const { errors: structuralErrors, normalized } = validateRequest(payload);
    const programErrors = normalized
      ? validateAgainstProgram(normalized)
      : [];
    const { errors: sourceErrors, references: sourceReferences } = normalized
      ? validateSourceRecords(normalized)
      : { errors: [] as ValidationError[], references: [] as SourceReference[] };
    const validationErrors = [...structuralErrors, ...programErrors, ...sourceErrors];

    if (validationErrors.length || !normalized) {
      return Response.json(
        {
          success: false,
          plan: null,
          warnings: [] as string[],
          error: null,
          timestamp: nowIso(),
          validation_errors: validationErrors,
        },
        { status: 200 },
      );
    }

    const program = PROGRAM_INDEX[normalized.program_key];
    const profile = normalized.profile!;
    const destination = normalized.destination!;

    const nextActions = sourceReferences.length
      ? ["owner_review"]
      : ["owner_review", "select_source_records_when_inbox_ready"];

    const plan = {
      generation_plan_id: makePlanId(),
      generated_at: nowIso(),
      rail: normalized.rail,
      rail_classification: classifyRail(normalized.rail),
      program_key: normalized.program_key,
      module_key: normalized.module_key,
      profile: {
        profile_id: profile.profile_id,
        output_type: profile.output_type,
        format: profile.format,
        required_sections: profile.required_sections,
        forbidden_patterns_present: false,
      },
      privacy_classification: classifyPrivacy(program.visibility_scope),
      visibility_scope: program.visibility_scope,
      source_references: sourceReferences,
      destination: {
        id: destination.id,
        label: destination.label,
        mode: destination.mode,
        live_write_enabled: destination.live_write_enabled,
      },
      review_status: "draft",
      export_readiness_status: "not_ready",
      capability_label: "Dry-run available",
      validation_errors: [] as ValidationError[],
      next_actions: nextActions,
    };

    return Response.json(
      {
        success: true,
        plan,
        warnings: [] as string[],
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
        validation_errors: [],
      }),
      { status: 200 },
    );
  }
});
