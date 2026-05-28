// DISABLED: entity automation stub for ClickUp auto-export.
// Owner Assistant uses review_status envelopes (exportOwnerApprovedArtifactToClickUp),
// not CanonicalGeneratedArtifact entity records. Re-enable only after entity + owner gates align.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function nowIso() {
  return new Date().toISOString();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  await req.json().catch(() => ({}));

  return Response.json({
    skipped: true,
    disabled: true,
    reason:
      "autoExportApprovedArtifactToClickUp is disabled in git. Use exportOwnerApprovedArtifactToClickUp from Owner Assistant live export panel.",
    artifact_id: null,
    timestamp: nowIso(),
  });
});
