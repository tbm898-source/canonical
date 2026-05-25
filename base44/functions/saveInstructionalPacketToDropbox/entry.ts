import { createClientFromRequest } from "npm:@base44/sdk";
import {
  buildManifest,
  containsUnsafePublicText,
  filenameToken,
  joinDropboxPath,
  nowIso,
  safeCreateConnectorRun,
  safeErrorMessage,
  validateClassification,
} from "../_shared/canonicalPolicy.ts";

async function uploadDropboxFile(accessToken: string, path: string, content: string) {
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path,
        mode: "add",
        autorename: true,
        mute: true,
        strict_conflict: false,
      }),
    },
    body: content,
  });

  if (!response.ok) {
    throw new Error(`Dropbox upload failed with status ${response.status}`);
  }

  const metadata = await response.json();
  return metadata.path_display || path;
}

function blockedResponse(message: string, warnings: string[] = []) {
  return Response.json({
    success: false,
    connector: "dropbox",
    mode: "owner_live_dropbox",
    saved_files: [],
    destination_path: "",
    manifest_path: "",
    timestamp: nowIso(),
    warnings,
    error: message,
  });
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `dropbox_save_${Date.now()}`;

  try {
    const payload = await req.json();
    const base44 = createClientFromRequest(req);
    const classification = payload.packet_json?.packet_metadata || payload.classification || {};
    const validation = validateClassification(classification, {
      mode: "owner_live_dropbox",
      connectorCall: true,
      destination_scope: classification.visibility_scope,
    });

    if (!validation.ok) {
      return blockedResponse(validation.errors.join(" "), validation.warnings);
    }

    if (!payload.packet_json || !payload.packet_markdown) {
      return blockedResponse("Generated packet JSON and Markdown are required before Dropbox save.");
    }

    if (payload.dry_run) {
      return Response.json({
        success: true,
        connector: "dropbox",
        mode: "owner_live_dropbox",
        saved_files: [],
        destination_path: payload.approved_destination_path || "",
        manifest_path: "",
        timestamp: nowIso(),
        warnings: ["Dry run only. No Dropbox files were written."],
        error: null,
      });
    }

    if (
      ["public_demo", "aya_classroom"].includes(classification.visibility_scope) &&
      (containsUnsafePublicText(payload.packet_json) || containsUnsafePublicText(payload.packet_markdown))
    ) {
      return blockedResponse("Unsafe public/classroom text detected. Export blocked.");
    }

    let spineMap = null;
    if (payload.canonical_spine_map_id) {
      spineMap = await base44.asServiceRole.entities.CanonicalSpineMap.get(
        payload.canonical_spine_map_id,
      );
      if (!spineMap?.accepted_by_owner) {
        return blockedResponse(
          "Destination requires owner approval because the CANONICAL spine could not be safely resolved.",
        );
      }
    }

    const recommendedPath = spineMap?.recommended_paths?.[classification.visibility_scope] || "";
    const destinationPath = payload.approved_destination_path || recommendedPath;

    if (!destinationPath) {
      return blockedResponse(
        "Destination requires owner approval because the CANONICAL spine could not be safely resolved.",
      );
    }

    if (recommendedPath && !destinationPath.startsWith(recommendedPath)) {
      return blockedResponse("Approved destination does not match the accepted CANONICAL spine map.");
    }

    if (!spineMap && !payload.approved_destination_path) {
      return blockedResponse(
        "Destination requires owner approval because the CANONICAL spine could not be safely resolved.",
      );
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("dropbox");
    if (!accessToken) throw new Error("Dropbox connector is not available.");

    const artifactId =
      payload.artifact_id ||
      `${classification.session_key}_${classification.artifact_type}_${Date.now()}`;
    const baseName = filenameToken(
      `${classification.module_key}_${classification.session_key}_${classification.artifact_type}`,
    );

    const jsonPath = joinDropboxPath(destinationPath, `${baseName}.json`);
    const markdownPath = joinDropboxPath(destinationPath, `${baseName}.md`);

    const savedJsonPath = await uploadDropboxFile(
      accessToken,
      jsonPath,
      JSON.stringify(payload.packet_json, null, 2),
    );
    const savedMarkdownPath = await uploadDropboxFile(
      accessToken,
      markdownPath,
      payload.packet_markdown,
    );

    const savedAt = nowIso();
    const manifest = buildManifest({
      artifact_id: artifactId,
      classification,
      saved_at: savedAt,
      destination_path: destinationPath,
      saved_files: [savedJsonPath, savedMarkdownPath],
      warnings: validation.warnings,
    });
    const manifestPath = joinDropboxPath(destinationPath, `${baseName}_manifest.json`);
    const savedManifestPath = await uploadDropboxFile(
      accessToken,
      manifestPath,
      JSON.stringify(manifest, null, 2),
    );

    await base44.asServiceRole.entities.CanonicalGeneratedArtifact.create({
      artifact_id: artifactId,
      module_key: classification.module_key,
      session_key: classification.session_key,
      session_title: classification.session_title,
      session_date: classification.session_date,
      rail: classification.rail,
      visibility_scope: classification.visibility_scope,
      artifact_type: classification.artifact_type,
      generated_json: payload.packet_json,
      generated_markdown: payload.packet_markdown,
      export_manifest: {
        ...manifest,
        saved_files: [savedJsonPath, savedMarkdownPath, savedManifestPath],
      },
      dropbox_path: destinationPath,
      manifest_path: savedManifestPath,
      classroom_draft: payload.packet_json.classroom_draft || null,
      clickup_task_candidates: payload.packet_json.clickup_task_candidates || [],
      connector_mode: "owner_live_dropbox",
      status: "saved",
      warnings: validation.warnings,
      created_at: savedAt,
      updated_at: savedAt,
    });

    await base44.asServiceRole.entities.CanonicalExportApproval.create({
      artifact_id: artifactId,
      export_type: "dropbox_packet_save",
      target_service: "dropbox",
      target_path_or_id: destinationPath,
      approval_status: "approved",
      approved_by: "owner",
      approved_at: savedAt,
      notes: "Approved through owner_live_dropbox workflow.",
      created_at: savedAt,
      updated_at: savedAt,
    });

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "dropbox",
      function_name: "saveInstructionalPacketToDropbox",
      mode: "owner_live_dropbox",
      status: "saved",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: "Saved packet JSON, Markdown, and manifest to approved Dropbox path.",
      safe_metadata: {
        artifact_id: artifactId,
        destination_path: destinationPath,
        saved_file_count: 3,
      },
      warnings: validation.warnings,
    });

    return Response.json({
      success: true,
      connector: "dropbox",
      mode: "owner_live_dropbox",
      saved_files: [savedJsonPath, savedMarkdownPath, savedManifestPath],
      destination_path: destinationPath,
      manifest_path: savedManifestPath,
      timestamp: nowIso(),
      warnings: validation.warnings,
      error: null,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        connector: "dropbox",
        mode: "owner_live_dropbox",
        saved_files: [],
        destination_path: "",
        manifest_path: "",
        timestamp: nowIso(),
        warnings: [],
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
