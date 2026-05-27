import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  containsUnsafePublicText,
  nowIso,
  safeCreateConnectorRun,
  safeErrorMessage,
} from "../_shared/canonicalPolicy.ts";

async function loadPacket(base44: any, payload: Record<string, any>) {
  if (payload.packet_json) return payload.packet_json;
  if (!payload.packet_id) return null;
  const record = await base44.asServiceRole.entities.CanonicalGeneratedArtifact.get(payload.packet_id);
  return record?.generated_json || null;
}

function task(title: string, tag: string, source: string) {
  return {
    name: title,
    description: source,
    tags: [tag, "canonical-program-helper"],
    rail: tag === "prism_private" ? "prism_private" : tag,
  };
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `clickup_dry_run_${Date.now()}`;

  try {
    const payload = await req.json();
    const base44 = createClientFromRequest(req);
    const packet = await loadPacket(base44, payload);

    if (!packet) {
      return Response.json({
        success: false,
        connector: "clickup",
        mode: "dry_run",
        task_candidates: [],
        warnings: [],
        error: "A packet_id or packet_json is required for ClickUp dry-run.",
      });
    }

    const classification = packet.packet_metadata || {};
    if (
      classification.visibility_scope === "prism_private" &&
      containsUnsafePublicText(packet.facilitator_overlay || packet.ai_continuity_notes || packet)
    ) {
      return Response.json({
        success: false,
        connector: "clickup",
        mode: "dry_run",
        task_candidates: [],
        warnings: [],
        error: "Raw PRISM-private text cannot be exported to ClickUp without curation.",
      });
    }

    const candidates = [
      ...(packet.clickup_task_candidates || []),
      ...(packet.export_manifest?.warnings || []).map((item: string) =>
        task(`Review warning: ${item}`, "review", item),
      ),
      ...(packet.student_materials || []).slice(0, 3).map((item: string) =>
        task(`Prepare student material: ${item}`, "aya", item),
      ),
      ...(packet.export_manifest?.missing_artifacts || []).map((item: string) =>
        task(`Resolve missing artifact: ${item}`, "evidence", item),
      ),
    ];

    if (!candidates.length) {
      candidates.push(
        task(
          `Review ${packet.packet_metadata?.session_title || "generated session"} packet`,
          "review",
          "No explicit task candidates were included, so create a review task candidate.",
        ),
      );
    }

    const safeCandidates = candidates.map((candidate: Record<string, unknown>, index: number) => ({
      id: candidate.id || `candidate_${index + 1}`,
      name: candidate.name || candidate.title || `Task candidate ${index + 1}`,
      description: candidate.description || "",
      tags: candidate.tags || ["review"],
      target_list_id: payload.target_list_id || "",
      dry_run: true,
    }));

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "clickup",
      function_name: "prepareClickUpExport",
      mode: "dry_run",
      status: "prepared",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: "Prepared ClickUp task candidates without creating live tasks.",
      safe_metadata: {
        candidate_count: safeCandidates.length,
        has_target_list_id: Boolean(payload.target_list_id),
      },
      warnings: [],
    });

    return Response.json({
      success: true,
      connector: "clickup",
      mode: "dry_run",
      task_candidates: safeCandidates,
      warnings: [],
      error: null,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        connector: "clickup",
        mode: "dry_run",
        task_candidates: [],
        warnings: [],
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
