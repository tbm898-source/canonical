import { portalData } from "../src/data/instructionalSampleData.js";
import { existsSync, readFileSync } from "node:fs";
import {
  PROGRAM_VIEW_MODES,
  assertNoPrivateDemoFields,
  getAccessibleModuleForProgram,
  getVisiblePrograms,
} from "../src/lib/programAccessPolicy.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const demoPrograms = getVisiblePrograms(portalData.programs, PROGRAM_VIEW_MODES.DEMO);
const ownerPrograms = getVisiblePrograms(portalData.programs, PROGRAM_VIEW_MODES.OWNER);
const demoDtjl = demoPrograms.find((program) => program.program_key === "PRISM_DTJL");
const ownerDtjl = ownerPrograms.find((program) => program.program_key === "PRISM_DTJL");
const demoPv102 = demoPrograms.find((program) => program.program_key === "AYA_CTS");

assert(demoDtjl, "PRISM_DTJL must be visible as a demo-safe overview card.");
assert(ownerDtjl, "PRISM_DTJL must be available in owner mode.");
assert(demoPv102, "PV102 / AYA_CTS public demo sample must remain visible.");
assert(demoDtjl.demo_access === "public_demo_summary_only", "PRISM_DTJL demo view must be summary-only.");
assert(ownerDtjl.visibility_scope === "prism_private", "Owner PRISM_DTJL seed must remain prism_private.");
assert(ownerDtjl.ownership_rail === "PRISM_CORE", "Owner PRISM_DTJL seed must remain PRISM_CORE.");

const leakedFields = assertNoPrivateDemoFields(demoDtjl);
assert(
  leakedFields.length === 0,
  `PRISM_DTJL demo program includes private fields: ${leakedFields.join(", ")}`,
);

const demoDtjlModule = getAccessibleModuleForProgram(
  demoDtjl,
  portalData.modules,
  PROGRAM_VIEW_MODES.DEMO,
);
assert(demoDtjlModule === null, "PRISM_DTJL demo mode must not receive module/source structure data.");

const pv102Module = getAccessibleModuleForProgram(
  demoPv102,
  portalData.modules,
  PROGRAM_VIEW_MODES.DEMO,
);
assert(pv102Module?.module_key === "PV102", "PV102 demo module must remain accessible.");

const demoDtjlText = JSON.stringify(demoDtjl);
const blockedPatterns = [
  { label: "Windows path", pattern: /[A-Z]:\\/ },
  { label: "private CANONICAL program path", pattern: /CANONICAL:\/\/02_PROJECTS\/PRISM\/programs/i },
  { label: "evidence map internals", pattern: /evidence_map|evidence map/i },
  { label: "diagnostic internals", pattern: /DIAGNOSTIC_PATTERNS|diagnostic pattern/i },
  { label: "intervention internals", pattern: /INTERVENTION_LIBRARY|intervention librar/i },
  { label: "source structure", pattern: /source_structure|00_GOVERNANCE|02_PROGRAM_OS/i },
  { label: "connector calls", pattern: /connector|dropbox|classroom|clickup|gmail/i },
  { label: "credentials", pattern: /api_key|token|oauth|secret/i },
  { label: "AYA implementation assumptions", pattern: /\bAYA\b|Alternative Youth Activities|\bCTS\b/i },
  { label: "private notes", pattern: /private_notes|owner_only/i },
];

const leaks = blockedPatterns
  .filter(({ pattern }) => pattern.test(demoDtjlText))
  .map(({ label }) => label);

assert(leaks.length === 0, `PRISM_DTJL demo overview leaked: ${leaks.join(", ")}`);

const liveIntegrationsSource = readFileSync(
  new URL("../src/components/program-helper/LiveIntegrationsPanel.jsx", import.meta.url),
  "utf8",
);
const authContextSource = readFileSync(
  new URL("../src/lib/AuthContext.jsx", import.meta.url),
  "utf8",
);
const programHelperSource = readFileSync(
  new URL("../src/pages/ProgramHelper.jsx", import.meta.url),
  "utf8",
);
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

