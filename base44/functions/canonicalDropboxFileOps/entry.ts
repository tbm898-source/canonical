import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  nowIso,
  safeCreateConnectorRun,
  safeErrorMessage,
} from "../_shared/canonicalPolicy.ts";

type DropboxConnection = {
  accessToken?: string;
  access_token?: string;
  token?: string;
};

type DropboxEntry = {
  ".tag"?: string;
  id?: string;
  name?: string;
  path_display?: string;
  path_lower?: string;
  size?: number;
  client_modified?: string;
  server_modified?: string;
};

function getAccessToken(connection: DropboxConnection) {
  return connection.accessToken || connection.access_token || connection.token || "";
}

function normalizeDropboxPath(path: unknown) {
  if (typeof path !== "string") return "";
  if (!path.trim() || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function safeEntry(entry: DropboxEntry) {
  return {
    tag: entry[".tag"] || "",
    id: entry.id || "",
    name: entry.name || "",
    path_display: entry.path_display || "",
    path_lower: entry.path_lower || "",
    size: entry.size || null,
    client_modified: entry.client_modified || null,
    server_modified: entry.server_modified || null,
  };
}

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
    throw new Error(`Dropbox list operation failed with status ${response.status}.`);
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
      throw new Error(`Dropbox list continuation failed with status ${response.status}.`);
    }

    data = await response.json();
    entries.push(...(data.entries || []));
  }

  return entries.map(safeEntry);
}

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `dropbox_file_ops_${Date.now()}`;

  try {
    const payload = await req.json().catch(() => ({}));
    const operation = payload.operation || "list";
    const mode = payload.mode || "owner_preview";

    if (mode === "demo") {
      return Response.json({
        success: false,
        connector: "dropbox",
        mode,
        operation,
        entries: [],
        timestamp: nowIso(),
        warnings: ["Demo mode cannot call Dropbox connector functions."],
        error: "Owner mode required for Dropbox file operations.",
      });
    }

    if (operation !== "list") {
      return Response.json({
        success: false,
        connector: "dropbox",
        mode,
        operation,
        entries: [],
        timestamp: nowIso(),
        warnings: [
          "Generic upload/download are intentionally disabled in V1. Use saveInstructionalPacketToDropbox for approved packet writes.",
        ],
        error: "Only the list operation is enabled in canonicalDropboxFileOps V1.",
      });
    }

    const base44 = createClientFromRequest(req);
    const connection = await base44.asServiceRole.connectors.getConnection("dropbox");
    const accessToken = getAccessToken(connection as DropboxConnection);
    if (!accessToken) throw new Error("Dropbox connector is not available.");

    const path = normalizeDropboxPath(payload.path);
    const entries = await listDropboxFolder(accessToken, path);

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "dropbox",
      function_name: "canonicalDropboxFileOps",
      mode,
      status: "ready",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: "Listed Dropbox folder metadata through the owner connector.",
      safe_metadata: {
        operation,
        path,
        entry_count: entries.length,
      },
      warnings: [],
    });

    return Response.json({
      success: true,
      connector: "dropbox",
      mode,
      operation,
      path,
      entries,
      timestamp: nowIso(),
      warnings: [],
      error: null,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        connector: "dropbox",
        mode: "owner_preview",
        operation: "list",
        entries: [],
        timestamp: nowIso(),
        warnings: [],
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
