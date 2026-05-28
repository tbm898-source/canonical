import { portalData } from "../src/data/instructionalSampleData.js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROGRAM_VIEW_MODES,
  assertNoPrivateDemoFields,
  getAccessibleModuleForProgram,
  getVisiblePrograms,
} from "../src/lib/programAccessPolicy.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

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

// Bundle-wide leak check: scan the entire portalData object (the public JS bundle payload)
// for PRISM-private fields, paths, and operator-private metadata that must never ship publicly.
// Adding new private fields to portalData without removing them is now a regression.
const portalDataText = JSON.stringify(portalData);
const portalBlockedPatterns = [
  { label: "private CANONICAL PRISM program path", pattern: /CANONICAL:\/\/02_PROJECTS\/PRISM/i },
  { label: "local AI drafts inbox path", pattern: /CANONICAL:\/\/00_INBOX\/AI_DRAFTS/i },
  { label: "PRISM source folder 00_GOVERNANCE", pattern: /00_GOVERNANCE/ },
  { label: "PRISM source folder 02_PROGRAM_OS", pattern: /02_PROGRAM_OS/ },
  { label: "PRISM source folder 03_AGENT_SKILLS", pattern: /03_AGENT_SKILLS/ },
  { label: "PRISM source folder 05_ARTIFACT_RECIPES", pattern: /05_ARTIFACT_RECIPES/ },
  { label: "PRISM module key CATALYST_BLUEPRINT_V0_1", pattern: /CATALYST_BLUEPRINT_V0_1/ },
  { label: "PRISM_DTJL import id", pattern: /import_prism_dtjl/ },
  // Field-name leaks only matter when they carry a non-empty value.
  // Empty placeholders in unrelated sample programs (e.g. AYA_CTS owner_only_notes_path: "")
  // are intentionally left untouched per scope; non-empty values are the real privacy risk.
  { label: "owner_only_notes_path with non-empty value", pattern: /"owner_only_notes_path"\s*:\s*"[^"]+"/ },
  { label: "private_notes with non-empty value", pattern: /"private_notes"\s*:\s*"[^"]+"/ },
  { label: "source_structure with content", pattern: /"source_structure"\s*:\s*\[\s*"/ },
  { label: "local_cursor_sdk runtime value", pattern: /local_cursor_sdk/ },
];

const portalLeaks = portalBlockedPatterns
  .filter(({ pattern }) => pattern.test(portalDataText))
  .map(({ label }) => label);

assert(
  portalLeaks.length === 0,
  `portalData public bundle leaked private PRISM/operator fields: ${portalLeaks.join(", ")}. ` +
    `These must live behind getCanonicalProgramFull (server-side), not in src/data/instructionalSampleData.js.`,
);

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
  /requestedOwnerMode\s*&&\s*ownerAccess\.allowed/.test(programHelperSource),
  "ProgramHelper must only honor requested owner mode when owner access is allowed.",
);

assert(
  /!ownerAccess\.allowed\s*&&\s*mode\s*===\s*["']owner["']/.test(programHelperSource),
  "ProgramHelper must downgrade unauthorized owner mode back to demo.",
);

const generatedPackageFiles = [
  { file: "cts-master-package-v1.summary.json", packageId: "cts-master-package-v1" },
  { file: "cts-master-package-v1.components.json", packageId: "cts-master-package-v1" },
  { file: "cts-master-package-v1.manifest.json", packageId: "cts-master-package-v1" },
  { file: "cts-master-package-v1.authority-map.json", packageId: "cts-master-package-v1" },
  { file: "cts-rcs-10week-slide-templates.summary.json", packageId: "cts-rcs-10week-slide-templates" },
  { file: "cts-rcs-10week-slide-templates.components.json", packageId: "cts-rcs-10week-slide-templates" },
  { file: "cts-rcs-10week-slide-templates.manifest.json", packageId: "cts-rcs-10week-slide-templates" },
  { file: "cts-rcs-10week-slide-templates.authority-map.json", packageId: "cts-rcs-10week-slide-templates" },
  { file: "cts-rcs-10week-slide-templates.deck-index.json", packageId: "cts-rcs-10week-slide-templates" },
];

for (const { file, packageId } of generatedPackageFiles) {
  const url = new URL(`../content/packages/generated/${file}`, import.meta.url);
  assert(existsSync(url), `Missing generated CTS package artifact: ${file}`);
  const parsed = JSON.parse(readFileSync(url, "utf8"));
  assert(parsed.package_id === packageId, `${file} must describe ${packageId}.`);
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

const slideSummary = JSON.parse(
  readFileSync(
    new URL("../content/packages/generated/cts-rcs-10week-slide-templates.summary.json", import.meta.url),
    "utf8",
  ),
);

assert(
  slideSummary.source_package?.sha256 ===
    "C18A9A7547FCCB808C6509402765AAB859C30A786308305A5ABBD6B055B52470",
  "CTS slide template package SHA256 should match the expected source hash.",
);
assert(slideSummary.deck_count === 10, "CTS slide template package must include 10 weekly decks.");
assert(
  slideSummary.deck_index.every((deck) => deck.slide_count === 19),
  "Each CTS slide template deck should report 19 slides.",
);
assert(
  slideSummary.generation_support?.direct_pptx_editing === "disabled_until_fidelity_gate",
  "Direct PPTX editing must remain disabled until the fidelity gate passes.",
);

const generatedPackageText = generatedPackageFiles
  .map(({ file }) =>
    readFileSync(new URL(`../content/packages/generated/${file}`, import.meta.url), "utf8"),
  )
  .join("\n");

const generatedBlockedPatterns = [
  { label: "Windows path", pattern: /[A-Z]:\\/ },
  { label: "raw student field", pattern: /Student_Name|DOB_or_UniqueID|Case_Manager/ },
  { label: "raw restricted notes field", pattern: /Restricted_Notes|Notes_Restricted/ },
  { label: "raw restricted routing field", pattern: /HR_Review/ },
  { label: "raw placement field", pattern: /Employer_or_Program/ },
  { label: "raw slide content label", pattern: /speaker notes|raw slide text/i },
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

// --- src-tree and build-bundle PRISM token scan ---
//
// Static scan of every committed src/**/*.{js,jsx,ts,tsx} file (plus dist/**
// when a production build is present) for known PRISM-private tokens that
// must never ship to the public/demo frontend. These are owner-private
// framework concepts and source paths; if a file in src/ ever contains one
// of them, that's a regression and this script must fail.
const SRC_FILE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const BUNDLE_FILE_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".css", ".html"]);
const SCAN_IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".recovery",
  ".turbo",
  ".next",
  ".vercel",
]);

