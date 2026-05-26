import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DROPBOX_BASE_PATH = '/CANONICAL/artifacts';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Support both direct call (artifact_id) and entity automation payload
    const entityId = payload.artifact_id || payload.event?.entity_id;
    if (!entityId) {
      return Response.json({ error: 'Missing artifact_id or entity_id' }, { status: 400 });
    }

    const artifact = payload.data || await base44.asServiceRole.entities.CanonicalGeneratedArtifact.get(entityId);
    if (!artifact) {
      return Response.json({ error: 'Artifact not found' }, { status: 404 });
    }

    // Only backup approved artifacts
    if (artifact.status !== 'approved') {
      return Response.json({ skipped: true, reason: 'Artifact is not approved', status: artifact.status });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox');
    if (!accessToken) throw new Error('Dropbox connector not available.');

    const rail = (artifact.rail || 'mixed').toLowerCase().replace(/\W+/g, '_');
    const slug = (artifact.title || entityId).toLowerCase().replace(/\W+/g, '_').slice(0, 60);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const folder = `${DROPBOX_BASE_PATH}/${rail}`;
    const baseName = `${slug}_${timestamp}`;

    const savedFiles = [];

    // Save content as markdown
    if (artifact.content) {
      const mdPath = await uploadDropboxFile(accessToken, `${folder}/${baseName}.md`, artifact.content);
      savedFiles.push(mdPath);
    }

    // Save full artifact record as JSON
    const jsonPath = await uploadDropboxFile(
      accessToken,
      `${folder}/${baseName}.json`,
      JSON.stringify(artifact, null, 2)
    );
    savedFiles.push(jsonPath);

    // Save a lightweight manifest
    const manifest = {
      artifact_id: entityId,
      title: artifact.title,
      rail: artifact.rail,
      artifact_type: artifact.artifact_type,
      status: artifact.status,
      backed_up_at: new Date().toISOString(),
      saved_files: savedFiles,
    };
    const manifestPath = await uploadDropboxFile(
      accessToken,
      `${folder}/${baseName}_manifest.json`,
      JSON.stringify(manifest, null, 2)
    );
    savedFiles.push(manifestPath);

    return Response.json({
      success: true,
      artifact_id: entityId,
      saved_files: savedFiles,
      folder,
      backed_up_at: manifest.backed_up_at,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});