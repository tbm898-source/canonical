import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import {
  CONNECTOR_TYPES,
  nowIso,
  safeCreateConnectorRun,
  safeErrorMessage,
} from "../_shared/canonicalPolicy.ts";

const CONNECTOR_LABELS: Record<string, string> = {
  dropbox: "Dropbox",
  google_classroom: "Google Classroom",
  clickup: "ClickUp",
  gmail: "Gmail",
};

Deno.serve(async (req) => {
  const startedAt = nowIso();
  const runId = `connector_health_${Date.now()}`;

  try {
    const base44 = createClientFromRequest(req);
    const connectors: Record<string, unknown> = {};
    const warnings: string[] = [];

    for (const connector of CONNECTOR_TYPES) {
      try {
        const connection = await base44.asServiceRole.connectors.getConnection(connector);
        connectors[connector] = {
          status: connection?.accessToken ? "connected" : "blocked",
          safe_label: CONNECTOR_LABELS[connector],
          message: connection?.accessToken
            ? `${CONNECTOR_LABELS[connector]} connector is available.`
            : `${CONNECTOR_LABELS[connector]} connector did not return an available connection.`,
        };
      } catch (_error) {
        connectors[connector] = {
          status: "disconnected",
          safe_label: CONNECTOR_LABELS[connector],
          message: `${CONNECTOR_LABELS[connector]} is not connected or is unavailable to this app.`,
        };
      }
    }

    await safeCreateConnectorRun(base44, {
      run_id: runId,
      connector: "system",
      function_name: "canonicalConnectorHealth",
      mode: "owner_preview",
      status: "ready",
      started_at: startedAt,
      completed_at: nowIso(),
      user_visible_summary: "Checked connector availability without exposing tokens.",
      safe_metadata: { connector_keys: CONNECTOR_TYPES },
      warnings,
    });

    return Response.json({
      success: true,
      mode: "owner_preview",
      connectors,
      timestamp: nowIso(),
      warnings,
      error: null,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        mode: "owner_preview",
        connectors: {},
        timestamp: nowIso(),
        warnings: [],
        error: safeErrorMessage(error),
      },
      { status: 200 },
    );
  }
});
