import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Ban,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  FileJson,
  Files,
  FileText,
  GitBranch,
  Lock,
  PackageCheck,
  Play,
  Presentation,
  Printer,
  RefreshCcw,
  Shield,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { portalData } from "@/data/instructionalSampleData";
import packageIndex from "@content/packages/index.json";
import ctsPackageSummary from "@content/packages/generated/cts-master-package-v1.summary.json";
import slideTemplateSummary from "@content/packages/generated/cts-rcs-10week-slide-templates.summary.json";
import LiveIntegrationsPanel from "@/components/program-helper/LiveIntegrationsPanel";
import { useAuth } from "@/lib/AuthContext";
import { getCapabilityRegistry } from "@/lib/canonicalCapabilities";
import {
  CONNECTOR_MODES,
  buildExportManifest,
  createDefaultClassification,
} from "@/lib/canonicalConnectorPolicy";
import {
  getOwnerAccessState,
  normalizeRequestedMode,
  resolveWorkbenchMode,
} from "@/lib/ownerAccessPolicy";
import {
  PROGRAM_VIEW_MODES,
  getAccessibleModuleForProgram,
  getSafeProgramSeed,
  getVisiblePrograms,
  isDemoSummaryOnly,
} from "@/lib/programAccessPolicy";

const demoScopes = new Set(["demo_safe", "aya_safe", "prism_curated"]);

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

function getProgram(programId) {
  return portalData.programs.find((item) => item.id === programId);
}

function getModuleForProgram(program, mode) {
  return getAccessibleModuleForProgram(program, portalData.modules, mode);
}

function getBrief(briefId) {
  if (!briefId) return null;
  return portalData.session_briefs.find((item) => item.id === briefId);
}

function getBundle(briefId) {
  if (!briefId) return null;
  return portalData.session_bundles.find((item) => item.session_brief_id === briefId);
}

function safeArtifact(mode, artifact) {
  if (mode === "owner") return true;
  return demoScopes.has(artifact.visibility_scope);
}

