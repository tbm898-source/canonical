import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ---------------------------------------------------------------------------
// Constants — same rail/scope/type enumerations as saveInstructionalPacketToDropbox
// ---------------------------------------------------------------------------
const VALID_RAILS = ['AYA_Classroom', 'PRISM_Framework', 'CTS_RCS_Public_or_Open_Source', 'Mixed'];
const VALID_SCOPES = ['public_demo', 'aya_classroom', 'prism_private', 'internal', 'restricted'];
const VALID_ARTIFACT_TYPES = [
  'session_brief', 'class_packet', 'slide_outline', 'quiz', 'handout',
  'manifest', 'evidence_note', 'operator_note', 'admin_record', 'export_zip',
];

// Patterns that must never appear in public/classroom-scoped content
const UNSAFE_PUBLIC_PATTERNS = [
  /private_notes/i,
  /prism_private/i,
  /local_path/i,
  /\/Users\//i,
  /\/home\//i,
  /C:\\Users\\/i,
  /BEGIN (RSA|EC|OPENSSH) PRIVATE KEY/i,
  /sk-[a-zA-Z0-9]{20,}/,       // OpenAI-style keys
  /ghp_[a-zA-Z0-9]{20,}/,      // GitHub tokens
];

function containsUnsafePublicText(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value || '');
  return UNSAFE_PUBLIC_PATTERNS.some((re) => re.test(text));
}

function nowIso() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Staged-block helper — marks the artifact as blocked and returns a safe response
// ---------------------------------------------------------------------------
async function stageBlocked(base44, entityId, warning) {
  try {
    await base44.asServiceRole.entities.CanonicalGeneratedArtifact.update(entityId, {
      dropbox_backup_status: 'blocked',
      dropbox_backup_warning: warning,
      dropbox_backup_attempted_at: nowIso(),
    });
  } catch (_) {
    // Best-effort — don't let a write failure mask the real block reason
  }
  return Response.json({
    success: false,
    staged: false,
    blocked: true,
    warning,
    artifact_id: entityId,
    timestamp: nowIso(),
  });
}

