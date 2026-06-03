# CANONICAL Post-Deploy Audit Checklist (v0.1)

Run after GitHub push + Base44 publish/sync, **before** Phase 5 connector scaffolding.

App ID: `69b84417922e4d60ff8ef01c`  
Repo: `tbm898-source/canonical`

## Local gate (before or right after push)

```bash
npm run qa:privacy
npm run build
```

## Base44 deploy confirm

- [ ] Builder shows latest commit from `main`
- [ ] Publish/sync completed without timeout
- [ ] No unexpected new automations on `CanonicalGeneratedArtifact` (ClickUp auto-export should stay disabled/no-op)

## Function smoke (owner session required)

Invoke from Owner Assistant or Program Helper owner mode; expect JSON, never tokens/paths in errors.

| Function | Expected |
|----------|----------|
| `getCanonicalProgramFull` | `success: true`, `program` for `PRISM_DTJL` |
| `canonicalConnectorHealth` | `success: true`, connector status labels only |
| `canonicalSpineDiscovery` | read-only metadata or clear blocked message |
| `proposeOwnerGenerationPlan` | dry-run plan or validation errors (no crash) |

Ghost check: if 404 "Deployment does not exist", function used `../_shared/` or failed sync — do not scaffold UI on that function until fixed.

## Demo / public (no owner login)

- [ ] `/ProgramHelper?mode=demo` — PRISM_DTJL summary only, no module/source dump
- [ ] Demo banner visible on phone while scrolling
- [ ] Connector panel does **not** call backend (network tab quiet)
- [ ] Home / Proof / Docs — mobile menu reaches all public links

## Owner / admin (real Base44 auth, not localhost preview)

- [ ] `/ProgramHelper` — owner workbench when signed in as owner/admin
- [ ] Owner PRISM panel loads via `getCanonicalProgramFull`
- [ ] `/OwnerAssistant` — gate blocks non-owner; owner sees program identity + modules
- [ ] Workbench menu → Integrations, Owner Assistant links work on phone

## Mobile / PWA

- [ ] iPhone Safari: no horizontal scroll on Program Helper
- [ ] Add to Home Screen: icon + theme color
- [ ] Safe-area: nav not under notch; anchor jumps (Programs, Integrations) land below fixed nav

## Privacy regression

- [ ] View source / network: no PRISM private tokens in main JS bundle (spot-check)
- [ ] Demo JSON for PRISM_DTJL has no `source_structure`, `00_GOVERNANCE`, Dropbox paths

## Record before Phase 5

| Item | Live? | Notes |
|------|-------|-------|
| Dropbox connector | | |
| Classroom dry-run | | |
| ClickUp dry-run | | |
| Gmail | declared only | |
| Endpoint Pulse | external link only | |

**Stop rule:** If `getCanonicalProgramFull` or owner gate fails in production, fix deploy/auth before connector scaffolding.
