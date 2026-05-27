// deploy-bump: 2026-05-27 — force redeploy after requireOwnerAdmin export landed in _shared/canonicalPolicy
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  nowIso,
  requireOwnerAdmin,
  safeErrorMessage,
} from "../_shared/canonicalPolicy.ts";

// PRISM_DTJL owner-private seed data.
// Lives server-side only; never imported by the public frontend bundle.
// Sourced from the pre-strip version of src/data/instructionalSampleData.js.
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

function getRecordList(response: unknown) {
  if (Array.isArray(response)) return response;
  const data = (response as { data?: unknown })?.data;
  if (Array.isArray(data)) return data;
  const items = (response as { items?: unknown })?.items;
  if (Array.isArray(items)) return items;
  const records = (response as { records?: unknown })?.records;
  if (Array.isArray(records)) return records;
  return [];
}

async function upsertProgram(base44: any) {
  const existing = getRecordList(
    await base44.asServiceRole.entities.CanonicalProgram.filter(
      { program_key: PRISM_DTJL_PROGRAM.program_key },
      "-updated_at",
      1,
    ),
  );
  const now = nowIso();
  if (existing[0]) {
    await base44.asServiceRole.entities.CanonicalProgram.update(
      (existing[0] as { id: string }).id,
      { ...PRISM_DTJL_PROGRAM, updated_at: now },
    );
    return { action: "updated", program_key: PRISM_DTJL_PROGRAM.program_key };
  }
  await base44.asServiceRole.entities.CanonicalProgram.create({
    ...PRISM_DTJL_PROGRAM,
    created_at: now,
    updated_at: now,
  });
  return { action: "created", program_key: PRISM_DTJL_PROGRAM.program_key };
}

async function upsertModule(base44: any, mod: typeof PRISM_DTJL_MODULES[number]) {
  const existing = getRecordList(
    await base44.asServiceRole.entities.CanonicalModule.filter(
      { program_key: mod.program_key, module_key: mod.module_key },
      "-updated_at",
      1,
    ),
  );
  const now = nowIso();
  if (existing[0]) {
    await base44.asServiceRole.entities.CanonicalModule.update(
      (existing[0] as { id: string }).id,
      { ...mod, updated_at: now },
    );
    return { action: "updated", module_key: mod.module_key };
  }
  await base44.asServiceRole.entities.CanonicalModule.create({
    ...mod,
    created_at: now,
    updated_at: now,
  });
  return { action: "created", module_key: mod.module_key };
}

async function upsertArtifact(
  base44: any,
  artifact: typeof PRISM_DTJL_ARTIFACTS[number],
) {
  const existing = getRecordList(
    await base44.asServiceRole.entities.CanonicalGeneratedArtifact.filter(
      { artifact_id: artifact.artifact_id },
      "-updated_at",
      1,
    ),
  );
  const now = nowIso();
  if (existing[0]) {
    await base44.asServiceRole.entities.CanonicalGeneratedArtifact.update(
      (existing[0] as { id: string }).id,
      { ...artifact, updated_at: now },
    );
    return { action: "updated", artifact_id: artifact.artifact_id };
  }
  await base44.asServiceRole.entities.CanonicalGeneratedArtifact.create({
    ...artifact,
    created_at: now,
    updated_at: now,
  });
  return { action: "created", artifact_id: artifact.artifact_id };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    try {
      await requireOwnerAdmin(base44);
    } catch (error) {
      return Response.json(
        {
          success: false,
          seeded: { program: null, modules: [], artifacts: [] },
          timestamp: nowIso(),
          error: safeErrorMessage(error),
        },
        { status: 403 },
      );
    }

    const programResult = await upsertProgram(base44);

    const moduleResults: Array<{ action: string; module_key: string }> = [];
    for (const mod of PRISM_DTJL_MODULES) {
      moduleResults.push(await upsertModule(base44, mod));
    }

    const artifactResults: Array<{ action: string; artifact_id: string }> = [];
    for (const artifact of PRISM_DTJL_ARTIFACTS) {
      artifactResults.push(await upsertArtifact(base44, artifact));
    }

    return Response.json(
      {
        success: true,
        seeded: {
          program: programResult,
          modules: moduleResults,
          artifacts: artifactResults,
        },
        timestamp: nowIso(),
        error: null,
      },
      { status: 200 },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        seeded: { program: null, modules: [], artifacts: [] },
        timestamp: nowIso(),
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
