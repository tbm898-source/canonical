/**
 * Read-only integration governance map for UI and docs.
 * Live behavior still comes from Base44 functions + owner gates.
 */

export const INTEGRATION_LAYERS = {
  FRONTEND: "frontend",
  BACKEND: "backend",
  EXTERNAL: "external",
  SCRIPT: "script",
};

export const INTEGRATION_REGISTRY = [
  {
    id: "base44_functions",
    name: "Base44 backend functions",
    currentState: "Deployed via GitHub sync (inline helpers only)",
    role: "owner / system",
    readWrite: "read + gated write",
    layer: INTEGRATION_LAYERS.BACKEND,
    privacyRisk: "medium",
    nextStep: "Post-deploy smoke: getCanonicalProgramFull, canonicalConnectorHealth",
  },
  {
    id: "dropbox",
    name: "Dropbox / CANONICAL spine",
    currentState: "Discovery + owner-approved map + packet save",
    role: "owner",
    readWrite: "read discovery; write after approval",
    layer: INTEGRATION_LAYERS.BACKEND,
    privacyRisk: "high",
    nextStep: "Use Program Helper → Integrations; never bypass spine map",
  },
  {
    id: "google_classroom",
    name: "Google Classroom",
    currentState: "Dry-run prepare; limited live export path",
    role: "owner",
    readWrite: "dry-run; gated live",
    layer: INTEGRATION_LAYERS.BACKEND,
    privacyRisk: "high",
    nextStep: "Block PRISM-private rail in UI labels; dry-run first",
  },
  {
    id: "clickup",
    name: "ClickUp",
    currentState: "Dry-run prepare; manual owner export",
    role: "owner",
    readWrite: "dry-run; gated live",
    layer: INTEGRATION_LAYERS.BACKEND,
    privacyRisk: "medium",
    nextStep: "Confirm dashboard automations disabled on artifact entity",
  },
  {
    id: "gmail",
    name: "Gmail / email",
    currentState: "Declared in health check only",
    role: "owner (future)",
    readWrite: "none in v1",
    layer: INTEGRATION_LAYERS.BACKEND,
    privacyRisk: "medium",
    nextStep: "Do not enable send until review gate exists",
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    currentState: "Not implemented",
    role: "owner (future)",
    readWrite: "—",
    layer: INTEGRATION_LAYERS.EXTERNAL,
    privacyRisk: "low",
    nextStep: "Document only until backend function exists",
  },
  {
    id: "google_drive",
    name: "Google Drive",
    currentState: "CTS package proof labels only (not live connector)",
    role: "public proof",
    readWrite: "read-only metadata",
    layer: INTEGRATION_LAYERS.FRONTEND,
    privacyRisk: "low",
    nextStep: "Do not conflate with Dropbox spine",
  },
  {
    id: "endpoint_pulse",
    name: "Endpoint Pulse",
    currentState: "External monitor (separate app)",
    role: "operator",
    readWrite: "monitor",
    layer: INTEGRATION_LAYERS.EXTERNAL,
    privacyRisk: "low",
    nextStep: "Link from Settings when VITE_ENDPOINT_PULSE_URL is set",
  },
  {
    id: "github_sync",
    name: "GitHub sync",
    currentState: "Repo → Base44 builder sync",
    role: "operator",
    readWrite: "write via git push",
    layer: INTEGRATION_LAYERS.EXTERNAL,
    privacyRisk: "low",
    nextStep: "Publish after qa:privacy + build",
  },
  {
    id: "fieldpulse",
    name: "FieldPulse",
    currentState: "Separate product — not merged",
    role: "—",
    readWrite: "—",
    layer: INTEGRATION_LAYERS.EXTERNAL,
    privacyRisk: "low",
    nextStep: "Keep out of CANONICAL app scope",
  },
];

export function getEndpointPulseUrl() {
  const url = String(import.meta.env.VITE_ENDPOINT_PULSE_URL || "").trim();
  return url || null;
}