assert(
  !/import\s+\{\s*base44\s*\}\s+from\s+["']@\/api\/base44Client["']/.test(liveIntegrationsSource),
  "LiveIntegrationsPanel must not statically import the Base44 client because demo mode must not preload backend SDK calls.",
);

assert(
  /await import\(["']@\/api\/base44Client["']\)/.test(liveIntegrationsSource),
  "LiveIntegrationsPanel should lazy-load the Base44 client only inside owner-triggered integration actions.",
);

assert(
  /previewPath\s*&&\s*isLocalPreviewHost\(\)/.test(authContextSource),
  "AuthContext must keep anonymous preview bypass limited to localhost only.",
);

assert(
  /requestedMode\s*===\s*["']owner["']\s*&&\s*ownerAccessAllowed/.test(programHelperSource),
  "ProgramHelper must only honor requested owner mode when owner access is allowed.",
);

assert(
  /!ownerAccessAllowed\s*&&\s*mode\s*===\s*["']owner["']/.test(programHelperSource),
  "ProgramHelper must downgrade unauthorized owner mode back to demo.",
);

const generatedPackageFiles = [
  "cts-master-package-v1.summary.json",
  "cts-master-package-v1.components.json",
  "cts-master-package-v1.manifest.json",
  "cts-master-package-v1.authority-map.json",
];

for (const file of generatedPackageFiles) {
  const url = new URL(`../content/packages/generated/${file}`, import.meta.url);
  assert(existsSync(url), `Missing generated CTS package artifact: ${file}`);
  const parsed = JSON.parse(readFileSync(url, "utf8"));
  assert(parsed.package_id === "cts-master-package-v1", `${file} must describe cts-master-package-v1.`);
}

const summary = JSON.parse(
  readFileSync(
    new URL("../content/packages/generated/cts-master-package-v1.summary.json", import.meta.url),
    "utf8",
  ),
);

assert(
  summary.public_exposure === "sanitized_proof_only",
  "CTS package public exposure must remain sanitized_proof_only.",
);
assert(summary.source_package?.source_path_redacted === true, "CTS source path must remain redacted.");
assert(
  summary.source_package?.sha256_matches_expected === true,
  "CTS package SHA256 should match the expected source hash.",
);

const generatedPackageText = generatedPackageFiles
  .map((file) =>
    readFileSync(new URL(`../content/packages/generated/${file}`, import.meta.url), "utf8"),
  )
  .join("\n");

const generatedBlockedPatterns = [
  { label: "Windows path", pattern: /[A-Z]:\\/ },
  { label: "raw student field", pattern: /Student_Name|DOB_or_UniqueID|Case_Manager/ },
  { label: "raw restricted notes field", pattern: /Restricted_Notes|Notes_Restricted/ },
  { label: "raw restricted routing field", pattern: /HR_Review/ },
  { label: "raw placement field", pattern: /Employer_or_Program/ },
  { label: "credential terms", pattern: /api_key|access_token|refresh_token|oauth|secret/i },
  { label: "backend logs", pattern: /backend logs/i },
];

const generatedLeaks = generatedBlockedPatterns
  .filter(({ pattern }) => pattern.test(generatedPackageText))
  .map(({ label }) => label);

assert(
  generatedLeaks.length === 0,
  `CTS generated package proof leaked unsafe public text: ${generatedLeaks.join(", ")}`,
);

assert(
  /path=["']\/Packages\/:packageId["']/.test(appSource),
  "App must register /Packages/:packageId route.",
);
assert(/path=["']\/Proof["']/.test(appSource), "App must register /Proof route.");
assert(/path=["']\/Docs\/:docId["']/.test(appSource), "App must register /Docs/:docId route.");

console.log("PRISM_DTJL privacy QA passed.");
console.log("Demo view: summary-only, no private module/source payload.");
console.log("PV102 remains the accessible public demo sample.");
console.log("CTS package proof QA passed: generated JSON parses and public proof text is sanitized.");
