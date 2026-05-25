# Base44 Sync And Backend Notes

## Current Short-Term Lane

The connected GitHub repository is `tbm898-source/canonical`.

Use this lane for frontend-only updates to the current Base44 app:

1. Make local code changes.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Commit and push to `main`.
5. Let Base44 sync from GitHub.
6. Publish from the Base44 dashboard if needed.

This is the useful loophole for the existing app. It lets us improve the portal UI and demo experience without the blocked CLI deploy endpoint.

## Not Solved By GitHub Sync

GitHub sync does not turn the existing frontend/dashboard app into a Backend Platform app.

Do not expect it to unlock:

- CLI agent syncing.
- Backend functions.
- Backend entities managed by `base44 deploy`.
- Local Cursor SDK runner endpoints hosted by Base44.
- Real owner/staff authentication policy.

## Connector Spine v2 Update

The app now includes backend resource definitions under `base44/entities` and `base44/functions` for the CANONICAL connector spine.

Important:

- Dropbox is treated as the discovered CANONICAL spine, not generic storage.
- The first live Dropbox task is read-only spine discovery, not writing files.
- Dropbox writes are blocked until an owner-approved `CanonicalSpineMap` exists.
- Google Classroom and ClickUp are dry-run adapters only in V1.
- Gmail/email is future-disabled in V1.

If the current GitHub sync lane does not deploy backend resources for this app, create or link a backend-capable Base44 project before expecting these functions/entities to run live.

## Long-Term Lane

For the real CANONICAL owner workbench, use a separate Backend Platform project or an ejected CLI-managed Base44 app.

That decision should wait for Tim because it can affect:

- App IDs.
- Data migration.
- Domains.
- Backend billing/platform shape.
- Auth and demo access policy.

## Prototype Safety Rule

Until real auth exists, the public frontend should only expose demo-safe material.

Owner workbench controls and PRISM-private surfaces should stay local-only or behind real authentication.
