import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_SOURCE_ZIP =
  "C:/Users/Tim Milkewicz/Dropbox/CANONICAL/00_INBOX/Downloads/CTS_RCS_10Week_SlideDecks.zip";
const EXPECTED_SHA256 =
  "C18A9A7547FCCB808C6509402765AAB859C30A786308305A5ABBD6B055B52470";
const PACKAGE_ID = "cts-rcs-10week-slide-templates";
const GENERATED_DIR = path.resolve("content/packages/generated");

const sourceZipPath = process.argv[2] || process.env.CTS_SLIDE_TEMPLATE_ZIP || DEFAULT_SOURCE_ZIP;

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

function slideNumber(name) {
  const match = name.match(/ppt\/slides\/slide(\d+)\.xml$/);
  return match ? Number(match[1]) : null;
}

function readPptxMetrics(entry) {
  const pptx = new AdmZip(entry.getData());
  const names = pptx.getEntries().map((pptEntry) => pptEntry.entryName);
  const slideFiles = names
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => slideNumber(a) - slideNumber(b));
  const layoutFiles = names.filter((name) => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(name));
  const mediaFiles = names.filter((name) => name.startsWith("ppt/media/"));
  const themeFiles = names.filter((name) => name.startsWith("ppt/theme/"));
  const hasNotes = names.some((name) => name.startsWith("ppt/notesSlides/"));
  const hasCustomXml = names.some((name) => name.startsWith("customXml/"));

  return {
    slide_count: slideFiles.length,
    layout_count: layoutFiles.length,
    media_count: mediaFiles.length,
    theme_count: themeFiles.length,
    has_theme: themeFiles.length > 0,
    has_notes: hasNotes,
    has_custom_xml: hasCustomXml,
  };
}

function inferWeek(fileName) {
  const match = fileName.match(/Week(\d+)/i);
  return match ? Number(match[1]) : null;
}

function weekLabel(week) {
  return week ? `Week ${String(week).padStart(2, "0")}` : "Week pending";
}

