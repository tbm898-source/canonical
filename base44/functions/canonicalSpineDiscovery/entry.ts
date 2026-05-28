import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

const EXPECTED_SPINE_FOLDERS = [
  "CANONICAL",
  "00_ADMIN",
  "00_MASTERS",
  "00_START_HERE",
  "00_STUDENT_PACKET",
  "00_SUBSTITUTE",
  "01_Curriculum_Canonical",
  "02_Instructor_Resources",
  "03_Cohort_Evidence",
  "04_Exports",
  "05_Manifests",
  "06_Workbench_Drafts",
  "07_Classroom_Ready",
  "08_ClickUp_Ready",
  "09_PRISM_Private",
  "90_REVIEW",
  "99_UNSORTED",
  "99_PROCESSED",
];

function nowIso() {
  return new Date().toISOString();
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    if (/token|secret|authorization|oauth|bearer/i.test(error.message)) {
      return "Connector request failed without exposing credentials.";
    }
    return error.message.slice(0, 240);
  }
  return "Unknown connector error.";
}

function joinDropboxPath(...parts: string[]) {
  const normalized = parts
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return normalized ? `/${normalized}` : "";
}

async function safeCreateConnectorRun(base44: any, data: Record<string, unknown>) {
  try {
    await base44.asServiceRole.entities.CanonicalConnectorRun.create(data);
  } catch (_error) {
    // Audit trail only: never fail user response on log-write issues.
  }
}

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

function recommendedPaths(rootPath: string, detected: string[], prismPrivatePath = "") {
  const has = (name: string) => detected.includes(name);
  const prismPath =
    prismPrivatePath ||
    joinDropboxPath(rootPath, has("09_PRISM_Private") ? "09_PRISM_Private" : "09_PRISM_Private");
  return {
    canonical_internal: joinDropboxPath(rootPath, has("04_Exports") ? "04_Exports" : "05_Manifests"),
    aya_classroom: joinDropboxPath(rootPath, has("07_Classroom_Ready") ? "07_Classroom_Ready" : "00_STUDENT_PACKET"),
    prism_private: prismPath,
    public_demo: joinDropboxPath(rootPath, "04_Exports", "Public_Demo"),
  };
}

async function walkForSpineCandidates(
  accessToken: string,
  path: string,
  depth: number,
  maxDepth: number,
  candidateRoots: Array<Record<string, unknown>>,
) {
  if (depth > maxDepth) return;

  let childFolders: DropboxEntry[] = [];
  try {
    childFolders = await listDropboxFolder(accessToken, path);
  } catch (_error) {
    return;
  }

  const childNames = childFolders.map((child) => child.name || "").filter(Boolean);
  const detectedSpineFolders = childNames.filter((folder) => EXPECTED_SPINE_FOLDERS.includes(folder));
  const prismPrivateEntry = childFolders.find((child) => child.name === "09_PRISM_Private");
  const rootName = path.split("/").filter(Boolean).pop() || "Dropbox root";

  if (detectedSpineFolders.length >= 2 || prismPrivateEntry) {
    candidateRoots.push({
      root_name: rootName,
      root_path: path,
      detected_folders: detectedSpineFolders,
      prism_private_path: prismPrivateEntry?.path_display || joinDropboxPath(path, "09_PRISM_Private"),
      score: scoreRoot(rootName, childNames) + (prismPrivateEntry ? 15 : 0),
    });
  }

  for (const entry of childFolders) {
    const name = entry.name || "";
    if (!/canonical|02_projects|prism|CANONICAL|09_prism_private/i.test(name)) continue;
    const childPath = entry.path_display || joinDropboxPath(path, name);
    await walkForSpineCandidates(accessToken, childPath, depth + 1, maxDepth, candidateRoots);
  }
}

function dedupeCandidateRoots(
  candidateRoots: Array<Record<string, unknown>>,
) {
  const seen = new Set<string>();
  return candidateRoots.filter((root) => {
    const key = String(root.root_path || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
        prism_private_path: joinDropboxPath("", "09_PRISM_Private"),
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
      const prismPrivateEntry = childFolders.find((child) => child.name === "09_PRISM_Private");
      candidateRoots.push({
        root_name: name,
        root_path: pathDisplay,
        detected_folders: childNames.filter((folder) => EXPECTED_SPINE_FOLDERS.includes(folder)),
        prism_private_path: prismPrivateEntry?.path_display || joinDropboxPath(pathDisplay, "09_PRISM_Private"),
        score: scoreRoot(name, childNames) + (prismPrivateEntry ? 15 : 0),
      });
      await walkForSpineCandidates(accessToken, pathDisplay, 1, 3, candidateRoots);
    }

    const uniqueCandidates = dedupeCandidateRoots(candidateRoots);
    uniqueCandidates.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
    const selectedRoot =
      uniqueCandidates.find((root) => root.root_path === payload.selected_root_path) ||
      uniqueCandidates[0] ||
      null;
    const detectedFolders = (selectedRoot?.detected_folders as string[]) || [];
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
      ? recommendedPaths(
          String(selectedRoot.root_path || ""),
          detectedFolders,
          String(selectedRoot.prism_private_path || ""),
        )
      : {
          canonical_internal: "",
          aya_classroom: "",
          prism_private: "",
          public_demo: "",
        };

    let canonical_spine_map_id = null;
    let accepted_spine_map: Record<string, unknown> | null = null;
    if (payload.accept_discovered_map && selectedRoot) {
      const mapPayload = {
        root_name: selectedRoot.root_name,
        root_path: selectedRoot.root_path,
        candidate_roots: uniqueCandidates.map(({ score, ...root }) => root),
        detected_folders: detectedFolders,
        missing_expected_folders: missingExpectedFolders,
        recommended_paths: recommended_artifact_paths,
        accepted_by_owner: true,
        accepted_at: nowIso(),
        connector_mode: "owner_live_dropbox",
        discovery_warnings: warnings,
        created_at: nowIso(),
        updated_at: nowIso(),
      };

      try {
        const record = await base44.asServiceRole.entities.CanonicalSpineMap.create(mapPayload);
        canonical_spine_map_id = record.id;
        accepted_spine_map = { ...mapPayload, id: record.id };
      } catch (_error) {
        canonical_spine_map_id = `stateless_${Date.now()}`;
        accepted_spine_map = { ...mapPayload, id: canonical_spine_map_id, persistence: "stateless" };
        warnings.push(
          "Entity API unavailable. Spine acceptance is held statelessly for this export session.",
        );
      }
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
        candidate_root_count: uniqueCandidates.length,
        detected_folder_count: detectedFolders.length,
        accepted: Boolean(canonical_spine_map_id),
        stateless: Boolean(accepted_spine_map?.persistence === "stateless"),
      },
      warnings,
    });

    return Response.json({
      success: Boolean(selectedRoot) || uniqueCandidates.length > 0,
      connector: "dropbox",
      mode: "read_only_discovery",
      candidate_roots: uniqueCandidates.map(({ score, ...root }) => root),
      detected_spine_folders: detectedFolders,
      missing_expected_folders: missingExpectedFolders,
      recommended_artifact_paths,
      canonical_spine_map_id,
      accepted_spine_map,
      warnings,
      timestamp: nowIso(),
      error: selectedRoot ? null : "No confident CANONICAL spine root was discovered.",
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