const PRISM_PRIVATE_TOKENS = [
  { label: "Worth Decoupling Protocol", pattern: /Worth Decoupling Protocol/ },
  { label: "Small Win Protocol", pattern: /Small Win Protocol/ },
  { label: "Odyssey Planning Protocol", pattern: /Odyssey Planning Protocol/ },
  { label: "belief_shift_rubric", pattern: /belief_shift_rubric/ },
  { label: "CATALYST_BLUEPRINT", pattern: /CATALYST_BLUEPRINT/ },
  {
    label: "canonical_spine/02_PROJECTS/PRISM/ path",
    pattern: /canonical_spine[\/\\]02_PROJECTS[\/\\]PRISM[\/\\]/,
  },
  { label: "INTERVENTION_LIBRARY", pattern: /INTERVENTION_LIBRARY/ },
  { label: "DIAGNOSTIC_PATTERNS", pattern: /DIAGNOSTIC_PATTERNS/ },
  { label: "CONCEPT_ONTOLOGY", pattern: /CONCEPT_ONTOLOGY/ },
  // M2 source-record-picker privacy guard. The owner-only inbox manifest must
  // never leak local-filesystem paths into the public bundle. The fixture in
  // the listOwnerInboxManifest function returns metadata-only fields
  // (file_name, rail_guess, privacy_guess, usable_for, confidence,
  // review_required); any appearance of these tokens inside src/ means a
  // developer accidentally bundled a local inbox manifest into the public
  // frontend.
  //
  // Note: bare "00_INBOX" is intentionally NOT a token here because the
  // public CANONICAL://00_INBOX/... virtual namespace pre-exists in
  // instructionalSampleData.js as a public-safe URI, not a local-FS leak.
  // The patterns below specifically target Dropbox-anchored local paths and
  // any "source_path" field that carries an absolute filesystem path.
  {
    label: "Dropbox CANONICAL 00_INBOX path (Windows-style)",
    pattern: /Dropbox\\CANONICAL\\00_INBOX/i,
  },
  {
    label: "Dropbox CANONICAL 00_INBOX path (POSIX-style)",
    pattern: /Dropbox\/CANONICAL\/00_INBOX/i,
  },
  {
    label: "Dropbox-anchored 00_INBOX path",
    pattern: /Dropbox[\\\/][^"'`\s]*00_INBOX/i,
  },
  {
    label: "source_path field with absolute Windows path",
    pattern: /"source_path"\s*:\s*"[A-Za-z]:[\\\/]/,
  },
  {
    label: "source_path field with absolute POSIX path",
    pattern: /"source_path"\s*:\s*"\//,
  },
];

function walkFiles(rootDir, allowedExtensions) {
  if (!existsSync(rootDir)) return [];
  const out = [];
  function visit(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SCAN_IGNORE_DIRS.has(entry)) continue;
      const fullPath = path.join(dir, entry);
      let entryStat;
      try {
        entryStat = statSync(fullPath);
      } catch {
        continue;
      }
      if (entryStat.isDirectory()) {
        visit(fullPath);
      } else if (entryStat.isFile()) {
        const ext = path.extname(entry).toLowerCase();
        if (allowedExtensions.has(ext)) out.push(fullPath);
      }
    }
  }
  visit(rootDir);
  return out;
}