function normalizeInput(rawInput, session) {
  const lines = rawInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = {
    completed: [],
    remaining: [],
    blocked: [],
    student_learning: [],
    evidence_captured: [],
  };
  const aliases = {
    completed: ["completed", "what was completed"],
    remaining: ["remaining", "what remains"],
    blocked: ["blocked", "blockers"],
    student_learning: ["student learning", "what did students learn"],
    evidence_captured: ["evidence captured", "evidence"],
    next_step: ["next step", "what should happen first next class"],
    actual_stage: ["actual stage"],
    program_key: ["program", "program key"],
    module_key: ["module", "module key"],
    session_title: ["session title"],
    session_date: ["date", "session date"],
  };

  let current = null;
  const normalized = {
    program_key: session.program_key,
    module_key: session.module_key,
    session_key: session.session_key,
    session_title: session.session_title,
    session_date: session.session_date,
    actual_stage: session.actual_stage,
    next_step: session.next_step,
  };

  const findAlias = (heading) => {
    const token = heading.toLowerCase().replace(/[:\-]/g, "").trim();
    return Object.keys(aliases).find((key) => aliases[key].includes(token)) ?? null;
  };

  for (const line of lines) {
    const headingOnly = line.match(/^([A-Za-z0-9 ?'\/]+):$/);
    if (headingOnly) {
      current = findAlias(headingOnly[1]);
      continue;
    }

    const inline = line.match(/^([A-Za-z0-9 ?'\/]+):\s*(.+)$/);
    if (inline) {
      const key = findAlias(inline[1]);
      if (key) {
        if (Array.isArray(sections[key])) {
          sections[key].push(inline[2].trim());
        } else {
          normalized[key] = inline[2].trim();
        }
        current = key;
        continue;
      }
    }

    if (/^[-*]\s+/.test(line)) {
      const item = line.replace(/^[-*]\s+/, "").trim();
      if (current && Array.isArray(sections[current])) {
        sections[current].push(item);
      }
    }
  }

  return { ...normalized, ...sections };
}

function prepareBundle(brief) {
  const moduleToken = brief.module_key.replace(/[^A-Za-z0-9]+/g, "_");
  const sessionTitle = titleWithoutModulePrefix(brief.session_title, brief.module_key);
  const token = sessionTitle.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const date = brief.session_date;
  return {
    aya: [
      `AYA_CTS_${moduleToken}_${token}_Session_Instructions_${date}.pdf`,
      `AYA_CTS_${moduleToken}_${token}_Student_Work_Log_${date}.pdf`,
      `AYA_CTS_${moduleToken}_${token}_QC_and_Evidence_Card_${date}.pdf`,
      "AYA_CTS_Adaptive_Daily_Template_v1.pdf",
    ],
    prism: [
      `PRISM_${moduleToken}_${token}_Facilitator_Overlay_${date}.pdf`,
      `PRISM_${moduleToken}_${token}_Framework_Packet_${date}.pdf`,
      "PRISM_AYA_AI_Continuity_Prompt_Template_v1.txt",
    ],
    downstream: [
      `${moduleToken}_${token}_Slides_${date}.pptx`,
      `${moduleToken}_${token}_Google_Classroom_Post_${date}.txt`,
      `${moduleToken}_${token}_Complete_Filed_Package_${date}.zip`,
    ],
  };
}

function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  };
  return String(value).replace(/[&<>"']/g, (char) => replacements[char]);
}

function slugify(value, fallback = "session") {
  const token = String(value ?? "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return token || fallback;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleWithoutModulePrefix(title, moduleKey) {
  if (!moduleKey) return title;
  const trimmed = String(title || "").trim();
  const pattern = new RegExp(`^${escapeRegExp(moduleKey)}\\s*[-–—:]?\\s*`, "i");
  return trimmed.replace(pattern, "") || trimmed;
}

function listOrFallback(items, fallback) {
  return Array.isArray(items) && items.length ? items : [fallback];
}

function markdownList(items, fallback = "Not provided in the rough notes.") {
  return listOrFallback(items, fallback).map((item) => `- ${item}`).join("\n");
}

function numberedList(items, fallback = "Not provided in the rough notes.") {
  return listOrFallback(items, fallback).map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function buildSessionBriefMarkdown(brief) {
  return `# ${brief.session_title}

- Date: ${brief.session_date || "Not provided"}
- Program: ${brief.program_key || "AYA_CTS"}
- Module: ${brief.module_key || "Not provided"}
- Actual stage: ${brief.actual_stage || "Not provided"}

## Completed
${markdownList(brief.completed)}

## Remaining
${markdownList(brief.remaining)}

## Blocked
${markdownList(brief.blocked, "No blocker was provided. Verify before using this as an official plan.")}

## Student learning
${markdownList(brief.student_learning)}

## Evidence captured
${markdownList(brief.evidence_captured)}

## First next step
${brief.next_step || "Not provided in the rough notes."}`;
}

function buildGeneratedDayPackage(brief, connectorMode = CONNECTOR_MODES.DEMO) {
  const safeBrief = {
    program_key: brief.program_key || "AYA_CTS",
    module_key: brief.module_key || "MODULE_PENDING",
    session_key: brief.session_key || `${brief.module_key || "MODULE_PENDING"}_${slugify(brief.session_title)}`,
    session_title: brief.session_title || "Untitled instructional session",
    session_date: brief.session_date || "date_pending",
    actual_stage: brief.actual_stage || "Actual stage not provided",
    completed: listOrFallback(brief.completed, "Not provided in the rough notes."),
    remaining: listOrFallback(brief.remaining, "Not provided in the rough notes."),
    blocked: listOrFallback(brief.blocked, "No blocker was provided. Verify before using this as an official plan."),
    student_learning: listOrFallback(brief.student_learning, "Not provided in the rough notes."),
    evidence_captured: listOrFallback(brief.evidence_captured, "Not provided in the rough notes."),
    next_step: brief.next_step || "Not provided in the rough notes.",
  };
  const bundlePlan = prepareBundle(safeBrief);
  const token = slugify(
    `${safeBrief.module_key}_${titleWithoutModulePrefix(safeBrief.session_title, safeBrief.module_key)}_${safeBrief.session_date}`,
    "daily_packet",
  );
  const sessionBriefMarkdown = buildSessionBriefMarkdown(safeBrief);
  const classification = createDefaultClassification(safeBrief, connectorMode);

  const ayaDailyPlan = `# ${safeBrief.session_title} - AYA/CTS Daily Plan

## Day focus
${safeBrief.actual_stage}

## Opening huddle
- State the actual class/session stage plainly.
- Name the top targets for today.
- Confirm safety, tools, roles, and evidence expectations.

## Session targets
${markdownList(safeBrief.remaining)}

## Suggested flow
1. Opening huddle and safety reset.
2. Task block tied to the highest-priority remaining work.
3. Quality/safety pause before any submission, upload, lab, or demo step.
4. Evidence capture: photos, student notes, and carry-forward details.
5. Cleanup and next-session handoff.

## End-of-day evidence
${markdownList(safeBrief.evidence_captured)}

## First next step
${safeBrief.next_step}`;

  const studentBuildLog = `# Student Work Log - ${safeBrief.session_title}

## Name / role
- Name:
- Role today:
- Time on task:

## What I worked on
${markdownList(safeBrief.remaining)}

## What I learned
${markdownList(safeBrief.student_learning)}

## Reflection prompts
- What detail mattered most today?
- What problem did our team solve?
- What still needs attention next class?`;

  const qcEvidenceCard = `# QC and Evidence Card - ${safeBrief.session_title}

## Completion / readiness checks
${markdownList(safeBrief.remaining.map((item) => `${item} - complete / partial / not started`))}

## Known blockers
${markdownList(safeBrief.blocked)}

## Evidence to capture
${markdownList(safeBrief.evidence_captured)}

## Carry-forward
${safeBrief.next_step}`;

  const classroomCopy = `# Google Classroom Draft - ${safeBrief.session_title}

Today we are working from the real project status, not an ideal calendar stage.

## Goals
${markdownList(safeBrief.remaining)}

## Turn in / capture
${markdownList(safeBrief.evidence_captured)}

## Reflection
${numberedList(safeBrief.student_learning)}

## Next class
${safeBrief.next_step}`;

  const slideOutline = `# Slide / Deck Outline - ${safeBrief.session_title}

1. Session status
   - ${safeBrief.actual_stage}
2. What is already complete
${safeBrief.completed.map((item) => `   - ${item}`).join("\n")}
3. Today's targets
${safeBrief.remaining.map((item) => `   - ${item}`).join("\n")}
4. Blockers and decisions
${safeBrief.blocked.map((item) => `   - ${item}`).join("\n")}
5. Evidence and reflection
${safeBrief.evidence_captured.map((item) => `   - ${item}`).join("\n")}
6. Next-session handoff
   - ${safeBrief.next_step}`;

  const prismCurated = `# Curated PRISM Framing - Demo Safe

This session is framed as adaptive instructional continuity: name the actual stage, protect quality, capture evidence, and generate the next day from real status.

## Public-safe framing
- Keep AYA/CTS outputs clean, student-safe, and institution-safe.
- Treat evidence as part of instruction, not afterthought paperwork.
- Use the Session Brief as the bridge between messy classflow and reusable delivery materials.
- Keep raw PRISM facilitator logic private unless deliberately curated for demo use.`;

  const filingPlan = `# Filing / Package Plan

## AYA rail
${markdownList(bundlePlan.aya)}

## PRISM rail
${markdownList(bundlePlan.prism)}

## Slides + Classroom
${markdownList(bundlePlan.downstream)}

## Source-of-truth note
CANONICAL remains the authoritative file spine. This demo preview prepares structured content and package metadata without writing private files.`;

  const classroomDraft = {
    title: `${safeBrief.session_title} - AYA/CTS Session Materials`,
    body: `Today we are working from the real project status: ${safeBrief.actual_stage}. Complete the assigned work, evidence capture, and reflection prompts.`,
    topic: safeBrief.module_key,
    materials: bundlePlan.aya,
    due_date: null,
    visibility_scope: "aya_classroom",
  };
  const clickupTaskCandidates = [
    ...safeBrief.remaining.map((item, index) => ({
      id: `remaining_${index + 1}`,
      name: `Complete: ${item}`,
      description: item,
      tags: ["aya", "review"],
    })),
    ...safeBrief.blocked.map((item, index) => ({
      id: `blocker_${index + 1}`,
      name: `Resolve blocker: ${item}`,
      description: item,
      tags: ["admin", "blocked"],
    })),
    {
      id: "evidence_capture",
      name: "Confirm evidence capture",
      description: safeBrief.evidence_captured.join("; "),
      tags: ["evidence", "canonical"],
    },
  ];
  const warnings = [
    ...classification.warnings,
    "Dropbox writes require read-only spine discovery and owner-approved destination.",
    "Classroom and ClickUp adapters are dry-run only in V1.",
  ];
  const exportManifest = buildExportManifest({
    artifact_id: `${classification.session_key}_${classification.artifact_type}`,
    classification,
    saved_at: null,
    destination_path: "",
    saved_files: [],
    classroom_draft_status: "prepared",
    clickup_draft_status: "prepared",
    warnings,
  });
  const packetJson = {
    packet_metadata: {
      ...classification,
      version: "canonical-connector-spine-v2",
      generated_at: exportManifest.generated_at,
    },
    student_materials: [
      studentBuildLog,
      qcEvidenceCard,
    ],
    instructor_materials: [
      ayaDailyPlan,
      filingPlan,
    ],
    quiz_materials: [],
    answer_key_materials: [],
    slide_outline: slideOutline.split("\n").filter(Boolean),
    classroom_draft: classroomDraft,
    clickup_task_candidates: clickupTaskCandidates,
    facilitator_overlay:
      classification.visibility_scope === "prism_private" ? prismCurated : null,
    ai_continuity_notes:
      classification.visibility_scope === "prism_private" ? safeBrief.next_step : null,
    export_manifest: exportManifest,
    warnings,
  };
  const packetMetadataMarkdown = `# ${safeBrief.session_title}

## Metadata
- Module: ${classification.module_key}
- Session: ${classification.session_key}
- Date: ${classification.session_date}
- Rail: ${classification.rail}
- Visibility: ${classification.visibility_scope}
- Artifact Type: ${classification.artifact_type}
- Generator Version: ${exportManifest.generator_version}

## Export Manifest
\`\`\`json
${JSON.stringify(exportManifest, null, 2)}
\`\`\`

## Warnings
${markdownList(warnings, "No warnings.")}`;

  const packetMarkdown = [
    packetMetadataMarkdown,
    sessionBriefMarkdown,
    ayaDailyPlan,
    studentBuildLog,
    qcEvidenceCard,
    classroomCopy,
    slideOutline,
    prismCurated,
    filingPlan,
  ].join("\n\n---\n\n");

  return {
    brief: safeBrief,
    token,
    jsonFilename: `${token}_demo_agent_packet.json`,
    markdownFilename: `${token}_demo_agent_packet.md`,
    sessionBriefMarkdown,
    ayaDailyPlan,
    studentBuildLog,
    qcEvidenceCard,
    classroomCopy,
    slideOutline,
    prismCurated,
    filingPlan,
    packetMarkdown,
    packetJson,
    classification,
    exportManifest,
    warnings,
    exportJson: JSON.stringify(
      {
        export_type: "demo_safe_instructional_packet",
        generated_by: "CANONICAL demo agent preview",
        privacy_note:
          "This export is demo-safe. It does not include raw PRISM private notes, local paths, API keys, draft logs, or approval controls.",
        classification,
        packet_json: packetJson,
        export_manifest: exportManifest,
          session_brief: safeBrief,
        outputs: {
          aya_daily_plan: ayaDailyPlan,
          student_work_log: studentBuildLog,
          qc_evidence_card: qcEvidenceCard,
          google_classroom_copy: classroomCopy,
          slide_outline: slideOutline,
          prism_curated_framing: prismCurated,
          filing_plan: filingPlan,
        },
        bundle_plan: bundlePlan,
      },
      null,
      2,
    ),
  };
}

function downloadText(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function printPacket(title, content) {
  const printWindow = window.open("", "_blank", "width=920,height=720");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Georgia, "Times New Roman", serif; color: #111; margin: 40px; line-height: 1.5; }
      pre { white-space: pre-wrap; font-family: inherit; font-size: 12pt; }
      @page { margin: 0.65in; }
    </style>
  </head>
  <body>
    <pre>${escapeHtml(content)}</pre>
    <script>window.onload = () => window.print();</script>
  </body>
</html>`);
  printWindow.document.close();
}

function BrandMark({ small = false }) {
  return (
    <div
      className={`${small ? "h-7 w-7 rounded-lg" : "h-10 w-10 rounded-xl"} flex items-center justify-center bg-[#0a0a0a]`}
    >
      <span className={`${small ? "text-xs" : "text-sm"} font-bold tracking-tight text-white`}>C</span>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-semibold text-[#0a0a0a]">{value}</div>
    </div>
  );
}

function Surface({ children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-black/5 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title, icon: Icon }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
      )}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
          {eyebrow}
        </div>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#0a0a0a]">
          {title}
        </h3>
      </div>
    </div>
  );
}

function AccessModeSwitcher({ owner, ownerAccessAllowed, onOwner, onDemo }) {
  return (
    <div data-testid="access-mode-switcher">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-[#0a0a0a]/35">
            Access mode
          </div>
          <div className="mt-1 text-lg font-semibold text-[#0a0a0a]">
            {owner ? "Owner / Admin Workbench" : "Demo Viewer"}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          {owner ? "Admin controls" : "Read-only"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          data-testid="owner-workbench-button"
          variant={owner ? "default" : "outline"}
          className={owner ? "bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]" : ""}
          onClick={onOwner}
          disabled={!ownerAccessAllowed}
        >
          Owner/Admin
        </Button>
        <Button
          data-testid="demo-viewer-button"
          variant={owner ? "outline" : "default"}
          className={!owner ? "bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]" : ""}
          onClick={onDemo}
        >
          Demo
        </Button>
      </div>

      <p className="mt-5 text-sm leading-6 text-[#0a0a0a]/50">
        {owner
          ? "Owner / Admin Workbench shows private scaffolds, approval controls, connector previews, and draft-review lanes."
          : "Demo Viewer is presentation-safe: curated program cards, PV102 sample generation, and no private payloads or connector calls."}
        {!ownerAccessAllowed && " Owner / Admin Workbench requires an authenticated admin or owner login."}
      </p>
    </div>
  );
}

function ArtifactCard({ artifact, mode }) {
  const owner = mode === "owner";
  const scopeLabel = {
    owner_private: "Owner",
    prism_private: "PRISM",
    prism_curated: "Curated",
    aya_safe: "AYA",
    demo_safe: "Demo",
  }[artifact.visibility_scope] ?? "Item";

  return (
    <article className="rounded-xl border border-black/5 bg-[#fafafa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#0a0a0a]">{artifact.title}</h4>
          <p className="mt-1 text-sm leading-6 text-[#0a0a0a]/45">
            {owner ? artifact.notes : artifact.demo_summary || artifact.notes}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
          {scopeLabel}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/30">
        {artifact.artifact_type.replace(/_/g, " ")}
      </div>
      {owner ? (
        <pre className="mt-3 max-h-24 overflow-auto rounded-xl bg-white p-3 text-xs leading-5 text-[#0a0a0a]/55">
          {artifact.archive_member
            ? `${artifact.file_path}\n> ${artifact.archive_member}`
            : artifact.file_path}
        </pre>
      ) : (
        <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#0a0a0a]/45">
          Approved preview only
        </div>
      )}
    </article>
  );
}

function BundleList({ title, items }) {
  return (
    <div className="rounded-xl border border-black/5 bg-[#fafafa] p-4">
      <h4 className="text-sm font-semibold text-[#0a0a0a]">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-[#0a0a0a]/45">
        {items.map((item) => (
          <li key={item} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoryRail({ items }) {
  return (
    <section className="mb-6 rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-4">
        {items.map((item, index) => (
          <div key={item.title} className="relative rounded-2xl bg-[#fafafa] p-4">
            {index < items.length - 1 && (
              <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-indigo-300 md:block" />
            )}
            <div className="text-[11px] font-bold uppercase tracking-wide text-indigo-600">
              {item.label}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#0a0a0a]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/45">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoPresentationPanel({ owner, bundle }) {
  return (
    <Surface className="bg-gradient-to-br from-white to-indigo-50/60">
      <SectionTitle
        eyebrow={owner ? "Showable layer" : "Presentation mode"}
        title={owner ? "Curated demo narrative" : "What this portal is demonstrating"}
        icon={Presentation}
      />
      <div className="grid gap-3 text-sm leading-6 text-[#0a0a0a]/55">
        <p>
          {owner
            ? "This is the safe walkthrough layer: it explains the system without exposing raw PRISM internals, draft folders, API keys, or local file paths."
            : bundle.demo_summary}
        </p>
        <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Demo script
          </div>
          <ol className="mt-3 space-y-2">
            <li>1. Start with real session status.</li>
            <li>2. Show the normalized Session Brief.</li>
            <li>3. Show AYA-safe outputs and curated PRISM framing.</li>
            <li>4. Explain that CANONICAL files remain authoritative.</li>
          </ol>
        </div>
      </div>
    </Surface>
  );
}

function BriefQualityPanel({ checks }) {
  return (
    <Surface>
      <SectionTitle eyebrow="Brief quality" title="Session Brief readiness checks" icon={ClipboardCheck} />
      <div className="grid gap-3">
        {checks.map((check) => (
          <div key={check.label} className="flex gap-3 rounded-2xl bg-[#fafafa] p-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <div className="text-sm font-semibold text-[#0a0a0a]">{check.label}</div>
              <p className="mt-1 text-sm leading-6 text-[#0a0a0a]/45">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function ModeGuardrails({ owner, summaryOnly = false }) {
  const visibleItems = summaryOnly
    ? owner
      ? ["Private framework summary", "Import metadata", "Source structure names"]
      : ["Polished high-level overview only"]
    : owner
      ? ["PRISM-private artifacts", "Local draft run status", "Approval controls"]
      : ["Approved session summaries", "AYA-safe artifacts", "Curated PRISM overview"];
  const hiddenItems = summaryOnly
    ? owner
      ? ["Live connector writes until explicit approval"]
      : ["Private scaffold details", "Owner review material", "Operational controls"]
    : owner
      ? ["Demo restrictions are lifted only inside the authenticated owner workbench"]
      : ["Raw PRISM notes", "Agent logs and draft paths", "Approval and publish controls"];

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <Eye className="h-4 w-4" />
          Visible in this mode
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleItems.map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-800">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
          <Ban className="h-4 w-4" />
          Protected from this mode
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {hiddenItems.map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-rose-800">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExportAdapterPanel({ adapters }) {
  return (
    <Surface className="mb-6">
      <SectionTitle eyebrow="Future adapters" title="Approved bundle can feed other systems" icon={GitBranch} />
      <div className="grid gap-3 md:grid-cols-3">
        {adapters.map((adapter) => (
          <article key={adapter.label} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#0a0a0a]">{adapter.label}</h4>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {adapter.status}
                </p>
              </div>
              <PackageCheck className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/45">{adapter.scope}</p>
          </article>
        ))}
      </div>
    </Surface>
  );
}

function SlideTemplateSpinePanel({ summary }) {
  return (
    <Surface className="mb-6">
      <SectionTitle eyebrow="Owner slide spine" title="CTS 10-week template readiness" icon={Presentation} />
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Generation posture
          </div>
          <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/60">
            {summary.generation_support.current_v1.replace(/_/g, " ")}. Direct PPTX editing stays disabled until the fidelity gate proves copied decks preserve their structure.
          </p>
          <a
            href="/Packages/cts-rcs-10week-slide-templates"
            className="mt-4 inline-flex rounded-xl bg-[#0a0a0a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
          >
            View slide proof
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summary.deck_index.map((deck) => (
            <div key={deck.file_name} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                {deck.week_label}
              </div>
              <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#0a0a0a]">
                {deck.file_name}
              </p>
              <p className="mt-3 text-xs leading-5 text-[#0a0a0a]/45">
                {deck.slide_count} slides / {deck.layout_count} layout / {deck.media_count} media
              </p>
            </div>
          ))}
        </div>
      </div>
    </Surface>
  );
}

function BoundaryPanel({ boundaries }) {
  return (
    <Surface className="mb-6">
      <SectionTitle eyebrow="Hard boundary model" title="What belongs where" icon={Shield} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {boundaries.map((boundary) => (
          <article key={boundary.key} className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
              {boundary.label}
            </div>
            <h4 className="mt-2 text-sm font-semibold text-[#0a0a0a]">{boundary.role}</h4>
            <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/50">{boundary.ownership}</p>
            <p className="mt-3 rounded-xl bg-white p-3 text-xs leading-5 text-[#0a0a0a]/45">
              {boundary.demo_rule}
            </p>
          </article>
        ))}
      </div>
    </Surface>
  );
}

function ProgramLibraryPanel({ programs, selectedProgramId, owner, onSelect }) {
  return (
    <Surface className="mb-6">
      <SectionTitle eyebrow="Program library" title="Choose the work surface" icon={BookOpen} />
      <p className="-mt-2 mb-5 text-sm leading-6 text-[#0a0a0a]/50">
        {owner
          ? "Owner Workbench can open private PRISM scaffolds and delivery samples for review."
          : "Demo Viewer keeps PV102 usable while private PRISM programs appear only as polished overview cards."}
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {programs.map((program) => {
          const selected = selectedProgramId === program.id;
          const summaryOnly = isDemoSummaryOnly(program, owner ? PROGRAM_VIEW_MODES.OWNER : PROGRAM_VIEW_MODES.DEMO);
          const accessLabel = summaryOnly
            ? "Overview only"
            : owner && program.visibility_scope === "prism_private"
              ? "Owner private"
              : owner
                ? "Owner rail"
                : "Demo ready";
          return (
            <button
              key={program.id}
              type="button"
              data-testid={`program-card-${program.program_key}`}
              onClick={() => onSelect(program.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? "border-indigo-200 bg-indigo-50 shadow-sm"
                  : "border-black/5 bg-[#fafafa] hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                    {program.program_family || program.ownership_rail}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-[#0a0a0a]">{program.title}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0a0a0a]/45">
                  {accessLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#0a0a0a]/50">
                {program.demo_summary || program.description}
              </p>
            </button>
          );
        })}
      </div>
    </Surface>
  );
}

function OwnerPrivateBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
      <Lock className="h-3 w-3" /> Owner-private
    </span>
  );
}

function OwnerPrismDataPanel({ state, data, program, onRetry }) {
  const fetchedProgram = data?.program ?? null;
  const fetchedModules = Array.isArray(data?.modules) ? data.modules : [];
  const fetchedArtifacts = Array.isArray(data?.artifacts) ? data.artifacts : [];
  const fetchedWarnings = Array.isArray(data?.warnings) ? data.warnings : [];

  const sourceStructureFromArtifacts = (() => {
    for (const artifact of fetchedArtifacts) {
      const ss = artifact?.generated_json?.source_structure;
      if (Array.isArray(ss) && ss.length > 0) return ss;
    }
    return [];
  })();

  return (
    <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Surface className="bg-gradient-to-br from-white to-indigo-50/60">
        <div className="flex items-start justify-between gap-3">
          <SectionTitle
            eyebrow="Owner-private framework"
            title={program.title}
            icon={Lock}
          />
          <OwnerPrivateBadge />
        </div>
        <div className="grid gap-4 text-sm leading-6 text-[#0a0a0a]/55">
          <p>{fetchedProgram?.description || program.demo_summary || program.description}</p>
          {state === "ready" && fetchedProgram && (
            <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Boundary
              </div>
              <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/55">
                {fetchedArtifacts.find((a) => a?.generated_json?.boundary_statement)
                  ?.generated_json?.boundary_statement ||
                  "PRISM_DTJL is PRISM Core, private-first, demo-summary-only, and not AYA implementation."}
              </p>
            </div>
          )}
          {state === "loading" && (
            <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 text-sm text-[#0a0a0a]/55">
              Loading owner-private PRISM data from the Base44 backend...
            </div>
          )}
          {state === "not_seeded" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">No CanonicalProgram record yet for {program.program_key}.</div>
              <p className="mt-1">
                The public bundle no longer carries the private framework details. To populate the
                owner view, invoke the owner-only one-shot seed function{" "}
                <span className="font-mono">seedPrismDtjlFromBundle</span> from the Base44 console (or via an
                authenticated POST). Once seeded, reload this panel.
              </p>
              {fetchedWarnings.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-800/80">
                  {fetchedWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Retry fetch
              </Button>
            </div>
          )}
          {state === "error" && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
              <div className="font-semibold">Could not load owner PRISM data.</div>
              <p className="mt-1">{data?.error || "Unknown error."}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          )}
        </div>
      </Surface>

      <Surface>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle
            eyebrow="Owner source structure"
            title="Imported scaffold"
            icon={Shield}
          />
          <OwnerPrivateBadge />
        </div>
        {state === "ready" && fetchedProgram ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile label="Program key" value={fetchedProgram.program_key} />
              <MetricTile
                label="Module key"
                value={fetchedModules[0]?.module_key || "Not opened"}
              />
              <MetricTile
                label="Evidence"
                value={fetchedProgram.evidence_status || "Not tagged"}
              />
              <MetricTile
                label="Demo behavior"
                value={fetchedProgram.default_demo_behavior || "Not set"}
              />
            </div>
            {fetchedProgram.canonical_path && (
              <div className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                  Canonical pointer
                </div>
                <p className="mt-2 break-words text-sm text-[#0a0a0a]/55">
                  {fetchedProgram.canonical_path}
                </p>
              </div>
            )}
            {sourceStructureFromArtifacts.length > 0 && (
              <div className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                  Source structure
                </div>
                <ul className="mt-3 grid gap-2 text-sm text-[#0a0a0a]/55">
                  {sourceStructureFromArtifacts.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {fetchedProgram.owner_only_notes_path && (
              <div className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                  Owner-only notes pointer
                </div>
                <p className="mt-2 break-words text-sm text-[#0a0a0a]/55">
                  {fetchedProgram.owner_only_notes_path}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm leading-6 text-[#0a0a0a]/50">
            Source structure and owner pointers load from the authenticated Base44 backend, not from
            the public bundle. {state === "loading" ? "Loading..." : "Populate by seeding the Base44 entities."}
          </p>
        )}
      </Surface>
    </section>
  );
}

function ProgramOverviewPanel({ program, module, owner }) {
  const sourceStructure = owner && Array.isArray(module?.source_structure) ? module.source_structure : [];
  const summaryOnly = isDemoSummaryOnly(program, owner ? PROGRAM_VIEW_MODES.OWNER : PROGRAM_VIEW_MODES.DEMO);

  return (
    <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Surface className="bg-gradient-to-br from-white to-indigo-50/60">
        <SectionTitle
          eyebrow={summaryOnly ? "Demo-safe overview" : "Private framework"}
          title={program.title}
          icon={owner ? Lock : Eye}
        />
        <div className="grid gap-4 text-sm leading-6 text-[#0a0a0a]/55">
          <p>{program.demo_summary || program.description}</p>
          <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {owner ? "Boundary" : "Demo boundary"}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/55">
              {owner
                ? program.boundary_statement ||
                  "PRISM_DTJL is PRISM Core, private-first, demo-summary-only, and not AYA implementation."
                : "This view is intentionally limited to a polished overview. The full framework scaffold remains owner-only until deliberately curated."}
            </p>
          </div>
          {!owner && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-900">
              Demo mode shows only this polished overview. Deeper private material is withheld before render.
            </div>
          )}
        </div>
      </Surface>

      <Surface>
        <SectionTitle
          eyebrow={owner ? "Owner source structure" : "Protected material"}
          title={owner ? "Imported scaffold" : "Private by default"}
          icon={Shield}
        />
        {owner ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile label="Program key" value={program.program_key} />
              <MetricTile label="Module key" value={module?.module_key || "Not opened"} />
              <MetricTile label="Evidence" value={program.evidence_status || "Not tagged"} />
              <MetricTile label="Demo behavior" value={program.default_demo_behavior || "Not set"} />
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                Canonical pointer
              </div>
              <p className="mt-2 break-words text-sm text-[#0a0a0a]/55">{program.canonical_path}</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#fafafa] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                Source structure
              </div>
              <ul className="mt-3 grid gap-2 text-sm text-[#0a0a0a]/55">
                {sourceStructure.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-6 text-[#0a0a0a]/50">
            Detailed private material is not loaded into the demo path. This prevents accidental leakage through reused session, artifact, or helper components.
          </p>
        )}
      </Surface>
    </section>
  );
}

const packageSummaries = {
  "cts-master-package-v1": ctsPackageSummary,
  "cts-rcs-10week-slide-templates": slideTemplateSummary,
};

function PackageLibraryPanel({ owner }) {
  const packages = packageIndex.packages.map((item) => ({
    ...item,
    summary: packageSummaries[item.package_id],
  }));

  return (
    <Surface className="mb-6">
      <SectionTitle eyebrow="Package library" title="Available proof and template packages" icon={PackageCheck} />
      <div className="grid gap-4 lg:grid-cols-2">
        {packages.map((item) => {
          const summary = item.summary || {};
          return (
            <article key={item.package_id} className="rounded-2xl border border-black/5 bg-[#fafafa] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-[#0a0a0a]">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#0a0a0a]/55">
                    {summary.purpose || "Sanitized package metadata is available for this proof object."}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  {owner ? "Owner visible" : "Demo safe"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricTile label="Scope" value={summary.scope || item.scope || "Not set"} />
                <MetricTile label="Exposure" value={summary.public_exposure || item.public_exposure || "Sanitized"} />
                <MetricTile label="Hash" value={summary.source_package?.sha256_matches_expected ? "Verified" : "Recorded"} />
              </div>
              {owner && (
                <div className="mt-4 rounded-xl border border-black/5 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
                    Owner package metadata
                  </div>
                  <p className="mt-2 break-words text-sm text-[#0a0a0a]/55">
                    Source file: {summary.source_package?.file_name || "not recorded"}
                  </p>
                  <p className="mt-1 text-sm text-[#0a0a0a]/55">
                    Package type: {summary.package_type || "proof_package"}
                  </p>
                  <p className="mt-1 text-sm text-[#0a0a0a]/55">
                    Generation support: {summary.generation_support?.current_v1?.replace(/_/g, " ") || "metadata only"}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Surface>
  );
}

function OwnerDiagnosticsPanel({ ownerAccess, requestedMode, resolvedMode, user, capabilities }) {
  return (
    <Surface className="mb-6">
      <SectionTitle eyebrow="Owner diagnostics" title="Auth, mode, and capability state" icon={Shield} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Resolved mode" value={resolvedMode} />
        <MetricTile label="Owner access" value={ownerAccess.allowed ? "allowed" : "blocked"} />
        <MetricTile label="Access reason" value={ownerAccess.reason} />
        <MetricTile label="Role source" value={ownerAccess.roleSource} />
      </div>
      <div className="mt-4 rounded-2xl border border-black/5 bg-[#fafafa] p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
          Safe auth summary
        </div>
        <p className="mt-2 text-sm text-[#0a0a0a]/55">
          Requested mode: {requestedMode || "none"} / Authenticated as: {user?.email || "not signed in"} / Roles:{" "}
          {ownerAccess.roles.length ? ownerAccess.roles.join(", ") : "none detected"}
        </p>
      </div>
      <div className="mt-4 grid gap-2">
        {capabilities.map((capability) => (
          <div key={capability.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fafafa] p-3">
            <div>
              <div className="text-sm font-semibold text-[#0a0a0a]">{capability.label}</div>
              <div className="text-xs text-[#0a0a0a]/45">{capability.reason}</div>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]/55">
              {capability.status}
            </span>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function OutputPreviewCard({ title, content, onCopy }) {
  return (
    <article className="min-w-0 rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-[#0a0a0a]">{title}</h4>
        <button
          type="button"
          onClick={() => onCopy(content)}
          className="inline-flex items-center gap-1 rounded-full bg-[#fafafa] px-2.5 py-1 text-[11px] font-semibold text-[#0a0a0a]/45 transition hover:bg-indigo-50 hover:text-indigo-600"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#fafafa] p-3 text-xs leading-5 text-[#0a0a0a]/60">
        {content}
      </pre>
    </article>
  );
}

function DemoAgentWorkbench({
  mode,
  input,
  onInputChange,
  generatedPackage,
  onGenerate,
  onCopy,
  copyStatus,
  capabilities,
}) {
  const owner = mode === "owner";
  const outputCards = generatedPackage
    ? [
        ["Session Brief", generatedPackage.sessionBriefMarkdown],
        ["AYA Daily Plan", generatedPackage.ayaDailyPlan],
        ["Student Work Log", generatedPackage.studentBuildLog],
        ["QC / Evidence Card", generatedPackage.qcEvidenceCard],
        ["Google Classroom Copy", generatedPackage.classroomCopy],
        ["Slide / Deck Outline", generatedPackage.slideOutline],
        ["Curated PRISM Framing", generatedPackage.prismCurated],
        ["Filing Plan", generatedPackage.filingPlan],
      ]
    : [];

  return (
    <section id="agent-demo" className="mb-6 min-w-0 scroll-mt-24 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/70 p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            <Wand2 className="h-3.5 w-3.5" />
            {owner ? "Owner packet generator" : "Demo agent"}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#0a0a0a]">
            Generate a whole day packet from rough notes
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#0a0a0a]/50">
            Generate class packets, facilitator overlays, handouts, quizzes, export bundles, and canonical filing plans while keeping AYA and PRISM rails separate. Owner mode can pass generated packets to enabled backend actions; demo mode stays local and connector-free.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
          {owner ? "Owner available" : "Demo-safe, not saved"}
        </span>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="min-w-0 rounded-2xl border border-black/5 bg-white p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
            Rough classflow notes
          </label>
          <textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            className="mt-3 min-h-80 w-full min-w-0 resize-y rounded-2xl border border-black/5 bg-[#fafafa] p-4 text-sm leading-6 text-[#0a0a0a]/70 outline-none transition focus:border-indigo-200 focus:bg-white"
          />
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <Button className="gap-2 bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]" onClick={onGenerate}>
              <Wand2 className="h-4 w-4" />
              {owner ? "Generate owner packet" : "Generate demo day"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => downloadText(generatedPackage.jsonFilename, generatedPackage.exportJson, "application/json;charset=utf-8")}
              disabled={!generatedPackage}
            >
              <FileJson className="h-4 w-4" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => downloadText(generatedPackage.markdownFilename, generatedPackage.packetMarkdown)}
              disabled={!generatedPackage}
            >
              <Download className="h-4 w-4" />
              Export Markdown
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => printPacket(generatedPackage.brief.session_title, generatedPackage.packetMarkdown)}
              disabled={!generatedPackage}
            >
              <Printer className="h-4 w-4" />
              Print packet
            </Button>
          </div>
          {copyStatus && (
            <p className="mt-3 text-xs font-semibold text-emerald-700">{copyStatus}</p>
          )}
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {owner
              ? "Owner guardrail: generated packets stay draft-local until you run an enabled approval/export action."
              : "Demo guardrail: generated previews are temporary browser state. They do not create official CANONICAL files or expose raw PRISM notes."}
          </div>
          <div className="mt-4 rounded-2xl border border-black/5 bg-[#fafafa] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#0a0a0a]/35">
              {owner ? "Owner generator can prepare" : "Demo agent can prepare"}
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-5 text-[#0a0a0a]/50">
              {capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          {generatedPackage ? (
            <>
              <div className="grid min-w-0 gap-3 sm:grid-cols-3">
                <MetricTile label="Brief" value={generatedPackage.brief.session_title} />
                <MetricTile label="Outputs" value="8 demo-safe sections" />
                <MetricTile label="Export" value="JSON + Markdown + print" />
              </div>
              <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                {outputCards.map(([title, content]) => (
                  <OutputPreviewCard key={title} title={title} content={content} onCopy={onCopy} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-8 text-center">
              <div>
                <Files className="mx-auto h-10 w-10 text-indigo-300" />
                <h4 className="mt-4 text-lg font-semibold text-[#0a0a0a]">Ready when you are</h4>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#0a0a0a]/45">
                  Click Generate demo day to turn the rough notes into a printable packet preview.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ProgramHelper() {
  const query = new URLSearchParams(window.location.search);
  const { user, isAuthenticated } = useAuth();
  const ownerAccess = useMemo(
    () => getOwnerAccessState({ user, isAuthenticated }),
    [isAuthenticated, user],
  );
  const requestedMode = normalizeRequestedMode(query.get("mode") || "");
  const requestedOwnerMode = requestedMode === "owner";
  const shouldEnterOwnerByDefault = ownerAccess.liveOwnerAccess && !requestedMode;
  const initialMode = resolveWorkbenchMode({
    requestedMode,
    ownerAccess,
    hasExplicitMode: query.has("mode"),
  });
  const [mode, setMode] = useState(initialMode);
  const [entered, setEntered] = useState(query.has("mode") || shouldEnterOwnerByDefault);
  const [selectedProgramId, setSelectedProgramId] = useState(query.get("program") || portalData.programs[0].id);
  const [helperInput, setHelperInput] = useState(portalData.helper_seed_input);
  const [demoAgentInput, setDemoAgentInput] = useState(portalData.helper_seed_input);
  const [generatedPackage, setGeneratedPackage] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [runStatus, setRunStatus] = useState("draft_ready");
  const [prismDataState, setPrismDataState] = useState("idle");
  const [prismData, setPrismData] = useState(null);
  const [prismFetchKey, setPrismFetchKey] = useState(0);

  useEffect(() => {
    if (!ownerAccess.allowed && mode === "owner") {
      setMode("demo");
    }
  }, [mode, ownerAccess.allowed]);

  useEffect(() => {
    if (requestedOwnerMode && ownerAccess.allowed && mode !== "owner") {
      setMode("owner");
      setEntered(true);
    }
  }, [mode, ownerAccess.allowed, requestedOwnerMode]);

  useEffect(() => {
    if (!entered && shouldEnterOwnerByDefault) {
      setMode("owner");
      setEntered(true);
    }
  }, [entered, shouldEnterOwnerByDefault]);

  const owner = ownerAccess.allowed && mode === "owner";
  const viewMode = owner ? PROGRAM_VIEW_MODES.OWNER : PROGRAM_VIEW_MODES.DEMO;
  const visiblePrograms = useMemo(() => getVisiblePrograms(portalData.programs, viewMode), [viewMode]);
  const program = visiblePrograms.find((item) => item.id === selectedProgramId) ?? visiblePrograms[0];
  const module = getModuleForProgram(program, viewMode);

  const programKeyForFetch = program?.program_key;
  const programVisibilityForFetch = program?.visibility_scope;
  const shouldFetchPrismFull =
    owner && programVisibilityForFetch === "prism_private" && Boolean(programKeyForFetch);

  useEffect(() => {
    if (!shouldFetchPrismFull) {
      setPrismDataState("idle");
      setPrismData(null);
      return undefined;
    }

    let cancelled = false;
    setPrismDataState("loading");
    setPrismData(null);

    const run = async () => {
      try {
        const { base44 } = await import("@/api/base44Client");
        const response = await base44.functions.invoke("getCanonicalProgramFull", {
          program_key: programKeyForFetch,
        });
        if (cancelled) return;
        const result = response?.data ?? response;
        if (!result || result.success !== true) {
          setPrismData({
            error:
              result?.error ||
              "Failed to load owner PRISM data. Check that you are signed in as an admin and that the Base44 function is deployed.",
          });
          setPrismDataState("error");
          return;
        }
        if (!result.program) {
          setPrismData(result);
          setPrismDataState("not_seeded");
          return;
        }
        setPrismData(result);
        setPrismDataState("ready");
      } catch (error) {
        if (cancelled) return;
        setPrismData({
          error: error?.message || "Network or auth error while loading owner PRISM data.",
        });
        setPrismDataState("error");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [shouldFetchPrismFull, programKeyForFetch, prismFetchKey]);

  const brief = getBrief(module?.session_ids?.[0]);
  const bundle = getBundle(brief?.id);
  const summaryOnly = isDemoSummaryOnly(program, viewMode) || !brief || !bundle;

  const normalized = useMemo(() => (brief ? normalizeInput(helperInput, brief) : null), [helperInput, brief]);
  const demoNormalized = useMemo(() => (brief ? normalizeInput(demoAgentInput, brief) : null), [demoAgentInput, brief]);
  const bundlePlan = useMemo(() => (normalized ? prepareBundle(normalized) : null), [normalized]);
  const artifacts = bundle
    ? portalData.artifacts
        .filter((artifact) => artifact.session_bundle_id === bundle.id)
        .filter((artifact) => safeArtifact(mode, artifact))
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const ayaArtifacts = artifacts.filter((artifact) => artifact.rail === "aya" || artifact.rail === "shared");
  const prismArtifacts = artifacts.filter((artifact) => artifact.rail === "prism");
  const agentRun = brief
    ? portalData.agent_runs?.find((run) => run.session_key === brief.session_key) ?? portalData.agent_runs?.[0]
    : null;
  const capabilities = useMemo(
    () => getCapabilityRegistry({ owner, generatedPackage }),
    [generatedPackage, owner],
  );

  const handleSelectProgram = (programId) => {
    const nextRawProgram = getProgram(programId);
    const nextProgram = getVisiblePrograms(portalData.programs, viewMode).find((item) => item.id === programId) ?? nextRawProgram;
    const nextSeed = getSafeProgramSeed(nextProgram, portalData.helper_seed_input, viewMode);
    setSelectedProgramId(programId);
    setHelperInput(nextSeed);
    setDemoAgentInput(nextSeed);
    setGeneratedPackage(null);
    setRunStatus("draft_ready");
  };

  const handleGenerateDemoPackage = () => {
    if (!demoNormalized) {
      setCopyStatus("This program is overview-only in the current mode.");
      window.setTimeout(() => setCopyStatus(""), 1800);
      return;
    }
    setGeneratedPackage(
      buildGeneratedDayPackage(
        demoNormalized,
        owner ? CONNECTOR_MODES.OWNER_PREVIEW : CONNECTOR_MODES.DEMO,
      ),
    );
    setCopyStatus(owner ? "Owner packet generated. Export actions are ready." : "Demo packet generated. Exports are ready.");
    window.setTimeout(() => setCopyStatus(""), 1800);
  };

  const handleCopyOutput = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus("Copied to clipboard.");
    } catch {
      downloadText("canonical_demo_output.txt", content);
      setCopyStatus("Clipboard unavailable, so I downloaded a text copy instead.");
    }
    window.setTimeout(() => setCopyStatus(""), 1800);
  };

  const showOwnerWorkbench = () => {
    if (!ownerAccess.allowed) return;
    setMode("owner");
    setEntered(true);
  };

  const showDemoViewer = () => {
    setMode("demo");
    setEntered(true);
  };

  if (!entered) {
    return (
      <div className="min-h-screen overflow-hidden bg-[#fafafa]">
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <BrandMark small />
              <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
                CANONICAL
              </span>
            </div>
            <button
              type="button"
              onClick={showDemoViewer}
              className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]"
            >
              Open Demo Viewer
            </button>
          </div>
        </nav>

        <main className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-28 lg:grid-cols-[1.05fr_0.85fr]">
          <motion.section initial="hidden" animate="visible" className="max-w-3xl">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5"
            >
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
              <span className="text-xs font-medium tracking-wide text-indigo-600">
                PRISM HELPER
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl font-bold leading-[1.05] tracking-tight text-[#0a0a0a] sm:text-7xl"
            >
              CANONICAL Program
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Helper.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-8 max-w-xl text-lg leading-relaxed text-[#0a0a0a]/50"
            >
              A two-view instructional workbench: Owner / Admin Workbench for private PRISM/CANONICAL operations, and Demo Viewer for safe presentation access.
            </motion.p>
          </motion.section>

          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-2xl shadow-black/[0.04]">
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-[#0a0a0a]">
              Choose presentation view
            </h2>
            <AccessModeSwitcher
              owner={owner}
              ownerAccessAllowed={ownerAccess.allowed}
              onOwner={showOwnerWorkbench}
              onDemo={showDemoViewer}
            />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-black/5 bg-[#fafafa]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <BrandMark small />
            <span className="text-[15px] font-semibold tracking-tight text-[#0a0a0a]">
              CANONICAL
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#program-library" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
              Programs
            </a>
            <a href="#package-library" className="hidden text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a] sm:block">
              Packages
            </a>
            {!summaryOnly && (
              <>
                <a href="#session" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
                  Session
                </a>
                <a href="#artifacts" className="text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a]">
                  Artifacts
                </a>
                <a href="#agent-demo" className="hidden text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a] sm:block">
                  Agent Demo
                </a>
                <a href="#integrations" className="hidden text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a] md:block">
                  Integrations
                </a>
              </>
            )}
            {owner && !summaryOnly && (
              <a href="#helper" className="hidden text-sm text-[#0a0a0a]/50 transition-colors hover:text-[#0a0a0a] sm:block">
                Helper
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        {!owner && (
          <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-medium text-indigo-700">
            Demo mode is active. Drafts, approvals, raw PRISM notes, local paths, and agent logs are hidden.
          </div>
        )}

        <motion.header
          initial="hidden"
          animate="visible"
          className="mb-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]"
        >
          <div>
            <motion.div
              variants={fadeUp}
              custom={0}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-medium tracking-wide text-indigo-600">
                {owner ? "OWNER / ADMIN WORKBENCH" : "DEMO VIEWER"}
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-[#0a0a0a] sm:text-6xl"
            >
              {program.title}
              <br />
              <span className="text-[#0a0a0a]/20">
                {owner ? "owner / admin workbench." : "demo viewer."}
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-[#0a0a0a]/50"
            >
              {module?.description || program.description}
            </motion.p>
          </div>

          <motion.div variants={fadeUp} custom={3} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <AccessModeSwitcher
              owner={owner}
              ownerAccessAllowed={ownerAccess.allowed}
              onOwner={showOwnerWorkbench}
              onDemo={showDemoViewer}
            />
            <Button variant="ghost" className="mt-3 w-full text-[#0a0a0a]/55" onClick={() => setEntered(false)}>
              Return to login
            </Button>
          </motion.div>
        </motion.header>

        <div id="program-library" className="scroll-mt-24">
          <ProgramLibraryPanel
            programs={visiblePrograms}
            selectedProgramId={program.id}
            owner={owner}
            onSelect={handleSelectProgram}
          />
        </div>

        {owner && (
          <OwnerDiagnosticsPanel
            ownerAccess={ownerAccess}
            requestedMode={requestedMode}
            resolvedMode={mode}
            user={user}
            capabilities={capabilities}
          />
        )}

        <div id="package-library" className="scroll-mt-24">
          <PackageLibraryPanel owner={owner} />
        </div>

        {summaryOnly ? (
          <>
            <ModeGuardrails owner={owner} summaryOnly />
            {owner && program?.visibility_scope === "prism_private" ? (
              <OwnerPrismDataPanel
                state={prismDataState}
                data={prismData}
                program={program}
                onRetry={() => setPrismFetchKey((k) => k + 1)}
              />
            ) : (
              <ProgramOverviewPanel program={program} module={module} owner={owner} />
            )}
          </>
        ) : (
          <>
        <StoryRail items={portalData.demo_story} />
        <BoundaryPanel boundaries={portalData.boundary_model} />
        <ModeGuardrails owner={owner} />

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <MetricTile label="Source of truth" value="CANONICAL file spine" />
          <MetricTile label="Session" value={brief.session_key} />
          <MetricTile label="Helper stance" value="Draft then approve" />
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <DemoPresentationPanel owner={owner} bundle={bundle} />
          <BriefQualityPanel checks={portalData.brief_quality_checks} />
        </section>

        <section id="session" className="mb-6 grid scroll-mt-24 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Surface>
            <SectionTitle eyebrow="Current session" title={brief.session_title} icon={FileText} />
            {[
              ["Session date", brief.session_date],
              ["Actual stage", brief.actual_stage],
              ["Delivery status", bundle.delivery_status],
              ["Slides", bundle.slide_status],
              ["Classroom", bundle.classroom_status],
              ["AYA export", bundle.aya_export_status],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-black/5 py-3 text-sm">
                <span className="text-[#0a0a0a]">{label}</span>
                <span className="text-right text-[#0a0a0a]/45">{value}</span>
              </div>
            ))}
          </Surface>

          <Surface>
            <SectionTitle eyebrow="Session brief" title="Canonical bridge artifact" icon={BookOpen} />
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#fafafa] p-4 text-xs leading-5 text-[#0a0a0a]/60">
              {owner
                ? `${brief.brief_markdown}\n\n## PRISM private guidance\n${brief.prism_guidance}`
                : `${brief.brief_markdown}\n\n## Curated PRISM framing\n${bundle.demo_summary}`}
            </pre>
          </Surface>
        </section>

        <section id="artifacts" className="mb-6 grid scroll-mt-24 gap-6 lg:grid-cols-2">
          <Surface>
            <SectionTitle eyebrow="AYA rail" title="Delivery-facing outputs" icon={BookOpen} />
            <div className="grid gap-3">
              {ayaArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} mode={mode} />
              ))}
            </div>
          </Surface>
          <Surface>
            <SectionTitle
              eyebrow="PRISM rail"
              title={owner ? "Private facilitator intelligence" : "Curated PRISM framing"}
              icon={owner ? Lock : Eye}
            />
            <div className="grid gap-3">
              {prismArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} mode={mode} />
              ))}
            </div>
          </Surface>
        </section>

        <ExportAdapterPanel adapters={portalData.export_adapters} />

        {owner && program.program_key === "AYA_CTS" && (
          <SlideTemplateSpinePanel summary={slideTemplateSummary} />
        )}

        <DemoAgentWorkbench
          mode={owner ? "owner" : "demo"}
          input={demoAgentInput}
          onInputChange={setDemoAgentInput}
          generatedPackage={generatedPackage}
          onGenerate={handleGenerateDemoPackage}
          onCopy={handleCopyOutput}
          copyStatus={copyStatus}
          capabilities={portalData.demo_agent_capabilities}
        />

        <LiveIntegrationsPanel owner={owner} generatedPackage={generatedPackage} />

        {owner && (
          <section id="helper" className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Surface>
              <SectionTitle eyebrow="Program helper" title="Hybrid notes to bundle plan" icon={Wand2} />
              <label className="text-xs font-medium uppercase tracking-wide text-[#0a0a0a]/35">
                Raw classflow input
              </label>
              <textarea
                value={helperInput}
                onChange={(event) => setHelperInput(event.target.value)}
                className="mt-3 min-h-64 w-full resize-y rounded-2xl border border-black/5 bg-[#fafafa] p-4 text-sm leading-6 text-[#0a0a0a]/70 outline-none transition focus:border-indigo-200 focus:bg-white"
              />
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <pre className="max-h-96 overflow-auto rounded-2xl bg-[#fafafa] p-4 text-xs leading-5 text-[#0a0a0a]/60">
                  {JSON.stringify(normalized, null, 2)}
                </pre>
                <div className="grid gap-3">
                  <BundleList title="AYA rail" items={bundlePlan.aya} />
                  <BundleList title="PRISM rail" items={bundlePlan.prism} />
                  <BundleList title="Slides + Classroom" items={bundlePlan.downstream} />
                </div>
              </div>
            </Surface>

            <Surface>
              <SectionTitle eyebrow="Cursor SDK helper" title="Local draft run review" icon={Shield} />
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricTile label="Status" value={runStatus.replace(/_/g, " ")} />
                <MetricTile label="Approval" value={agentRun.approval_status.replace(/_/g, " ")} />
                <MetricTile label="Runtime" value={agentRun.runtime} />
              </div>
              <p className="mt-5 text-sm leading-6 text-[#0a0a0a]/50">{agentRun.summary}</p>
              <pre className="mt-4 max-h-28 overflow-auto rounded-2xl bg-[#fafafa] p-4 text-xs text-[#0a0a0a]/55">
                {agentRun.draft_path}
              </pre>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button className="gap-2 bg-[#0a0a0a] hover:bg-[#1a1a1a]" onClick={() => setRunStatus("queued")}>
                  <Play className="h-4 w-4" />
                  Start draft run
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setRunStatus("approved")}>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve selected draft
                </Button>
                <Button variant="ghost" className="gap-2 text-[#0a0a0a]/55" onClick={() => setRunStatus("draft_ready")}>
                  <RefreshCcw className="h-4 w-4" />
                  Reset preview
                </Button>
              </div>
            </Surface>
          </section>
        )}
          </>
        )}
      </main>
    </div>
  );
}