import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_SOURCE_ZIP = "C:/Users/Tim Milkewicz/Dropbox/CTS_Master_Package_v1.zip";
const EXPECTED_SHA256 =
  "203C14458493CC83678BC19006E03615B878CD7E047F37DFD9CCB831970BAB19";
const PACKAGE_ID = "cts-master-package-v1";
const GENERATED_DIR = path.resolve("content/packages/generated");

const sourceZipPath = process.argv[2] || process.env.CTS_MASTER_PACKAGE_ZIP || DEFAULT_SOURCE_ZIP;

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

function normalizeZipPath(zipPath) {
  return zipPath.replace(/\\/g, "/").replace(/^CTS_Master_Package_v1\//, "");
}

function readZipEntryText(entry) {
  return entry.getData().toString("utf8");
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
  return { headers, rows };
}

function groupCount(rows, field) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[field] || "Unspecified";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function fileKind(fileName) {
  if (fileName.endsWith(".zip")) return "archive";
  if (fileName.endsWith(".csv")) return "structured_csv";
  if (fileName.endsWith(".md")) return "playbook";
  if (fileName.endsWith(".txt")) return "readme";
  return "file";
}

function publicPurpose(fileName) {
  if (fileName.includes("Drive_Blueprint")) {
    return "Drive structure, source-to-drive mapping, KPI starter, and longitudinal tracking blueprint.";
  }
  if (fileName.includes("ClickUp_KPI_Kit")) {
    return "ClickUp-ready KPI and event-log templates for operational tracking.";
  }
  if (fileName.includes("Canonical_Content_Matrix_Summary")) {
    return "High-level inventory summary by week, module, artifact type, and authority.";
  }
  if (fileName.includes("Canonical_Content_Matrix")) {
    return "Detailed source inventory used to map curriculum and evidence assets.";
  }
  if (fileName.includes("Optional_Automations_Playbook")) {
    return "Optional ClickUp automation recipes for routing and reminders.";
  }
  if (fileName.includes("README")) {
    return "Package orientation and recommended order of use.";
  }
  return "Supporting package component.";
}

function nestedArchiveSummary(entry) {
  const nestedZip = new AdmZip(entry.getData());
  const entries = nestedZip.getEntries().filter((nestedEntry) => !nestedEntry.isDirectory);
  const csvEntries = entries.filter((nestedEntry) => nestedEntry.entryName.endsWith(".csv"));
  const readmeEntries = entries.filter((nestedEntry) => /readme/i.test(nestedEntry.entryName));

  return {
    archive_name: path.basename(entry.entryName),
    file_count: entries.length,
    csv_count: csvEntries.length,
    readme_count: readmeEntries.length,
    public_categories: entries.map((nestedEntry) => sanitizeNestedCategory(nestedEntry.entryName)),
  };
}

function sanitizeNestedCategory(entryName) {
  const base = path.basename(entryName);
  if (/Incident/i.test(base)) return "restricted operational log template present";
  if (/Students/i.test(base)) return "student roster import template present";
  if (/Attendance/i.test(base)) return "attendance log template present";
  if (/Safety/i.test(base)) return "safety check template present";
  if (/Skill/i.test(base)) return "skill signoff template present";
  if (/Placement/i.test(base)) return "placement follow-up template present";
  if (/KPI/i.test(base)) return "KPI definitions present";
  if (/Longitudinal/i.test(base)) return "longitudinal tracking template present";
  if (/Mapping/i.test(base)) return "source-to-drive mapping present";
  if (/README/i.test(base)) return "README present";
  return "supporting file present";
}

function restrictedIndicators(zip) {
  const indicators = [
    "RESTRICTED",
    "HR",
    "Student_Name",
    "DOB",
    "Incident",
    "Restricted_Notes",
    "Notes_Restricted",
    "Case_Manager",
    "Employer_or_Program",
  ];
  const textEntries = zip
    .getEntries()
    .filter((entry) => !entry.isDirectory && /\.(txt|md|csv)$/i.test(entry.entryName));
  const allText = textEntries.map((entry) => readZipEntryText(entry)).join("\n");

  return indicators
    .map((indicator) => ({
      indicator,
      count: (allText.match(new RegExp(indicator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [])
        .length,
    }))
    .filter((item) => item.count > 0)
    .map((item) => ({
      label:
        item.indicator === "HR"
          ? "restricted review/routing language present"
          : item.indicator === "Incident"
            ? "restricted operational indicator present"
            : `${item.indicator.replace(/_/g, " ").toLowerCase()} indicator present`,
      count: item.count,
    }));
}

function writeJson(fileName, data) {
  writeFileSync(path.join(GENERATED_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeMarkdown(fileName, summary, components, authorityMap) {
  const lines = [
    "# CTS Master Package v1",
    "",
    "This is a sanitized public proof summary. It confirms that the package exists and describes its operational role without publishing restricted template internals, private learner fields, raw rows, local paths, or private connector material.",
    "",
    "## Source Identity",
    `- Package ID: ${summary.package_id}`,
    `- Source ZIP: ${summary.source_package.file_name}`,
    `- SHA256: ${summary.source_package.sha256}`,
    `- Scope: ${summary.scope}`,
    `- Visibility: ${summary.visibility_scope}`,
    "",
    "## What It Proves",
    "- CTS has a real package-level operating spine, not only a landing page concept.",
    "- The package contains curriculum inventory, authority mapping, Drive blueprinting, KPI definitions, ClickUp templates, and optional automation guidance.",
    "- CANONICAL can parse an external package into safe, site-readable proof metadata without committing the raw ZIP.",
    "",
    "## Sanitized Components",
    ...components.top_level_components.map(
      (component) => `- ${component.name}: ${component.public_purpose}`,
    ),
    "",
    "## Authority Summary",
    ...authorityMap.authority_counts.map((item) => `- ${item.name}: ${item.count}`),
    "",
    "## Public Safety",
    ...summary.public_safety.public_may_show.map((item) => `- May show: ${item}`),
    ...summary.public_safety.public_must_not_show.map((item) => `- Must not show: ${item}`),
    "",
  ];

  writeFileSync(path.join(GENERATED_DIR, fileName), `${lines.join("\n")}\n`, "utf8");
}

if (!existsSync(sourceZipPath)) {
  throw new Error(`CTS package source ZIP not found. Set CTS_MASTER_PACKAGE_ZIP or pass a path. Tried: ${sourceZipPath}`);
}

mkdirSync(GENERATED_DIR, { recursive: true });

const zip = new AdmZip(sourceZipPath);
const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
const packageHash = sha256(sourceZipPath);
const topLevelEntries = entries.filter((entry) => normalizeZipPath(entry.entryName).split("/").length === 1);
const matrixEntry = entries.find((entry) => entry.entryName.endsWith("CTS_Canonical_Content_Matrix_v0.csv"));
const summaryEntry = entries.find((entry) =>
  entry.entryName.endsWith("CTS_Canonical_Content_Matrix_Summary_v0.csv"),
);
const matrix = matrixEntry ? parseCsv(readZipEntryText(matrixEntry)) : { headers: [], rows: [] };
const summaryMatrix = summaryEntry ? parseCsv(readZipEntryText(summaryEntry)) : { headers: [], rows: [] };
const sourceZips = [...new Set(matrix.rows.map((row) => row.zip).filter(Boolean))].sort();

const authorityCounts = groupCount(matrix.rows, "authority");
const artifactTypeCounts = groupCount(matrix.rows, "artifact_type");
const moduleCounts = groupCount(matrix.rows, "module");
const categoryCounts = groupCount(matrix.rows, "category");
const extensionCounts = groupCount(matrix.rows, "ext");

const summary = {
  package_id: PACKAGE_ID,
  title: "CTS Master Package v1",
  scope: "AYA_IMPLEMENTATION",
  visibility_scope: "aya_internal",
  public_exposure: "sanitized_proof_only",
  source_package: {
    file_name: path.basename(sourceZipPath),
    sha256: packageHash,
    expected_sha256: EXPECTED_SHA256,
    sha256_matches_expected: packageHash === EXPECTED_SHA256,
    source_path_redacted: true,
  },
  purpose:
    "Operational proof package for CTS: curriculum inventory, source authority mapping, Drive blueprinting, KPI/event-log templates, and optional automation guidance.",
  totals: {
    top_level_file_count: topLevelEntries.length,
    matrix_rows: matrix.rows.length,
    summary_rows: summaryMatrix.rows.length,
    referenced_source_zip_count: sourceZips.length,
    nested_archive_count: topLevelEntries.filter((entry) => entry.entryName.endsWith(".zip")).length,
  },
  public_safety: {
    public_may_show: [
      "package purpose",
      "file and component counts",
      "high-level authority summary",
      "sanitized operational relevance",
      "notice that restricted templates exist",
    ],
    public_must_not_show: [
      "restricted operational template fields",
      "restricted notes",
      "restricted review/routing internals",
      "local Windows paths",
      "raw CSV rows from restricted or operational templates",
    ],
  },
  restricted_posture: {
    restricted_templates_present: true,
    public_handling: "Acknowledge restricted operational templates without exposing field-level internals.",
    indicators: restrictedIndicators(zip),
  },
};

const components = {
  package_id: PACKAGE_ID,
  top_level_components: topLevelEntries.map((entry) => ({
    name: path.basename(entry.entryName),
    kind: fileKind(entry.entryName),
    size_bytes: entry.header.size,
    public_purpose: publicPurpose(entry.entryName),
  })),
  nested_archives: topLevelEntries
    .filter((entry) => entry.entryName.endsWith(".zip"))
    .map((entry) => nestedArchiveSummary(entry)),
  source_systems: [
    {
      label: "Google Drive",
      posture: "Blueprinted adapter/source organization from the older package design; translate into CANONICAL spine language before live writes.",
    },
    {
      label: "ClickUp",
      posture: "Dry-run/action-tracking adapter for KPI receipts and cohort operations; do not create live tasks in public/demo mode.",
    },
    {
      label: "Google Classroom",
      posture: "Downstream classroom delivery surface only; never the canonical source of truth.",
    },
  ],
};

const manifest = {
  package_id: PACKAGE_ID,
  generated_at: new Date().toISOString(),
  generator: "scripts/generate-cts-package-proof.mjs",
  source_package_file_name: path.basename(sourceZipPath),
  source_sha256: packageHash,
  source_path_redacted: true,
  raw_source_zip_committed: false,
  entry_counts: {
    top_level: topLevelEntries.length,
    total_entries: entries.length,
    csv_entries: entries.filter((entry) => entry.entryName.endsWith(".csv")).length,
    markdown_entries: entries.filter((entry) => entry.entryName.endsWith(".md")).length,
    text_entries: entries.filter((entry) => entry.entryName.endsWith(".txt")).length,
    nested_zip_entries: entries.filter((entry) => entry.entryName.endsWith(".zip")).length,
  },
  sanitized_manifest: topLevelEntries.map((entry) => ({
    name: path.basename(entry.entryName),
    kind: fileKind(entry.entryName),
    size_bytes: entry.header.size,
  })),
  referenced_source_packages: sourceZips,
  privacy_notes: [
    "No raw CSV rows are published in generated site content.",
    "No local filesystem path is written to generated package metadata.",
    "Restricted operational templates are summarized, not exposed field-by-field.",
  ],
};

const authorityMap = {
  package_id: PACKAGE_ID,
  authority_counts: authorityCounts,
  artifact_type_counts: artifactTypeCounts,
  module_counts: moduleCounts,
  category_counts: categoryCounts.slice(0, 20),
  extension_counts: extensionCounts,
  source_zip_counts: groupCount(matrix.rows, "zip"),
  interpretation: [
    "Canonical Program Master rows indicate promoted curriculum assets.",
    "Execution Evidence rows indicate cohort receipts and proof material.",
    "Reference rows preserve legacy or field-note context without making it binding.",
  ],
};

writeJson("cts-master-package-v1.summary.json", summary);
writeJson("cts-master-package-v1.components.json", components);
writeJson("cts-master-package-v1.manifest.json", manifest);
writeJson("cts-master-package-v1.authority-map.json", authorityMap);
writeMarkdown("cts-master-package-v1.summary.md", summary, components, authorityMap);

console.log(`Generated sanitized CTS package proof artifacts in ${GENERATED_DIR}`);