// ---------------------------------------------------------------------------
// Dropbox upload
// ---------------------------------------------------------------------------
async function uploadDropboxFile(accessToken, path, content) {
  const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path,
        mode: 'add',
        autorename: true,
        mute: true,
        strict_conflict: false,
      }),
    },
    body: content,
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Dropbox upload failed (${response.status}): ${err}`);
  }
  const meta = await response.json();
  return meta.path_display || path;
}

function safeSlug(str, maxLen = 60) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, maxLen);
}

function joinPath(...parts) {
  return parts
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();

  // Resolve entity ID from direct call or entity automation payload
  const entityId = payload.artifact_id || payload.event?.entity_id;
  if (!entityId) {
    return Response.json({ error: 'Missing artifact_id or entity_id' }, { status: 400 });
  }

  // Fetch the artifact (prefer automation-supplied data to save a round-trip, but
  // always re-fetch to guarantee freshness and avoid stale payload_too_large cases)
  let artifact;
  try {
    artifact = await base44.asServiceRole.entities.CanonicalGeneratedArtifact.get(entityId);
  } catch (e) {
    return Response.json({ error: `Failed to fetch artifact: ${e.message}` }, { status: 500 });
  }
  if (!artifact) {
    return Response.json({ error: 'Artifact not found', artifact_id: entityId }, { status: 404 });
  }

  // ── GATE 1: auto_backup_enabled must be explicitly true ──────────────────
  if (artifact.auto_backup_enabled !== true) {
    return Response.json({ skipped: true, reason: 'auto_backup_enabled is not true', artifact_id: entityId });
  }

  // ── GATE 2: status must be approved ──────────────────────────────────────
  if (artifact.status !== 'approved') {
    return Response.json({ skipped: true, reason: `Status is "${artifact.status}", not approved`, artifact_id: entityId });
  }

  // ── GATE 3: duplicate-backup guard ───────────────────────────────────────
  if (artifact.dropbox_backup_status === 'saved') {
    return Response.json({ skipped: true, reason: 'Already backed up (dropbox_backup_status = saved)', artifact_id: entityId });
  }

  // ── GATE 4: required field presence ──────────────────────────────────────
  const missing = [];
  if (!artifact.canonical_spine_map_id)   missing.push('canonical_spine_map_id');
  if (!artifact.approved_destination_path) missing.push('approved_destination_path');
  if (!artifact.rail)                      missing.push('rail');
  if (!artifact.visibility_scope)          missing.push('visibility_scope');
  if (!artifact.artifact_type)             missing.push('artifact_type');

  const hasJson     = artifact.generated_json || artifact.content;
  const hasMarkdown = artifact.generated_markdown || artifact.content;
  const hasManifest = artifact.export_manifest || artifact.manifest;

  if (!hasJson)     missing.push('generated_json or content');
  if (!hasMarkdown) missing.push('generated_markdown or content');
  if (!hasManifest) missing.push('export_manifest or manifest');

  if (missing.length > 0) {
    return stageBlocked(base44, entityId, `Missing required fields before backup: ${missing.join(', ')}.`);
  }

  // ── GATE 5: rail / visibility_scope / artifact_type validation ────────────
  if (!VALID_RAILS.includes(artifact.rail)) {
    return stageBlocked(base44, entityId, `Invalid rail value "${artifact.rail}". Allowed: ${VALID_RAILS.join(', ')}.`);
  }
  if (!VALID_SCOPES.includes(artifact.visibility_scope)) {
    return stageBlocked(base44, entityId, `Invalid visibility_scope "${artifact.visibility_scope}". Allowed: ${VALID_SCOPES.join(', ')}.`);
  }
  if (!VALID_ARTIFACT_TYPES.includes(artifact.artifact_type)) {
    return stageBlocked(base44, entityId, `Invalid artifact_type "${artifact.artifact_type}". Allowed: ${VALID_ARTIFACT_TYPES.join(', ')}.`);
  }

  // ── GATE 6: PRISM-private must never go to AYA / classroom / public paths ─
  const destinationPath = artifact.approved_destination_path;
  const publicPathPatterns = [/aya/i, /classroom/i, /public/i, /demo/i, /cts/i];
  if (artifact.rail === 'PRISM_Framework' || artifact.visibility_scope === 'prism_private') {
    if (publicPathPatterns.some((re) => re.test(destinationPath))) {
      return stageBlocked(
        base44, entityId,
        'PRISM-private content cannot be saved to an AYA, classroom, or public Dropbox path.'
      );
    }
  }

  // ── GATE 7: public/classroom content must not contain private/local text ──
  const publicScopedScopes = ['public_demo', 'aya_classroom'];
  if (publicScopedScopes.includes(artifact.visibility_scope)) {
    const contentToCheck = [
      artifact.content,
      artifact.generated_markdown,
      artifact.generated_json,
      artifact.export_manifest,
    ].filter(Boolean);
    for (const chunk of contentToCheck) {
      if (containsUnsafePublicText(chunk)) {
        return stageBlocked(
          base44, entityId,
          'Public or classroom-scoped artifact contains private notes or local path references. Export blocked.'
        );
      }
    }
  }

  // ── GATE 8: CanonicalSpineMap must exist and be accepted by owner ─────────
  let spineMap;
  try {
    spineMap = await base44.asServiceRole.entities.CanonicalSpineMap.get(artifact.canonical_spine_map_id);
  } catch (e) {
    return stageBlocked(base44, entityId, `Could not retrieve CanonicalSpineMap (${artifact.canonical_spine_map_id}): ${e.message}`);
  }
  if (!spineMap) {
    return stageBlocked(base44, entityId, `CanonicalSpineMap "${artifact.canonical_spine_map_id}" not found. Cannot safely resolve destination.`);
  }
  if (!spineMap.accepted_by_owner) {
    return stageBlocked(base44, entityId, 'CanonicalSpineMap has not been accepted by owner. Backup staged but blocked until approval.');
  }

  // ── GATE 9: approved_destination_path must be consistent with spine map ───
  const recommendedPath = spineMap.recommended_paths?.[artifact.visibility_scope] || '';
  if (recommendedPath && !destinationPath.startsWith(recommendedPath)) {
    return stageBlocked(
      base44, entityId,
      `approved_destination_path does not match the accepted CanonicalSpineMap path for scope "${artifact.visibility_scope}". No guessed destinations allowed.`
    );
  }

  // ── ALL GATES PASSED — proceed with Dropbox upload ───────────────────────
  let accessToken;
  try {
    ({ accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox'));
  } catch (e) {
    return stageBlocked(base44, entityId, `Dropbox connector unavailable: ${e.message}`);
  }
  if (!accessToken) {
    return stageBlocked(base44, entityId, 'Dropbox connector returned no access token.');
  }

  const slug = safeSlug(artifact.title || entityId);
  const timestamp = nowIso().replace(/[:.]/g, '-').slice(0, 19);
  const baseName = `${slug}_${timestamp}`;

  const savedFiles = [];

  // Upload markdown
  const markdownContent = artifact.generated_markdown || artifact.content;
  const mdPath = await uploadDropboxFile(accessToken, joinPath(destinationPath, `${baseName}.md`), markdownContent);
  savedFiles.push(mdPath);

  // Upload JSON
  const jsonContent = artifact.generated_json
    ? JSON.stringify(artifact.generated_json, null, 2)
    : artifact.content;
  const jsonPath = await uploadDropboxFile(accessToken, joinPath(destinationPath, `${baseName}.json`), jsonContent);
  savedFiles.push(jsonPath);

  // Upload manifest
  const manifestRecord = artifact.export_manifest || artifact.manifest || {};
  const manifest = {
    ...manifestRecord,
    artifact_id: entityId,
    title: artifact.title,
    rail: artifact.rail,
    visibility_scope: artifact.visibility_scope,
    artifact_type: artifact.artifact_type,
    canonical_spine_map_id: artifact.canonical_spine_map_id,
    destination_path: destinationPath,
    backed_up_at: nowIso(),
    saved_files: savedFiles,
    auto_backup: true,
  };
  const manifestPath = await uploadDropboxFile(
    accessToken,
    joinPath(destinationPath, `${baseName}_manifest.json`),
    JSON.stringify(manifest, null, 2)
  );
  savedFiles.push(manifestPath);

  // Record backup success on the artifact
  const backedUpAt = nowIso();
  try {
    await base44.asServiceRole.entities.CanonicalGeneratedArtifact.update(entityId, {
      dropbox_backup_status: 'saved',
      dropbox_backup_warning: null,
      dropbox_backup_attempted_at: backedUpAt,
      dropbox_path: destinationPath,
      manifest_path: manifestPath,
    });
  } catch (_) {
    // Non-fatal — files are already in Dropbox
  }

  return Response.json({
    success: true,
    staged: false,
    blocked: false,
    artifact_id: entityId,
    destination_path: destinationPath,
    saved_files: savedFiles,
    manifest_path: manifestPath,
    backed_up_at: backedUpAt,
    warnings: [],
  });
});