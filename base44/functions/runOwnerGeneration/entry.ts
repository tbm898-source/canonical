// Owner-only deterministic generation runner (Milestone 3).
//
// This function does NOT call any LLM, does NOT write files, and does NOT
// invoke any connectors. It accepts a validated GenerationRequest envelope
// plus a generation_plan_id, runs the same structural validation as
// proposeOwnerGenerationPlan, and returns deterministic template artifact
// bodies for all supported output types.
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

const FORBIDDEN_PATTERNS = ["access_token", "Bearer ", "C:/Users/"];

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

function makeArtifactId() {
  const stamp = nowIso().replace(/[-:.TZ]/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `artifact_${stamp}_${suffix}`;
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

  const generationPlanId = String(payload.generation_plan_id || "").trim();
  const rail = String(payload.rail || "").trim().toLowerCase();
  const programKey = String(payload.program_key || "").trim();
  const moduleKey = String(payload.module_key || "").trim();
  const profileId = String(payload.profile_id || "").trim();
  const destinationId = String(payload.output_destination_id || "").trim();
  const sourceRecordIdsRaw = payload.source_record_ids;
  const confirmDryRun = payload.confirm_dry_run === true;

  if (!generationPlanId) {
    errors.push({
      field: "generation_plan_id",
      code: "missing",
      message: "generation_plan_id is required.",
    });
  }

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
      generation_plan_id: generationPlanId,
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

type TemplateContext = {
  sessionTitle: string;
  programKey: string;
  moduleKey: string;
  rail: string;
  profileTitle: string;
  sourceNames: string[];
  sourceSummary: string;
};

function buildTemplateContext(
  normalized: NonNullable<ReturnType<typeof validateRequest>["normalized"]>,
  sourceReferences: SourceReference[],
): TemplateContext {
  const sessionTitle = `${normalized.program_key} / ${normalized.module_key}`;
  const sourceNames = sourceReferences.map((ref) => ref.file_name);
  const sourceSummary = sourceNames.length
    ? sourceNames.join(", ")
    : "No source records selected; template uses program/module context only.";

  return {
    sessionTitle,
    programKey: normalized.program_key,
    moduleKey: normalized.module_key,
    rail: normalized.rail,
    profileTitle: normalized.profile?.title || normalized.profile_id,
    sourceNames,
    sourceSummary,
  };
}

function generateDailyRunSections(ctx: TemplateContext): Record<string, string> {
  return {
    day_focus: `State the actual session stage for ${ctx.sessionTitle} plainly. Name top targets, confirm safety, tools, roles, and evidence expectations.`,
    targets: `- Complete highest-priority module work for ${ctx.moduleKey}\n- Capture evidence aligned to ${ctx.profileTitle}\n- Resolve any blockers before submission or demo steps\n- Source context: ${ctx.sourceSummary}`,
    flow: `1. Opening huddle and safety reset.\n2. Task block tied to the highest-priority remaining work.\n3. Quality/safety pause before any submission, upload, lab, or demo step.\n4. Evidence capture: photos, student notes, and carry-forward details.\n5. Cleanup and next-session handoff.`,
    evidence: `- Photos or scans of in-progress work\n- Student notes tied to ${ctx.moduleKey}\n- Blocker log with owner follow-up items\n- Carry-forward details for the next session`,
    next_step: `Confirm evidence is filed, name the first task for the next session, and update the session brief from real status—not the ideal calendar stage.`,
  };
}

function generateSlideOutlineSections(ctx: TemplateContext): Record<string, string> {
  return {
    opening: `Slide / Deck Outline — ${ctx.sessionTitle}\n\nOpen with the real project status, not an ideal calendar stage.`,
    status: `- Program: ${ctx.programKey}\n- Module: ${ctx.moduleKey}\n- Rail: ${ctx.rail}\n- Sources: ${ctx.sourceSummary}`,
    targets: `- Today's highest-priority remaining work\n- Quality and safety checkpoints\n- Evidence capture expectations\n- Reflection prompts for students`,
    decisions: `- Blockers requiring facilitator or admin action\n- Tooling, roles, and submission path decisions\n- Any scope adjustments before end of session`,
    handoff: `- Next-session first step\n- Evidence already captured vs still needed\n- Carry-forward notes for ${ctx.moduleKey}`,
  };
}

function generateStudentHandoutSections(ctx: TemplateContext): Record<string, string> {
  return {
    objective: `Work from the real project status for ${ctx.sessionTitle}. Complete assigned tasks, capture evidence, and reflect on what your team learned.`,
    tasks: `- Name / role: ____________________\n- What I worked on today:\n  - Task 1 tied to ${ctx.moduleKey}\n  - Task 2 tied to ${ctx.moduleKey}\n- Time on task: ____________________`,
    reflection: `- What detail mattered most today?\n- What problem did our team solve?\n- What still needs attention next class?\n- Source reference: ${ctx.sourceSummary}`,
    submission: `- Turn in completed work per classroom instructions\n- Attach or link evidence captures\n- Submit reflection responses before end of class`,
  };
}

function generateQuizSections(ctx: TemplateContext): Record<string, string> {
  return {
    items: `1. Describe the current session stage for ${ctx.moduleKey} in your own words.\n2. List two evidence items your team should capture today.\n3. Name one blocker and one decision needed before submission.\n4. What is the first next step for the following session?`,
    rubric: `- Full credit: answers reference real project status and ${ctx.moduleKey} context\n- Partial credit: generic answers without session-specific detail\n- No credit: missing evidence or safety considerations`,
    answer_key_reference: `Facilitator reference only. Accept answers that tie to ${ctx.sessionTitle}, name concrete evidence, and identify a realistic next step. Sources: ${ctx.sourceSummary}`,
  };
}

function generateInstructorGuideSections(ctx: TemplateContext): Record<string, string> {
  return {
    context: `${ctx.profileTitle} for ${ctx.sessionTitle} on the ${ctx.rail} rail. Use the session brief as the bridge between messy classflow and reusable delivery materials. Sources: ${ctx.sourceSummary}`,
    teaching_moves: `- Opening huddle: state actual stage, name targets, confirm safety and roles\n- Task block: tie work to highest-priority remaining items\n- Quality pause before submission, upload, lab, or demo\n- Evidence capture as part of instruction, not afterthought paperwork`,
    risks: `- Students working from ideal calendar stage instead of real status\n- Missing evidence before cleanup\n- Unresolved blockers carried forward without owner note\n- Scope creep without explicit facilitator decision`,
    evidence_checks: `- Photos, student notes, and carry-forward details captured\n- Blocker log updated\n- Submission path confirmed\n- Reflection prompts completed`,
    next_day_bridge: `Name the first task for the next session, confirm evidence is filed, and update the session brief from real status for ${ctx.moduleKey}.`,
  };
}

function generateEvidenceChecklistSections(ctx: TemplateContext): Record<string, string> {
  return {
    required_evidence: `- In-progress work photos or scans\n- Student notes tied to ${ctx.moduleKey}\n- Blocker log with follow-up items\n- Carry-forward details for next session\n- Source alignment: ${ctx.sourceSummary}`,
    quality_criteria: `- Evidence matches real session status, not ideal calendar stage\n- Captures are legible and attributable\n- Blockers include owner or admin follow-up where needed\n- Reflection ties to module learning goals`,
    capture_method: `- In-class photos or scans\n- Shared doc or LMS upload\n- Facilitator session brief update\n- Student work log entries`,
    review_status: `Draft — owner review required before export. Template generated deterministically; no live write performed.`,
  };
}

function generateGoogleClassroomSections(ctx: TemplateContext): Record<string, string> {
  const title = `${ctx.sessionTitle} — Session Materials`;
  const body = `Today we are working from the real project status for ${ctx.moduleKey}. Complete the assigned work, evidence capture, and reflection prompts.`;
  const topic = ctx.moduleKey;
  const materials = ctx.sourceNames.length
    ? ctx.sourceNames.map((name) => `- ${name}`).join("\n")
    : `- ${ctx.profileTitle} template\n- Session brief for ${ctx.programKey}`;

  return { title, body, topic, materials };
}

function generatePrismFacilitatorOverlaySections(ctx: TemplateContext): Record<string, string> {
  return {
    facilitator_intent: `Adaptive instructional continuity for ${ctx.sessionTitle}: name the actual stage, protect quality, capture evidence, and generate the next day from real status. Keep student-facing outputs clean and institution-safe.`,
    intervention_logic: `- When classflow diverges from plan, re-anchor on session brief status\n- Prioritize safety, evidence, and carry-forward over coverage speed\n- Use generic facilitator prompts—not proprietary framework labels\n- Sources for context: ${ctx.sourceSummary}`,
    risk_flags: `- Facilitator overlay leaking into student-facing materials\n- Evidence treated as paperwork instead of instruction\n- Blockers hidden until end of session\n- Next-day bridge missing concrete first step`,
    continuity_prompt: `Before closing: What is the actual stage? What evidence was captured? What is the first task next session? Update the session brief and keep raw facilitator notes private unless deliberately curated for demo use.`,
  };
}

function generateSections(
  outputType: string,
  ctx: TemplateContext,
): Record<string, string> {
  switch (outputType) {
    case "daily_run":
      return generateDailyRunSections(ctx);
    case "slide_outline":
      return generateSlideOutlineSections(ctx);
    case "student_handout":
      return generateStudentHandoutSections(ctx);
    case "quiz":
      return generateQuizSections(ctx);
    case "instructor_guide":
      return generateInstructorGuideSections(ctx);
    case "evidence_checklist":
      return generateEvidenceChecklistSections(ctx);
    case "google_classroom_export":
      return generateGoogleClassroomSections(ctx);
    case "prism_facilitator_overlay":
      return generatePrismFacilitatorOverlaySections(ctx);
    default:
      return {};
  }
}

function assembleBodyMarkdown(
  sections: Record<string, string>,
  outputType: string,
  ctx: TemplateContext,
): string {
  if (outputType === "google_classroom_export") {
    return `# Google Classroom Draft — ${ctx.sessionTitle}

Today we are working from the real project status, not an ideal calendar stage.

## Goals
- Complete assigned work for ${ctx.moduleKey}
- Capture evidence aligned to session brief
- Complete reflection prompts

## Turn in / capture
${sections.materials || "- Session materials"}

## Reflection
- What detail mattered most today?
- What problem did your team solve?
- What still needs attention next class?

## Next class
Confirm evidence is filed and name the first task for the following session.`;
  }

  return Object.entries(sections)
    .map(([key, content]) => `## ${key}\n\n${content}`)
    .join("\n\n");
}

function buildBodyJson(
  outputType: string,
  sections: Record<string, string>,
): Record<string, string> | null {
  if (outputType !== "google_classroom_export") return null;
  return {
    title: sections.title || "",
    body: sections.body || "",
    topic: sections.topic || "",
    materials: sections.materials || "",
  };
}

function buildContractValidation(
  sections: Record<string, string>,
  requiredSections: string[],
) {
  const present = requiredSections.filter(
    (key) => typeof sections[key] === "string" && sections[key].trim().length > 0,
  );
  const missing = requiredSections.filter((key) => !present.includes(key));
  return {
    required_sections_present: present,
    missing_sections: missing,
  };
}

function scanForbiddenPatterns(text: string): string[] {
  const warnings: string[] = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (text.includes(pattern)) {
      warnings.push(`Forbidden pattern detected in generated content: "${pattern}".`);
    }
  }
  return warnings;
}

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
        emptyEnvelope({
          validation_errors: validationErrors,
        }),
        { status: 200 },
      );
    }

    const program = PROGRAM_INDEX[normalized.program_key];
    const profile = normalized.profile!;
    const destination = normalized.destination!;
    const ctx = buildTemplateContext(normalized, sourceReferences);
    const sections = generateSections(profile.output_type, ctx);
    const bodyMarkdown = assembleBodyMarkdown(sections, profile.output_type, ctx);
    const bodyJson = buildBodyJson(profile.output_type, sections);
    const contractValidation = buildContractValidation(sections, profile.required_sections);

    const generatedText = [
      bodyMarkdown,
      bodyJson ? JSON.stringify(bodyJson) : "",
      ...Object.values(sections),
    ].join("\n");

    const warnings = [
      "Deterministic template only. No LLM. No file write. No connector call.",
      ...scanForbiddenPatterns(generatedText),
    ];

    const artifact = {
      generation_artifact_id: makeArtifactId(),
      generation_plan_id: normalized.generation_plan_id,
      generated_at: nowIso(),
      rail: normalized.rail as "aya" | "prism" | "canonical",
      rail_classification: classifyRail(normalized.rail),
      program_key: normalized.program_key,
      module_key: normalized.module_key,
      profile: {
        profile_id: profile.profile_id,
        output_type: profile.output_type,
        format: profile.format,
        required_sections: profile.required_sections,
      },
      privacy_classification: classifyPrivacy(program.visibility_scope),
      visibility_scope: program.visibility_scope,
      source_references: sourceReferences,
      sections,
      body_markdown: bodyMarkdown,
      body_json: bodyJson,
      contract_validation: contractValidation,
      destination: {
        id: destination.id,
        label: destination.label,
        mode: destination.mode,
        live_write_enabled: destination.live_write_enabled,
      },
      review_status: "draft" as const,
      export_readiness_status: "not_ready" as const,
      capability_label: "Backend wired" as const,
      next_actions: ["owner_review", "approve_before_export"],
    };

    return Response.json(
      {
        success: true,
        artifact,
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
      { status: 200 },
    );
  }
});
