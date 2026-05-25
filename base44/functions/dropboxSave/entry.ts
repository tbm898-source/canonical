import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { path, content } = await req.json();
    if (!path || !content) {
      return Response.json({ error: 'Missing path or content' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox');

    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'overwrite',
          autorename: false,
          mute: false,
        }),
        'Content-Type': 'application/octet-stream',
      },
      body: content,
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error_summary || 'Dropbox upload failed' }, { status: 500 });
    }

    return Response.json({ success: true, file: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});