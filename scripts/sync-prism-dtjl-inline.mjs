import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spineRoot = path.join(
  repoRoot,
  "canonical_spine/02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life",
);
const entryPath = path.join(repoRoot, "base44/functions/getCanonicalProgramFull/entry.ts");

function readJson(relativePath) {
  const fullPath = path.join(spineRoot, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing spine file: ${relativePath}`);
  }
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

const programManifest = readJson("02_PROGRAM_OS/PROGRAM_MANIFEST.json");
const importManifest = readJson("IMPORT_MANIFEST.json");
const ontology = readJson("02_PROGRAM_OS/CONCEPT_ONTOLOGY.json");
const diagnostics = readJson("02_PROGRAM_OS/DIAGNOSTIC_PATTERNS.json");
const interventions = readJson("02_PROGRAM_OS/INTERVENTION_LIBRARY.json");

const MODULE_KEYS = [
  ["Critical Thinking and Information Navigation", "DTJL_M01_CRITICAL_THINKING"],
  ["Life Design Lab", "DTJL_M02_LIFE_DESIGN_LAB"],
  ["Odyssey Planning and Prototyping", "DTJL_M03_ODYSSEY_PLANNING"],
  ["Mechanics of High-Speed Change", "DTJL_M04_HIGH_SPEED_CHANGE"],
  ["Environmental Architecture and Resilience", "DTJL_M05_ENVIRONMENT_ARCHITECTURE"],
  ["Decision Architecture", "DTJL_M06_DECISION_ARCHITECTURE"],
];

const canonicalUri = importManifest.canonical_destination_path;
const repoMirror =
  "canonical_spine/02_PROJECTS/PRISM/programs/design-thinking-for-a-joyful-life";
const importId = importManifest.created_from_import_id;

const PRISM_DTJL_PROGRAM = {
  program_key: importManifest.program_key,
  title: programManifest.program_title,
  internal_system_name: programManifest.internal_system_name,
  program_family: "PRISM Core framework",
  ownership_rail: importManifest.scope,
  visibility_scope: importManifest.visibility,
  status: "live_private_mirror",
  description: `${programManifest.core_reframe} ${programManifest.core_problem}`.trim(),
  demo_summary:
    "A PRISM-owned framework for helping young adults turn stuckness, information overload, and future uncertainty into clear design questions, prototype actions, and safer learning artifacts. Demo mode shows only this high-level overview.",
  canonical_path: canonicalUri,
  repo_mirror_path: repoMirror,
  github_repo: "tbm898-source/canonical (private)",
  source_version: `v${programManifest.version}`,
  audience: programManifest.audience,
  program_type: programManifest.program_type,
  delivery_modes: programManifest.delivery_modes,
  required_agent_rules: programManifest.required_agent_rules,
  evidence_status: importManifest.evidence_status,
  allowed_exports: ["owner_json", "owner_markdown", "future_curated_demo"],
  default_demo_behavior: "public_demo_summary_only",
  boundary_statement: importManifest.boundary_statement,
  owner_only_notes_path: `${canonicalUri}/90_REVIEW/NEXT_ACTIONS.md`,
  created_from_import_id: importId,
  created_at: "2026-05-25T00:00:00.000Z",
  updated_at: new Date().toISOString(),
};

const PRISM_DTJL_MODULES = [
  {
    program_key: importManifest.program_key,
    module_key: importManifest.module_key,
    title: `${programManifest.internal_system_name} v${programManifest.version}`,
    status: "live_private_mirror",
    visibility_scope: importManifest.visibility,
    canonical_path: canonicalUri,
    repo_mirror_path: repoMirror,
    source_version: `v${programManifest.version}`,
    created_from_import_id: importId,
    sequence_order: 0,
    description:
      "Root scaffold module for the PRISM_DTJL program OS, curriculum sequence, and agent pack.",
  },
  ...MODULE_KEYS.map(([title, moduleKey], index) => ({
    program_key: importManifest.program_key,
    module_key: moduleKey,
    title,
    status: "curriculum_module_v0_1",
    visibility_scope: importManifest.visibility,
    canonical_path: `${canonicalUri}/04_CURRICULUM/MODULE_SEQUENCE.md`,
    repo_mirror_path: repoMirror,
    source_version: `v${programManifest.version}`,
    created_from_import_id: importId,
    sequence_order: index + 1,
    description: `Curriculum module ${index + 1} of ${MODULE_KEYS.length} in the Catalyst Blueprint sequence.`,
  })),
];

const sourceStructure = [
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
];

const PRISM_DTJL_ARTIFACTS = [
  {
    artifact_id: "prism_dtjl_source_structure_index_v0_1",
    module_key: importManifest.module_key,
    session_key: "",
    session_title: "PRISM_DTJL source structure index",
    title: "PRISM_DTJL Source Structure Index",
    rail: "prism",
    visibility_scope: importManifest.visibility,
    artifact_type: "manifest",
    audience: "operator",
    format: "json",
    privacy_level: "restricted",
    status: "approved",
    version: `v${programManifest.version}`,
    generated_json: {
      source_structure: sourceStructure,
      canonical_root: canonicalUri,
      repo_mirror_path: repoMirror,
      boundary_statement: importManifest.boundary_statement,
    },
    warnings: [
      "Owner-only. Do not export to AYA classroom, public demo, or Google Classroom destinations.",
    ],
  },
  {
    artifact_id: "prism_dtjl_program_manifest_v0_1",
    module_key: importManifest.module_key,
    session_key: "",
    session_title: "Program manifest",
    title: "PROGRAM_MANIFEST.json",
    rail: "prism",
    visibility_scope: importManifest.visibility,
    artifact_type: "program_os",
    audience: "operator",
    format: "json",
    privacy_level: "restricted",
    status: "approved",
    version: `v${programManifest.version}`,
    generated_json: programManifest,
    warnings: [],
  },
  {
    artifact_id: "prism_dtjl_program_os_summary_v0_1",
    module_key: importManifest.module_key,
    session_key: "",
    session_title: "Program OS summary",
    title: "Concept / diagnostic / intervention index",
    rail: "prism",
    visibility_scope: importManifest.visibility,
    artifact_type: "program_os",
    audience: "operator",
    format: "json",
    privacy_level: "restricted",
    status: "approved",
    version: `v${programManifest.version}`,
    generated_json: {
      concept_count: ontology.concepts.length,
      concepts: ontology.concepts.map((c) => ({
        id: c.id,
        label: c.label,
        evidence_status: c.evidence_status,
      })),
      diagnostic_pattern_count: diagnostics.patterns.length,
      diagnostic_patterns: diagnostics.patterns.map((p) => ({
        id: p.id,
        label: p.label || p.name,
      })),
      intervention_count: interventions.interventions.length,
      interventions: interventions.interventions.map((i) => ({
        id: i.id,
        name: i.name,
      })),
    },
    warnings: [],
  },
];

function toTsObject(name, value) {
  return `const ${name} = ${JSON.stringify(value, null, 2)};`;
}

const inlineBlock = `// @spine-inline-begin — generated by scripts/sync-prism-dtjl-inline.mjs
${toTsObject("PRISM_DTJL_PROGRAM", PRISM_DTJL_PROGRAM)}

${toTsObject("PRISM_DTJL_MODULES", PRISM_DTJL_MODULES)}

${toTsObject("PRISM_DTJL_ARTIFACTS", PRISM_DTJL_ARTIFACTS)}
// @spine-inline-end`;

const entrySource = readFileSync(entryPath, "utf8");
const begin = "// @spine-inline-begin";
const end = "// @spine-inline-end";

if (!entrySource.includes(begin) || !entrySource.includes(end)) {
  throw new Error("getCanonicalProgramFull/entry.ts missing spine inline markers.");
}

const updated = entrySource.replace(
  /\/\/ @spine-inline-begin[\s\S]*\/\/ @spine-inline-end/,
  inlineBlock,
);

writeFileSync(entryPath, updated);

console.log("Synced PRISM_DTJL inline payload from canonical_spine.");
console.log(`  modules: ${PRISM_DTJL_MODULES.length}`);
console.log(`  artifacts: ${PRISM_DTJL_ARTIFACTS.length}`);
console.log(`  concepts: ${ontology.concepts.length}`);
