// Owner-only inbox manifest reader (Milestone 2, fixture-first slice).
//
// This function does NOT call any LLM, does NOT read the local filesystem,
// does NOT write files, and does NOT invoke any connectors. It returns a
// hard-coded fixture of source-record metadata so the SourceRecordPicker UI
// can be wired against a stable contract before a real manifest source is
// chosen.
//
// Egress contract (privacy):
//   - No absolute filesystem paths are ever returned.
//   - No "source_path" field is returned (only "file_name").
//   - No PRISM private framework names appear in fixture content.
//   - Owner/admin auth is enforced before any data leaves the function.
//
// Inlined helpers below (Base44 deploy cannot resolve ../_shared/ imports
// on this app; pattern confirmed in proposeOwnerGenerationPlan and
// getCanonicalProgramFull). Do not introduce shared imports here.
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

// Server-side fixture catalog of source records.
//
// IMPORTANT: This catalog is read-only metadata used by the SourceRecordPicker
// UI to validate the M2 contract. It must NEVER include:
//   - absolute filesystem paths (Dropbox\\, C:\\, /Users/, etc.)
//   - "00_INBOX" or other local directory tokens
//   - PRISM private framework names (CATALYST_BLUEPRINT, INTERVENTION_LIBRARY,
//     belief_shift_rubric, Worth Decoupling Protocol, ...)
//   - source body text or excerpts
//
// The fixture deliberately exercises every (rail x privacy) combination the
// validator must classify, plus a low-confidence + review_required record
// so the picker UI can render its review-required badge path.
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

const MANIFEST_ID = "fixture_v0_1__m2_first_slice";
const MANIFEST_SOURCE = "fixture_v0_1";

function emptyEnvelope(extra: Record<string, unknown> = {}) {
  return {
    success: false,
    source_records: [] as SourceRecordFixture[],
    generated_at: nowIso(),
    manifest_id: MANIFEST_ID,
    manifest_source: MANIFEST_SOURCE,
    warnings: [] as string[],
    error: null as string | null,
    ...extra,
  };
}

function sanitizeForEgress(record: SourceRecordFixture) {
  // Defense-in-depth: rebuild the record object so even if a future edit adds
  // a stray "source_path" or other private field to the fixture, it cannot
  // leak through this function. We only ever return the metadata-only shape.
  return {
    source_record_id: String(record.source_record_id),
    file_name: String(record.file_name),
    rail_guess: record.rail_guess,
    privacy_guess: record.privacy_guess,
    usable_for: Array.isArray(record.usable_for) ? [...record.usable_for] : [],
    confidence: typeof record.confidence === "number" ? record.confidence : 0,
    review_required: record.review_required === true,
  };
}

Deno.serve(async (req) => {
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

    const sourceRecords = SOURCE_RECORD_FIXTURES.map(sanitizeForEgress);

    return Response.json(
      {
        success: true,
        source_records: sourceRecords,
        generated_at: nowIso(),
        manifest_id: MANIFEST_ID,
        manifest_source: MANIFEST_SOURCE,
        warnings: [
          "Fixture manifest. Real inbox manifest source location is locked in the M2 council loop.",
        ],
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      emptyEnvelope({ error: safeErrorMessage(error) }),
      { status: 200 },
    );
  }
});
