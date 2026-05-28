// Static catalog mirroring content/generation-profiles/*.profile.json (v0.1).
//
// This file deliberately ships only the small subset of fields the Owner
// Assistant picker needs: profile_id, output_type, allowed_rails,
// allowed_visibility_scopes, format, status, plus a short human-readable
// title and summary.
//
// The on-disk profile JSONs in /content/generation-profiles/ remain the
// source of truth. This catalog is a frontend-bundled view used only to
// render disabled selection controls in Milestone 1. No fetch, no
// import.meta.glob, no fs.
//
// When profiles are added, removed, or change rails/scopes, update this
// catalog by hand to keep the UI honest. A future milestone can replace
// this with a generated index.

export const GENERATION_PROFILES = Object.freeze([
  {
    profile_id: "canonical.daily_run.v0_1",
    output_type: "daily_run",
    title: "Daily Run",
    summary: "Day-focused brief with targets, flow, evidence, and next-step pointers.",
    allowed_rails: ["aya", "canonical"],
    allowed_visibility_scopes: ["aya_classroom", "canonical_internal", "public_demo"],
    format: "markdown+json",
    status: "approved",
  },
  {
    profile_id: "canonical.slide_outline.v0_1",
    output_type: "slide_outline",
    title: "Slide Outline",
    summary: "Slide-ready opening, status, targets, decisions, and handoff structure.",
    allowed_rails: ["aya", "canonical"],
    allowed_visibility_scopes: ["aya_classroom", "canonical_internal", "public_demo"],
    format: "markdown+json",
    status: "approved",
  },
  {
    profile_id: "canonical.student_handout.v0_1",
    output_type: "student_handout",
    title: "Student Handout",
    summary: "Student-safe handout: objective, tasks, reflection, submission.",
    allowed_rails: ["aya"],
    allowed_visibility_scopes: ["aya_classroom", "public_demo"],
    format: "markdown+json",
    status: "approved",
  },
  {
    profile_id: "canonical.quiz.v0_1",
    output_type: "quiz",
    title: "Quiz",
    summary: "Classroom quiz: items, rubric, answer-key reference.",
    allowed_rails: ["aya"],
    allowed_visibility_scopes: ["aya_classroom", "public_demo"],
    format: "markdown+json",
    status: "approved",
  },
  {
    profile_id: "canonical.instructor_guide.v0_1",
    output_type: "instructor_guide",
    title: "Instructor Guide",
    summary: "Context, teaching moves, risks, evidence checks, next-day bridge.",
    allowed_rails: ["aya", "canonical", "prism"],
    allowed_visibility_scopes: ["aya_classroom", "canonical_internal", "prism_private"],
    format: "markdown+json",
    status: "approved",
  },
  {
    profile_id: "canonical.evidence_checklist.v0_1",
    output_type: "evidence_checklist",
    title: "Evidence Checklist",
    summary: "Required evidence, quality criteria, capture method, review status.",
    allowed_rails: ["aya", "canonical", "prism"],
    allowed_visibility_scopes: ["aya_classroom", "canonical_internal", "prism_private", "public_demo"],
    format: "markdown+json",
    status: "approved",
  },
  {
    profile_id: "canonical.google_classroom_export.v0_1",
    output_type: "google_classroom_export",
    title: "Google Classroom Export",
    summary: "Dry-run Classroom payload contract: title, body, topic, materials.",
    allowed_rails: ["aya", "canonical"],
    allowed_visibility_scopes: ["aya_classroom"],
    format: "json",
    status: "approved",
  },
  {
    profile_id: "canonical.prism_facilitator_overlay.v0_1",
    output_type: "prism_facilitator_overlay",
    title: "PRISM Facilitator Overlay",
    summary: "Owner/admin overlay: facilitator intent, intervention logic, risk flags, continuity prompt.",
    allowed_rails: ["prism"],
    allowed_visibility_scopes: ["prism_private"],
    format: "markdown+json",
    status: "approved",
  },
]);

export function profileSupportsRail(profile, rail) {
  if (!profile || !rail) return false;
  return Array.isArray(profile.allowed_rails) && profile.allowed_rails.includes(rail);
}

export function profileSupportsVisibility(profile, visibilityScope) {
  if (!profile || !visibilityScope) return false;
  return (
    Array.isArray(profile.allowed_visibility_scopes) &&
    profile.allowed_visibility_scopes.includes(visibilityScope)
  );
}

export const M1_OUTPUT_DESTINATIONS = Object.freeze([
  {
    id: "local_preview",
    title: "Local preview",
    label: "declared_only - not implemented",
    description: "Render the planned generation locally inside the Owner Assistant. No file writes.",
  },
  {
    id: "owner_inbox_dry_run",
    title: "Owner inbox (dry run)",
    label: "dry_run - not implemented",
    description: "Stage a planned package in the owner inbox without writing or syncing files.",
  },
  {
    id: "dropbox_owner_drop_zone_dry_run",
    title: "Dropbox owner drop zone (dry run)",
    label: "dry_run - not implemented",
    description: "Describe the would-be Dropbox path and payload. No connector calls are issued.",
  },
]);
