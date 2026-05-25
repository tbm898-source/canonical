export const PROGRAM_VIEW_MODES = {
  OWNER: "owner",
  DEMO: "demo",
};

const DEMO_SUMMARY_ONLY = "public_demo_summary_only";

const demoProgramFields = [
  "id",
  "program_key",
  "title",
  "program_family",
  "ownership_rail",
  "status",
  "description",
  "demo_summary",
  "default_demo_behavior",
];

export function isDemoSummaryOnly(program, mode) {
  return mode !== PROGRAM_VIEW_MODES.OWNER && program?.default_demo_behavior === DEMO_SUMMARY_ONLY;
}

export function sanitizeProgramForMode(program, mode) {
  if (!program) return null;
  if (!isDemoSummaryOnly(program, mode)) return program;

  return demoProgramFields.reduce((safeProgram, field) => {
    if (Object.prototype.hasOwnProperty.call(program, field)) {
      safeProgram[field] = program[field];
    }
    return safeProgram;
  }, { demo_access: DEMO_SUMMARY_ONLY });
}

export function getVisiblePrograms(programs, mode) {
  return programs
    .filter((program) => program.default_demo_behavior !== "hidden" || mode === PROGRAM_VIEW_MODES.OWNER)
    .map((program) => sanitizeProgramForMode(program, mode));
}

export function getAccessibleModuleForProgram(program, modules, mode) {
  if (!program || isDemoSummaryOnly(program, mode)) return null;
  const moduleIds = Array.isArray(program.module_ids) ? program.module_ids : [];
  if (!moduleIds.length) return null;

  return modules.find((module) => module.program_id === program.id && moduleIds.includes(module.id)) ?? null;
}

export function getSafeProgramSeed(program, fallbackSeed, mode) {
  if (!program) return fallbackSeed;
  if (isDemoSummaryOnly(program, mode)) {
    return program.demo_summary || fallbackSeed;
  }
  return program.helper_seed_input || fallbackSeed;
}

export function assertNoPrivateDemoFields(program) {
  const privateFields = [
    "allowed_exports",
    "canonical_path",
    "created_from_import_id",
    "module_ids",
    "owner_only_notes_path",
    "owner_visibility",
    "source_structure",
    "source_version",
    "visibility_scope",
  ];

  return privateFields.filter((field) => Object.prototype.hasOwnProperty.call(program ?? {}, field));
}
