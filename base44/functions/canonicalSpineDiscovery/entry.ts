import { createClientFromRequest } from "npm:@base44/sdk";
import {
  EXPECTED_SPINE_FOLDERS,
  joinDropboxPath,
  nowIso,
  safeCreateConnectorRun,
  safeErrorMessage,
} from "../_shared/canonicalPolicy.ts";

type DropboxEntry = {
  ".tag"?: string;
  name?: string;
  path_display?: string;
  path_lower?: string;
};

async function listDropboxFolder(accessToken: string, path: string) {
  const entries: DropboxEntry[] = [];
  let response = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      recursive: false,
      include_deleted: false,
      include_non_downloadable_files: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Dropbox folder listing failed with status ${response.status}`);
  }

  let data = await response.json();
  entries.push(...(data.entries || []));

  while (data.has_more && data.cursor) {
    response = await fetch("https://api.dropboxapi.com/2/files/list_folder/continue", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cursor: data.cursor }),
    });
    if (!response.ok) {
      throw new Error(`Dropbox folder listing continuation failed with status ${response.status}`);
    }
    data = await response.json();
    entries.push(...(data.entries || []));
  }

  return entries.filter((entry) => entry[".tag"] === "folder");
}

function scoreRoot(name: string, folderNames: string[]) {
  const expectedHits = folderNames.filter((folder) => EXPECTED_SPINE_FOLDERS.includes(folder)).length;
  const canonicalNameScore = /canonical/i.test(name) ? 20 : 0;
  return expectedHits + canonicalNameScore;
}

function recommendedPaths(rootPath: string, detected: string[]) {
  const has = (name: string) => detected.includes(name);
  return {
    canonical_internal: joinDropboxPath(rootPath, has("04_Exports") ? "04_Exports" : "05_Manifests"),
    aya_classroom: joinDropboxPath(rootPath, has("07_Classroom_Ready") ? "07_Classroom_Ready" : "00_STUDENT_PACKET"),
    prism_private: joinDropboxPath(rootPath, "09_PRISM_Private"),
    public_demo: joinDropboxPath(rootPath, "04_Exports", "Public_Demo"),
  };
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `spine_discovery_${Date.now()}`;

  try {
    const payload = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("dropbox");
    if (!accessToken) throw new Error("Dropbox connector is not available.");

    const rootFolders = await listDropboxFolder(accessToken, "");
    const rootFolderNames = rootFolders.map((entry) => entry.name || "").filter(Boolean);
    const candidateRoots = [];

    const rootExpectedHits = rootFolderNames.filter((name) => EXPECTED_SPINE_FOLDERS.includes(name));
    if (rootExpectedHits.length >= 2) {
      candidateRoots.push({
        root_name: "Dropbox root",
        root_path: "",
        detected_folders: rootExpectedHits,
        score: scoreRoot("Dropbox root", rootFolderNames),
      });
    }

    for (const entry of rootFolders) {
      const name = entry.name || "";
      if (!/canonical/i.test(name) && !EXPECTED_SPINE_FOLDERS.includes(name)) continue;
      const pathDisplay = entry.path_display || `/${name}`;
      let childFolders: DropboxEntry[] = [];
      try {
        childFolders = await listDropboxFolder(accessToken, pathDisplay);
      } catch (_error) {
        childFolders = [];
      }
      const childNames = childFolders.map((child) => child.name || "").filter(Boolean);
      candidateRoots.push({
        root_name: name,
        root_path: pathDisplay,
        detected_folders: childNames.filter((folder) => EXPECTED_SPINE_FOLDERS.includes(folder)),
        score: scoreRoot(name, childNames),
      });
    }

    candidateRoots.sort((a, b) => b.score - a.score);
    const selectedRoot =
      candidateRoots.find((root) => root.root_path === payload.selected_root_path) ||
      candidateRoots[0] ||
      null;
    const detectedFolders = selectedRoot?.detected_folders || [];
    const missingExpectedFolders = EXPECTED_SPINE_FOLDERS.filter(
      (folder) => folder !== "CANONICAL" && !detectedFolders.includes(folder),
    );
    const warnings = [];

    if (!selectedRoot) {
      warnings.push("No confident CANONICAL spine root was discovered.");
    }
    if (missingExpectedFolders.length) {
      warnings.push("Some expected spine folders were not detected. Do not create folders automatically in V1.");
    }

    const recommended_artifact_paths = selectedRoot
      ? recommendedPaths(selectedRoot.root_path, detectedFolders)
      : {
          canonical_internal: "",
          aya_classroom: "",
          prism_private: "",
          public_demo: "",
        };

    let canonical_spine_map_id = null;
    if (payload.accept_discovered_map && selectedRoot) {
      const record = await base44.asServiceRole.entities.CanonicalSpineMap.create({
        root_name: selectedRoot.root_name,
        root_path: selectedRoot.root_path,
        candidate_roots: candidateRoots.map(({ score, ...root }) => root),
        detected_folders: detectedFolders,
        missing_expected_folders: missingExpectedFolders,
        recommended_paths: recommended_artifact_paths,
        accepted_by_owner: true,
        accepted_at: nowIso(),
        connector_mode: "owner_live_dropbox",
        discovery_warnings: warnings,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
      canonical_spine_map_id = record.id;
    }

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "dropbox",
      function_name: "canonicalSpineDiscovery",
      mode: "read_only_discovery",
      status: selectedRoot ? "discovered" : "blocked",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: selectedRoot
        ? "Read Dropbox folder metadata and proposed a CANONICAL spine map."
        : "Read Dropbox folder metadata but did not find a confident CANONICAL root.",
      safe_metadata: {
        candidate_root_count: candidateRoots.length,
        detected_folder_count: detectedFolders.length,
        accepted: Boolean(canonical_spine_map_id),
      },
      warnings,
    });

    return Response.json({
      success: true,
      connector: "dropbox",
      mode: "read_only_discovery",
      candidate_roots: candidateRoots.map(({ score, ...root }) => root),
      detected_spine_folders: detectedFolders,
      missing_expected_folders: missingExpectedFolders,
      recommended_artifact_paths,
      canonical_spine_map_id,
      warnings,
      timestamp: nowIso(),
      error: null,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        connector: "dropbox",
        mode: "read_only_discovery",
        candidate_roots: [],
        detected_spine_folders: [],
        missing_expected_folders: [],
        recommended_artifact_paths: {
          canonical_internal: "",
          aya_classroom: "",
          prism_private: "",
          public_demo: "",
        },
        warnings: [],
        timestamp: nowIso(),
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
