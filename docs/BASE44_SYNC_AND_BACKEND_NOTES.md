# Base44 Sync And Backend Notes

## 2026-05-27 Session Recap (PRISM Owner-Private Access)

This session pinned down exactly how GitHub-sync deploys backend code
to this Base44 app and unblocked owner-private PRISM data access. The
older sections below remain accurate for the higher-level lanes but
were partly wrong about "GitHub sync does not deploy backend functions."

### What we discovered

GitHub-sync DOES deploy backend functions for this app, but with
narrow constraints. Confirmed via three probe functions in
`base44/functions/`:

| Probe | Imports | Result |
|---|---|---|
| `canaryDeployProbe` | none | deployed, serves traffic |
| `canary2` | `npm:@base44/sdk@0.8.25` + `base44.auth.me()`, no relative imports | deployed, serves traffic |
| `getCanonicalProgramFullV2` | pinned SDK + `../_shared/canonicalPolicy.ts` | 404 ghost (registered in `functions list`, endpoint returns "Deployment does not exist") |

The deploy pipeline on this app **cannot resolve relative
`../_shared/` imports inside function files**. Any function that
imports from `_shared/canonicalPolicy.ts` (or any other shared file)
is silently dropped from deploy. The 404 is the only externally
visible signal.

This also confirmed that 5 older functions
(`canonicalConnectorHealth`, `canonicalSpineDiscovery`,
`canonicalDropboxFileOps`, `prepareClassroomExport`,
`prepareClickUpExport`, `saveInstructionalPacketToDropbox`) have been
silently 404 for some time. They appear in `npx base44 functions list`
but their endpoints have never deployed under the current shared-import
pattern. The currently-serving live functions on this app are
`dropboxSave`, `autoBackupArtifactToDropbox`, `canaryDeployProbe`, and
`canary2` (plus the newly-fixed PRISM pair).

### Plan limits confirmed by CLI

`npx base44 entities push` and `npx base44 functions deploy` both fail
with: "This endpoint is only available for Backend Platform apps." The
dashboard on this app does not expose a Functions UI either: only
Automations and GitHub-integration controls are visible. The hint
"Remove `base44/.app.jsonc` and run `base44 link`" would re-link to a
new CLI-created app (new app ID, new URL, full frontend redeploy) and
is deferred.

### Workaround pattern (in use today)

For any function that needs server-side owner policy logic on this
app, **inline the helpers per-function** and do NOT import from
`base44/functions/_shared/`. Until/unless the plan is upgraded, treat
`_shared/canonicalPolicy.ts` as source-of-truth for frontend and
future Backend Platform usage only; manually duplicate its
`requireOwnerAdmin`, `nowIso`, `safeErrorMessage`, and role-discovery
helpers into each backend function that needs them. Pin the SDK as
`npm:@base44/sdk@0.8.25` (unpinned imports silently fail deploy on
this app).

`getCanonicalProgramFull` and `seedPrismDtjlFromBundle` use this
pattern as of commit `ca4c502`.

### PRISM_DTJL data path (current)

The Base44 entity layer is NOT provisioned on this app
(`CanonicalProgram`, `CanonicalModule`, `CanonicalGeneratedArtifact`
all return "Entity schema not found in app"). As of commit `b57fa2a`,
PRISM_DTJL data is served **inline server-side** from inside
`getCanonicalProgramFull/entry.ts`. It is never bundled into the
public frontend, is gated by `requireOwnerAdmin`, and uses the same
response shape the frontend `OwnerPrismDataPanel` already consumes.

`seedPrismDtjlFromBundle` is a no-op stub that returns
`skipped: true` with a `skipped_reason`. The original entity-writing
logic is preserved in git history (commit `d290661`) and should be
restored when the entity API becomes available.

### What works as of end-of-session

- `getCanonicalProgramFull({ program_key: "PRISM_DTJL" })` returns
  full owner-private PRISM program + 1 module + 1 artifact via
  authenticated owner CLI session
- `seedPrismDtjlFromBundle()` returns clean skip stub
- `dropboxSave`, `autoBackupArtifactToDropbox`, `canaryDeployProbe`,
  `canary2` all serve

### Loose ends (open next session)

- Browser verification: log in as owner, open Program Helper for
  PRISM_DTJL, confirm `OwnerPrismDataPanel` renders the data
- Clean up experimental functions: `canary2`,
  `getCanonicalProgramFullV2`, optionally `canaryDeployProbe`
- Apply the inlining workaround to the 5 silently-dead older
  functions if we want them revived
- Audit `git stash@{0}` (older working-tree changes for several
  `base44/functions/*/entry.ts` files plus various `src/`)
- Decide on Base44 plan upgrade vs stay on current plan with
  inlining workaround as the long-term shape
- Revisit the Base44 AI offer to "Sync my Dropbox account so the
  app automatically pushes approved artifacts directly into my
  project folders as soon as they are finalized." This already
  has working building blocks (`autoBackupArtifactToDropbox`,
  `dropboxSave`); design our own controlled wiring rather than
  accepting the auto-generated function.

### Session commit chain

`7057d89` → `0a5a435` → `56fa07c` → `751acfd` → `d1a254d`
→ `735d602` → `ca4c502` → `b57fa2a`. Plus 2 Base44-builder bot
auto-pushes: `468a025` and `bf083ce` (the second created
`src/components/dashboard/AdminAuditLog.jsx`, which is additive
and currently still in the tree).

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
- `npx base44 functions deploy` and `npx base44 entities push`
  (both still blocked with "Backend Platform only" as of
  2026-05-27).
- Backend entities managed by `base44 deploy`.
- A dashboard Functions UI (this app only shows Automations and
  GitHub integration in the dashboard).
- Local Cursor SDK runner endpoints hosted by Base44.
- Real owner/staff authentication policy.

GitHub sync DOES partially deploy backend functions, but only
under narrow constraints — see the 2026-05-27 session recap above
for the exact pattern (inlined helpers, pinned SDK,
no `../_shared/` imports).

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
