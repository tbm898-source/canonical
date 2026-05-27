#!/usr/bin/env node
/**
 * CANONICAL Program Generation Pipeline v0.1 — local dry-run inbox scanner.
 *
 * Strict guarantees enforced by this script:
 *   - read-only: never moves, renames, deletes, or modifies any source file
 *   - metadata-only: never extracts document body content by default
 *   - offline: never calls Base44, Dropbox, GitHub, Classroom, ClickUp, or any
 *     external network endpoint
 *   - sandboxed: writes only to .recovery/inbox-scan/ inside the workspace
 *
 * Outputs (all under .recovery/inbox-scan/, gitignored):
 *   - inbox-manifest.dry-run.json
 *   - source-records.dry-run.json
 *   - scan-report.dry-run.md
 *
 * Usage:
 *   node scripts/scan-inbox-dry-run.mjs
 *   node scripts/scan-inbox-dry-run.mjs --inbox "<path>" --rail auto
 *
 * Defaults:
 *   --inbox  C:\Users\Tim Milkewicz\Dropbox\CANONICAL\00_INBOX
 *   --rail   auto
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const DEFAULT_INBOX =
  "C:\\Users\\Tim Milkewicz\\Dropbox\\CANONICAL\\00_INBOX";
const OUTPUT_DIR = path.join(ROOT, ".recovery", "inbox-scan");

const RAIL_CHOICES = new Set(["auto", "aya", "prism", "canonical"]);

const OUTPUT_TYPES = [
  "daily_run",
  "slide_outline",
  "student_handout",
  "quiz",
  "instructor_guide",
  "evidence_checklist",
  "google_classroom_export",
  "prism_facilitator_overlay",
];

function nowIso() {
  return new Date().toISOString();
}

function parseArgs(argv) {
  const args = {
    inbox: DEFAULT_INBOX,
    rail: "auto",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--inbox" && argv[i + 1]) {
      args.inbox = argv[i + 1];
      i += 1;
    } else if (token === "--rail" && argv[i + 1]) {
      const rail = String(argv[i + 1]).toLowerCase();
      if (!RAIL_CHOICES.has(rail)) {
        throw new Error(
          `Invalid --rail value: ${rail}. Allowed: ${[...RAIL_CHOICES].join(", ")}`,
        );
      }
      args.rail = rail;
      i += 1;
    } else if (token === "--help" || token === "-h") {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node scripts/scan-inbox-dry-run.mjs [--inbox <path>] [--rail auto|aya|prism|canonical]",
      "",
      "Read-only, metadata-only inbox scanner.",
      "Outputs are written under .recovery/inbox-scan/ (gitignored).",
      "Never calls Base44, Dropbox, GitHub, Classroom, ClickUp, or any live connector.",
      "",
    ].join("\n"),
  );
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      // Skip symlinks to keep the scanner sandboxed and predictable.
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function classifyRailAndPrivacy(filePath, defaultRail) {
  const lower = filePath.replace(/\\/g, "/").toLowerCase();
  const fileName = path.basename(lower);

  const prismHit = /\b(prism|facilitator|catalyst_blueprint|owner_only|prism_private)\b/.test(
    lower,
  );
  const ayaHit = /\b(aya|cts|student|classroom|classflow|handout|quiz|rubric)\b/.test(
    lower,
  );
  const canonicalHit = /\b(canonical|spine|inbox|manifest|sop|template)\b/.test(
    lower,
  );

  let rail;
  let confidence;
  if (prismHit) {
    rail = "prism";
    confidence = "high";
  } else if (ayaHit) {
    rail = "aya";
    confidence = ayaHit && canonicalHit ? "medium" : "high";
  } else if (canonicalHit) {
    rail = "canonical";
    confidence = "medium";
  } else if (defaultRail && defaultRail !== "auto") {
    rail = defaultRail;
    confidence = "low";
  } else {
    rail = "unknown";
    confidence = "low";
  }

  let privacy;
  if (rail === "prism") privacy = "prism_private";
  else if (rail === "aya") privacy = "aya_classroom";
  else if (rail === "canonical") privacy = "canonical_internal";
  else privacy = "unknown";

  // Filename-based privacy hints can override low-confidence classifications.
  if (/owner_only|private|secret|key|token/.test(fileName)) {
    privacy = "prism_private";
    if (rail === "unknown") rail = "prism";
    confidence = "high";
  }

  return { rail, privacy, confidence };
}

function inferUsableFor(rail, fileName) {
  const lower = fileName.toLowerCase();
  const usable = new Set();
  if (rail === "prism") usable.add("prism_facilitator_overlay");
  if (rail === "aya" || rail === "canonical") {
    usable.add("daily_run");
    usable.add("instructor_guide");
    if (/quiz|assessment/.test(lower)) usable.add("quiz");
    if (/handout|packet|worksheet/.test(lower)) usable.add("student_handout");
    if (/slide|deck/.test(lower)) usable.add("slide_outline");
    if (/evidence|qc|checklist/.test(lower)) usable.add("evidence_checklist");
    if (/classroom/.test(lower)) usable.add("google_classroom_export");
  }
  // Filter to known output types only, sorted for determinism.
  return [...usable].filter((value) => OUTPUT_TYPES.includes(value)).sort();
}

function sourceRecordId(relPath, mtimeIso, byteSize) {
  const hash = crypto
    .createHash("sha256")
    .update(`${relPath}|${mtimeIso}|${byteSize}`)
    .digest("hex");
  return `sr_${hash.slice(0, 24)}`;
}

function buildSummary(records) {
  const summary = {
    total_files: records.length,
    by_rail: { aya: 0, prism: 0, canonical: 0, unknown: 0 },
    by_privacy: {
      public_demo: 0,
      aya_classroom: 0,
      canonical_internal: 0,
      prism_private: 0,
      unknown: 0,
    },
    by_confidence: { low: 0, medium: 0, high: 0 },
    review_required_count: 0,
  };
  for (const record of records) {
    summary.by_rail[record.rail_guess] += 1;
    summary.by_privacy[record.privacy_guess] += 1;
    summary.by_confidence[record.confidence] += 1;
    if (record.review_required) summary.review_required_count += 1;
  }
  return summary;
}

function scanReportMarkdown({ manifestId, inboxRoot, summary, warnings }) {
  const warnLines = warnings.length
    ? warnings.map((warn) => `- ${warn}`).join("\n")
    : "- None";
  return [
    "# Inbox Scan Dry Run",
    "",
    `- Manifest ID: ${manifestId}`,
    `- Inbox Root: ${inboxRoot}`,
    `- Generated At: ${nowIso()}`,
    `- Mode: dry_run (read-only, metadata-only)`,
    "",
    "## Posture",
    "",
    "- Read-only: no source file is moved, renamed, deleted, or modified.",
    "- Metadata-only: no document body content is extracted.",
    "- Offline: no Base44, Dropbox, GitHub, Classroom, ClickUp, or other live connector is called.",
    "- Output is written only under `.recovery/inbox-scan/` and is gitignored.",
    "",
    "## Summary",
    "",
    `- Total files: ${summary.total_files}`,
    `- Rail counts: aya=${summary.by_rail.aya}, prism=${summary.by_rail.prism}, canonical=${summary.by_rail.canonical}, unknown=${summary.by_rail.unknown}`,
    `- Privacy counts: public_demo=${summary.by_privacy.public_demo}, aya_classroom=${summary.by_privacy.aya_classroom}, canonical_internal=${summary.by_privacy.canonical_internal}, prism_private=${summary.by_privacy.prism_private}, unknown=${summary.by_privacy.unknown}`,
    `- Confidence: low=${summary.by_confidence.low}, medium=${summary.by_confidence.medium}, high=${summary.by_confidence.high}`,
    `- Files requiring review: ${summary.review_required_count}`,
    "",
    "## Warnings",
    "",
    warnLines,
    "",
  ].join("\n");
}

async function statSafe(filePath) {
  const stat = await fs.stat(filePath);
  return {
    byteSize: stat.size,
    mtime: stat.mtime,
  };
}

async function buildRecord(filePath, defaultRail) {
  const parsed = path.parse(filePath);
  const stat = await statSafe(filePath);
  const mtimeIso = stat.mtime.toISOString();
  const relPath = path.isAbsolute(filePath)
    ? filePath.replace(/\\/g, "/")
    : path.relative(ROOT, filePath).replace(/\\/g, "/");

  const { rail, privacy, confidence } = classifyRailAndPrivacy(
    filePath,
    defaultRail,
  );
  const usableFor = inferUsableFor(rail, parsed.base);
  const reviewRequired =
    confidence === "low" ||
    rail === "unknown" ||
    privacy === "prism_private" ||
    privacy === "unknown";
  const status = rail === "unknown" ? "needs_review" : "discovered";

  const warnings = [];
  if (privacy === "prism_private") {
    warnings.push(
      "PRISM-private candidate: keep out of public bundles and committed outputs.",
    );
  }
  if (rail === "unknown") {
    warnings.push("Rail could not be inferred. Owner review required.");
  }

  return {
    source_record_id: sourceRecordId(relPath, mtimeIso, stat.byteSize),
    source_path: relPath,
    file_name: parsed.base,
    extension: parsed.ext || "",
    byte_size: stat.byteSize,
    mtime: mtimeIso,
    discovered_at: nowIso(),
    rail_guess: rail,
    privacy_guess: privacy,
    usable_for: usableFor,
    confidence,
    review_required: reviewRequired,
    status,
    warnings,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const inboxAbs = path.isAbsolute(args.inbox)
    ? args.inbox
    : path.resolve(ROOT, args.inbox);

  if (!(await pathExists(inboxAbs))) {
    process.stderr.write(
      [
        `Inbox path not found: ${inboxAbs}`,
        "Tip: pass --inbox <existing folder> to test against a sample.",
        "No files were scanned, modified, or written.",
        "",
      ].join("\n"),
    );
    process.exitCode = 2;
    return;
  }

  const files = await walkFiles(inboxAbs);
  const records = [];
  for (const filePath of files) {
    records.push(await buildRecord(filePath, args.rail));
  }

  const summary = buildSummary(records);
  const manifestId = `inbox_manifest_${Date.now()}`;
  const inboxRootForOutput = path.isAbsolute(args.inbox)
    ? inboxAbs.replace(/\\/g, "/")
    : path.relative(ROOT, inboxAbs).replace(/\\/g, "/");

  const manifest = {
    manifest_id: manifestId,
    scan_mode: "dry_run",
    inbox_root: inboxRootForOutput,
    generated_at: nowIso(),
    summary,
    source_records: records,
    warnings: summary.by_rail.unknown
      ? [
          `Rail could not be inferred for ${summary.by_rail.unknown} file(s). Owner review required before generation.`,
        ]
      : [],
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(OUTPUT_DIR, "inbox-manifest.dry-run.json"),
    JSON.stringify(manifest, null, 2),
  );
  await fs.writeFile(
    path.join(OUTPUT_DIR, "source-records.dry-run.json"),
    JSON.stringify(records, null, 2),
  );
  await fs.writeFile(
    path.join(OUTPUT_DIR, "scan-report.dry-run.md"),
    scanReportMarkdown({
      manifestId,
      inboxRoot: inboxRootForOutput,
      summary,
      warnings: manifest.warnings,
    }),
  );

  process.stdout.write(
    [
      "CANONICAL inbox dry-run complete.",
      `  Inbox: ${inboxRootForOutput}`,
      `  Files scanned: ${summary.total_files}`,
      `  Review required: ${summary.review_required_count}`,
      `  Output: ${path.relative(ROOT, OUTPUT_DIR).replace(/\\/g, "/")}`,
      "  Posture: read-only, metadata-only, no live connectors.",
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  process.stderr.write(`Dry run failed: ${error.message}\n`);
  process.exitCode = 1;
});