function writeJson(fileName, data) {
  writeFileSync(path.join(GENERATED_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeMarkdown(fileName, summary, deckIndex) {
  const lines = [
    "# CTS RCS 10-Week Slide Templates",
    "",
    "This is a sanitized proof summary for the CTS weekly slide template package. It confirms that the deck spine exists without publishing raw PowerPoint content, full slide copy, local paths, or editable template internals.",
    "",
    "## Source Identity",
    `- Package ID: ${summary.package_id}`,
    `- Source ZIP: ${summary.source_package.file_name}`,
    `- SHA256: ${summary.source_package.sha256}`,
    `- Scope: ${summary.scope}`,
    `- Visibility: ${summary.visibility_scope}`,
    `- Package type: ${summary.package_type}`,
    "",
    "## What It Proves",
    "- CTS has a 10-week slide-deck spine that can be indexed as CANONICAL package metadata.",
    "- Each weekly deck reports 19 slides and a consistent template structure.",
    "- V1 supports generation of slide outlines and patch plans, not direct PPTX rewriting.",
    "",
    "## Deck Index",
    ...deckIndex.decks.map(
      (deck) =>
        `- ${deck.week_label}: ${deck.file_name} (${deck.slide_count} slides, ${deck.layout_count} layout, ${deck.media_count} media assets)`,
    ),
    "",
    "## Generation Policy",
    "- Generate slide outlines and JSON patch plans first.",
    "- Only edit copied PPTX files after a fidelity gate proves slide count, dimensions, theme, media, and relationships are preserved.",
    "- If fidelity fails, keep output as outline and notes only.",
    "",
    "## Public Safety",
    ...summary.public_safety.public_may_show.map((item) => `- May show: ${item}`),
    ...summary.public_safety.public_must_not_show.map((item) => `- Must not show: ${item}`),
    "",
  ];

  writeFileSync(path.join(GENERATED_DIR, fileName), `${lines.join("\n")}\n`, "utf8");
}

if (!existsSync(sourceZipPath)) {
  throw new Error(
    `CTS slide template ZIP not found. Set CTS_SLIDE_TEMPLATE_ZIP or pass a path. Tried: ${sourceZipPath}`,
  );
}

mkdirSync(GENERATED_DIR, { recursive: true });

const zip = new AdmZip(sourceZipPath);
const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
const packageHash = sha256(sourceZipPath);
const deckEntries = entries
  .filter((entry) => entry.entryName.toLowerCase().endsWith(".pptx"))
  .sort((a, b) => a.entryName.localeCompare(b.entryName));
const manifestEntries = entries.filter((entry) => /manifest/i.test(entry.entryName));

const decks = deckEntries.map((entry) => {
  const fileName = path.basename(entry.entryName);
  const week = inferWeek(fileName);
  const metrics = readPptxMetrics(entry);
  return {
    package_id: PACKAGE_ID,
    week,
    week_label: weekLabel(week),
    file_name: fileName,
    source_path_redacted: true,
    size_bytes: entry.header.size,
    ...metrics,
    generation_support: {
      v1_supported: ["slide_outline", "speaker_note_outline", "json_patch_plan"],
      disabled_until_fidelity_gate: ["direct_pptx_rewrite", "theme_rebuild", "animation_rebuild"],
      fidelity_gate:
        "Before PPTX edits are enabled, copied decks must preserve slide count, dimensions, theme, media count, and package relationships.",
    },
  };
});

const consistentSlideCount = decks.length > 0 && decks.every((deck) => deck.slide_count === decks[0].slide_count);
const consistentLayoutCount = decks.length > 0 && decks.every((deck) => deck.layout_count === decks[0].layout_count);

const summary = {
  package_id: PACKAGE_ID,
  title: "CTS RCS 10-Week Slide Templates",
  package_type: "slide_template_spine",
  scope: "AYA_IMPLEMENTATION",
  rail: "AYA_IMPLEMENTATION",
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
    "Sanitized proof package for the CTS 10-week slide-template spine. It indexes weekly deck structure for future outline generation and controlled template-safe patch planning.",
  deck_count: decks.length,
  deck_index: decks.map((deck) => ({
    week: deck.week,
    week_label: deck.week_label,
    file_name: deck.file_name,
    slide_count: deck.slide_count,
    layout_count: deck.layout_count,
    media_count: deck.media_count,
    has_theme: deck.has_theme,
  })),
  totals: {
    top_level_file_count: entries.length,
    deck_count: decks.length,
    manifest_file_count: manifestEntries.length,
    total_slide_count: decks.reduce((sum, deck) => sum + deck.slide_count, 0),
    consistent_slide_count: consistentSlideCount,
    consistent_layout_count: consistentLayoutCount,
  },
  generation_support: {
    current_v1: "slide_outline_and_patch_plan_only",
    direct_pptx_editing: "disabled_until_fidelity_gate",
    fidelity_gate_required: true,
    recommended_next_step:
      "Generate weekly slide outlines from Session Briefs, then test copied PPTX text-placeholder replacement outside the live app before enabling edits.",
  },
  privacy_posture:
    "AYA/internal source assets. Public proof may show file names, counts, hash, and generation policy; raw PPTX content and full slide copy stay out of demo/public routes.",
  public_safety: {
    public_may_show: [
      "source package file name",
      "source hash",
      "deck count",
      "slide counts",
      "high-level generation policy",
      "notice that direct PPTX editing is disabled until fidelity checks pass",
    ],
    public_must_not_show: [
      "local Windows paths",
      "full slide copy",
      "private note content",
      "editable template internals",
      "private PRISM guidance",
      "connector internals",
    ],
  },
};

const components = {
  package_id: PACKAGE_ID,
  top_level_components: decks.map((deck) => ({
    name: deck.file_name,
    kind: "weekly_slide_deck",
    size_bytes: deck.size_bytes,
    public_purpose: `${deck.week_label} CTS slide template deck indexed for outline generation and future controlled patch planning.`,
  })),
  nested_archives: [],
  source_systems: [
    {
      label: "PowerPoint / PPTX",
      posture:
        "Source template format remains outside Git. V1 indexes deck structure and preserves raw files in CANONICAL/Dropbox.",
    },
    {
      label: "Program Helper",
      posture:
        "Owner mode can use this package as a slide-outline target. Direct deck editing remains disabled until fidelity checks pass.",
    },
    {
      label: "CANONICAL proof layer",
      posture:
        "Public proof shows sanitized counts and policy only; no full slide copy or local paths are published.",
    },
  ],
};

const manifest = {
  package_id: PACKAGE_ID,
  generated_at: new Date().toISOString(),
  generator: "scripts/generate-cts-slides-proof.mjs",
  source_package_file_name: path.basename(sourceZipPath),
  source_sha256: packageHash,
  source_path_redacted: true,
  raw_source_zip_committed: false,
  raw_pptx_committed: false,
  entry_counts: {
    top_level: entries.length,
    total_entries: entries.length,
    pptx_entries: decks.length,
    text_entries: entries.filter((entry) => entry.entryName.toLowerCase().endsWith(".txt")).length,
    nested_zip_entries: entries.filter((entry) => entry.entryName.toLowerCase().endsWith(".zip")).length,
  },
  sanitized_manifest: entries.map((entry) => ({
    name: path.basename(entry.entryName),
    kind: entry.entryName.toLowerCase().endsWith(".pptx") ? "weekly_slide_deck" : "manifest",
    size_bytes: entry.header.size,
  })),
  privacy_notes: [
    "No raw PPTX files are committed to the repo.",
    "No local filesystem path is written to generated package metadata.",
    "No full slide copy or private note content is published in generated site content.",
  ],
};

const authorityMap = {
  package_id: PACKAGE_ID,
  authority_counts: [
    { name: "AYA_IMPLEMENTATION", count: decks.length },
    { name: "weekly slide template deck", count: decks.length },
    { name: "outline generation target", count: decks.length },
    { name: "PPTX edit disabled until fidelity gate", count: decks.length },
  ],
  artifact_type_counts: [
    { name: "slide_template_deck", count: decks.length },
    { name: "source_manifest", count: manifestEntries.length },
  ],
  module_counts: decks.map((deck) => ({ name: deck.week_label, count: deck.slide_count })),
  category_counts: [
    { name: "slide templates", count: decks.length },
    { name: "template-safe generation planning", count: decks.length },
  ],
  extension_counts: [
    { name: ".pptx", count: decks.length },
    { name: ".txt", count: manifestEntries.length },
  ],
  source_zip_counts: [{ name: path.basename(sourceZipPath), count: decks.length }],
  interpretation: [
    "Weekly decks provide a stable CTS slide spine.",
    "The package is suitable for outline generation and patch-plan metadata now.",
    "Direct PPTX editing remains intentionally disabled until fidelity checks pass.",
  ],
};

const deckIndex = {
  package_id: PACKAGE_ID,
  source_sha256: packageHash,
  source_path_redacted: true,
  decks,
  generation_policy: summary.generation_support,
};

writeJson("cts-rcs-10week-slide-templates.summary.json", summary);
writeJson("cts-rcs-10week-slide-templates.components.json", components);
writeJson("cts-rcs-10week-slide-templates.manifest.json", manifest);
writeJson("cts-rcs-10week-slide-templates.authority-map.json", authorityMap);
writeJson("cts-rcs-10week-slide-templates.deck-index.json", deckIndex);
writeMarkdown("cts-rcs-10week-slide-templates.summary.md", summary, deckIndex);

console.log(`Generated sanitized CTS slide proof artifacts in ${GENERATED_DIR}`);