function scanForTokens(files, tokens, label) {
  const leaks = [];
  for (const file of files) {
    let contents;
    try {
      contents = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const token of tokens) {
      if (token.pattern.test(contents)) {
        leaks.push({
          scope: label,
          file: path.relative(repoRoot, file).replace(/\\/g, "/"),
          token: token.label,
        });
      }
    }
  }
  return leaks;
}

const srcRoot = path.join(repoRoot, "src");
const srcFiles = walkFiles(srcRoot, SRC_FILE_EXTENSIONS);
const srcLeaks = scanForTokens(srcFiles, PRISM_PRIVATE_TOKENS, "src");

const distRoot = path.join(repoRoot, "dist");
const distFiles = existsSync(distRoot)
  ? walkFiles(distRoot, BUNDLE_FILE_EXTENSIONS)
  : [];
const distLeaks = distFiles.length
  ? scanForTokens(distFiles, PRISM_PRIVATE_TOKENS, "dist")
  : [];

const allLeaks = [...srcLeaks, ...distLeaks];

if (allLeaks.length) {
  const summary = allLeaks
    .map((leak) => `[${leak.scope}] ${leak.file} :: ${leak.token}`)
    .join("\n  ");
  throw new Error(
    `PRISM private tokens leaked into bundle-scanned files:\n  ${summary}\n` +
      `These names must live behind server-gated owner functions (e.g. getCanonicalProgramFull), ` +
      `never inside src/ or the production bundle.`,
  );
}

console.log("PRISM_DTJL privacy QA passed.");
console.log("Demo view: summary-only, no private module/source payload.");
console.log("portalData bundle scan: no PRISM-private or operator-private fields leaked into the public JS bundle.");
console.log("PV102 remains the accessible public demo sample.");
console.log("CTS package proof QA passed: generated JSON parses and public proof text is sanitized.");
console.log("CTS slide template proof QA passed: 10 decks, 19 slides each, direct PPTX editing gated.");
console.log(
  `src tree scan: ${srcFiles.length} files scanned, 0 PRISM private tokens present.`,
);
if (distFiles.length) {
  console.log(
    `dist bundle scan: ${distFiles.length} files scanned, 0 PRISM private tokens present.`,
  );
} else {
  console.log(
    "dist bundle scan: skipped (no dist/ directory present; build before publish to re-enable this check).",
  );
}
