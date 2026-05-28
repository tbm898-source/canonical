// Maps Owner Assistant GenerationArtifact envelopes to instructional packet_json
// consumed by existing dry-run connector functions (ProgramHelper spine).

const OUTPUT_TYPE_TO_ARTIFACT_TYPE = Object.freeze({
  daily_run: "lesson_plan",
  slide_outline: "slide_outline",
  student_handout: "student_packet",
  quiz: "quiz",
  instructor_guide: "instructor_guide",
  evidence_checklist: "evidence_note",
  google_classroom_export: "classroom_post",
  prism_facilitator_overlay: "facilitator_overlay",
});

/**
 * @param {Record<string, unknown>} artifact
 * @returns {Record<string, unknown>}
 */
export function artifactToPacketJson(artifact) {
  if (!artifact || typeof artifact !== "object") {
    throw new Error("artifact is required");
  }

  const outputType = String(artifact.profile?.output_type || "lesson_plan");
  const artifactType = OUTPUT_TYPE_TO_ARTIFACT_TYPE[outputType] || "lesson_plan";
  const moduleKey = String(artifact.module_key || "MODULE_PENDING");
  const programKey = String(artifact.program_key || "PROGRAM_PENDING");
  const sessionKey = `${moduleKey}_OWNER_ASSISTANT`;
  const bodyMarkdown = String(artifact.body_markdown || "");
  const rail = String(artifact.rail || "canonical");
  const visibilityScope = String(artifact.visibility_scope || "canonical_internal");

  const classroomDraft =
    artifact.body_json && typeof artifact.body_json === "object"
      ? artifact.body_json
      : {
          title: `${programKey} — ${outputType.replace(/_/g, " ")}`,
          body:
            bodyMarkdown.slice(0, 1200) ||
            "Owner-approved artifact from Canonical Assistant. Complete assigned work and evidence capture.",
          topic: moduleKey,
          materials: [],
          due_date: null,
          visibility_scope: visibilityScope === "prism_private" ? "aya_classroom" : visibilityScope,
        };

  return {
    packet_metadata: {
      rail,
      visibility_scope: visibilityScope,
      artifact_type: artifactType,
      program_key: programKey,
      module_key: moduleKey,
      session_key: sessionKey,
      session_title: `${programKey} / ${moduleKey}`,
      session_date: new Date().toISOString().slice(0, 10),
      generation_artifact_id: artifact.generation_artifact_id,
      generation_plan_id: artifact.generation_plan_id,
      output_type: outputType,
      review_status: artifact.review_status,
      export_readiness_status: artifact.export_readiness_status,
      warnings: [],
    },
    instructor_materials:
      outputType === "student_handout" || outputType === "quiz" ? [] : [bodyMarkdown].filter(Boolean),
    student_materials:
      outputType === "student_handout" || outputType === "quiz" ? [bodyMarkdown].filter(Boolean) : [],
    slide_outline:
      outputType === "slide_outline" ? bodyMarkdown.split("\n").filter(Boolean) : [],
    classroom_draft: classroomDraft,
    clickup_task_candidates: [
      {
        id: "review_approved_artifact",
        name: `Review ${outputType} — ${moduleKey}`,
        description: `Owner-approved artifact ${artifact.generation_artifact_id} linked to plan ${artifact.generation_plan_id}.`,
        tags: [rail, "review", "owner-assistant"],
      },
    ],
    export_manifest: {
      warnings: ["Dry-run export preview from Owner Assistant approved artifact."],
      missing_artifacts: [],
      generated_at: artifact.generated_at || new Date().toISOString(),
    },
  };
}

/** @param {Record<string, unknown>} artifact */
export function canPreviewClassroomExport(artifact) {
  const rail = String(artifact?.rail || "");
  const visibility = String(artifact?.visibility_scope || "");
  return rail !== "prism" && visibility !== "prism_private";
}

/** @param {Record<string, unknown>} artifact */
export function canPreviewDropboxExport(artifact) {
  return artifact?.review_status === "approved" && artifact?.export_readiness_status === "ready_dry_run";
}

/** @param {Record<string, unknown>} artifact */
export function canPreviewClickUpExport(artifact) {
  return artifact?.review_status === "approved" && artifact?.export_readiness_status === "ready_dry_run";
}
