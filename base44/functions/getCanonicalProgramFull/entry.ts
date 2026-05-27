// Owner-only PRISM program reader.
//
// This function returns the same response shape the frontend
// OwnerPrismDataPanel expects: { success, program, modules, artifacts,
// warnings, error, timestamp }.
//
// On this Base44 plan, the entity layer (CanonicalProgram, CanonicalModule,
// CanonicalGeneratedArtifact) is not provisioned: `npx base44 entities push`
// is blocked with "This endpoint is only available for Backend Platform apps".
// Until that is resolved (either by upgrading the app or by creating those
// schemas manually in the dashboard), the PRISM_DTJL data lives inline in
// this function file. It is still server-side: never bundled into the public
// frontend, never visible to non-owners, and gated by requireOwnerAdmin.
//
// When entities become available, the inline branch below can be replaced
// with the entity-based read path (filter CanonicalProgram by program_key,
// then CanonicalModule + CanonicalGeneratedArtifact).
//
// Inlined policy helpers below (Base44 deploy cannot resolve ../_shared/
// imports on this app; see canary2 isolation experiment 2026-05-27).
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

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

// Inlined PRISM_DTJL data (owner-private). Source-of-truth for now until
// the entity layer is provisioned. Keep this aligned with PRISM source notes.
const PRISM_DTJL_PROGRAM = {
  program_key: "PRISM_DTJL",
  title: "Design Thinking for a Joyful Life",
  program_family: "PRISM Core framework",
  ownership_rail: "PRISM_CORE",
  visibility_scope: "prism_private",
  status: "private_source_ingested",
  description:
    "Private-first PRISM Core framework for life design, self-mastery, critical thinking, and action-based confidence work with youth ages 18-24.",
  demo_summary:
    "A PRISM-owned framework for helping young adults turn stuckness, information overload, and future uncertainty into clear design questions, prototype actions, and safer learning artifacts. Demo mode shows only this high-level overview.",
  canonical_path:
    "CANONICAL://02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life",
  source_version: "v0.1",
  evidence_status: "mixed_requires_review",
  allowed_exports: ["owner_json", "owner_markdown", "future_curated_demo"],
  default_demo_behavior: "public_demo_summary_only",
  owner_only_notes_path:
    "CANONICAL://02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life/90_REVIEW/NEXT_ACTIONS.md",
  created_from_import_id: "import_prism_dtjl_2026_05_25_v0_1",
  created_at: "2026-05-25T00:00:00.000Z",
  updated_at: "2026-05-27T06:00:00.000Z",
};

const PRISM_DTJL_MODULES = [
  {
    program_key: "PRISM_DTJL",
    module_key: "CATALYST_BLUEPRINT_V0_1",
    title: "The Catalyst Blueprint v0.1",
    status: "private_source_ingested",
    visibility_scope: "prism_private",
    canonical_path:
      "CANONICAL://02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life",
    source_version: "v0.1",
    created_from_import_id: "import_prism_dtjl_2026_05_25_v0_1",
    description:
      "Owner-only scaffold for the Design Thinking for a Joyful Life framework. Records the source structure and privacy boundary; curriculum content is added by separate owner workflows.",
  },
];

const PRISM_DTJL_ARTIFACTS = [
  {
    artifact_id: "prism_dtjl_source_structure_index_v0_1",
    module_key: "CATALYST_BLUEPRINT_V0_1",
    session_key: "",
    session_title: "PRISM_DTJL source structure index",
    title: "PRISM_DTJL Source Structure Index",
    rail: "prism",
    visibility_scope: "prism_private",
    artifact_type: "manifest",
    audience: "operator",
    format: "json",
    privacy_level: "restricted",
    status: "approved",
    version: "v0.1",
    generated_json: {
      source_structure: [
        "00_GOVERNANCE",
        "01_SOURCES",
        "02_PROGRAM_OS",
        "03_AGENT_SKILLS",
        "04_CURRICULUM",
        "05_ARTIFACT_RECIPES",
        "06_ASSESSMENTS",
        "07_EXPORTS",
        "90_REVIEW",
        "IMPORT_MANIFEST.json",
      ],
      canonical_root:
        "CANONICAL://02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life",
      boundary_statement:
        "PRISM_DTJL is PRISM Core, private-first, demo-summary-only, and not AYA implementation.",
    },
    warnings: [
      "Owner-only. Do not export to AYA classroom, public demo, or Google Classroom destinations.",
    ],
  },
];

function emptyPayload(extra: Record<string, unknown> = {}) {
  return {
    success: false,
    program: null,
    modules: [],
    artifacts: [],
    warnings: [] as string[],
    timestamp: nowIso(),
    error: null as string | null,
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
        emptyPayload({ error: safeErrorMessage(error) }),
        { status: 403 },
      );
    }

    const payload = await req.json().catch(() => ({}));
    const programKey = String(
      (payload as { program_key?: unknown })?.program_key || "",
    ).trim();

    if (!programKey) {
      return Response.json(
        emptyPayload({ error: "program_key is required." }),
        { status: 200 },
      );
    }

    if (programKey === "PRISM_DTJL") {
      return Response.json(
        {
          success: true,
          program: PRISM_DTJL_PROGRAM,
          modules: PRISM_DTJL_MODULES,
          artifacts: PRISM_DTJL_ARTIFACTS,
          warnings: [
            "PRISM_DTJL data is currently served from an inline server-side source on this Base44 plan (entity layer is not provisioned). When entities become available, this function will switch to entity-backed reads.",
          ],
          timestamp: nowIso(),
          error: null,
        },
        { status: 200 },
      );
    }

    return Response.json(
      {
        success: true,
        program: null,
        modules: [],
        artifacts: [],
        warnings: [
          `No inline data for program_key="${programKey}". Only PRISM_DTJL is currently served inline. Other programs require the entity layer, which is not provisioned on this app's plan.`,
        ],
        timestamp: nowIso(),
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      emptyPayload({ error: safeErrorMessage(error) }),
      { status: 200 },
    );
  }
});
