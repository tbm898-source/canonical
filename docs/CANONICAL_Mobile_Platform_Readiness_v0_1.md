# CANONICAL mobile & platform readiness (v0.1)

**App ID:** `69b84417922e4d60ff8ef01c`  
**Repo:** `tbm898-source/canonical`  
**Status:** Phases 1–7 implemented in repo (publish on Base44 after each push).

## Completed in repo

| Phase | Deliverable |
|-------|-------------|
| 1 | Plan + audits documented |
| 2 | PWA manifest/icons, safe-area CSS, `MobileNav`, `PublicSiteNav` |
| 3 | `ProgramHelperNav`, owner/demo mobile workbench, Owner Assistant layout |
| 4 | Sticky demo banner, summary-only PRISM paths unchanged |
| 5 | `/Settings`, governance map, owner health check, Integrations CTAs |
| 6 | `npm run qa:release`, GitHub Action, mobile test checklist |
| 7 | This doc, integration matrix, env vars doc, README, standing context |

## PWA recommendation

**Responsive web + installable PWA** (no Capacitor in v0.1). Service worker deferred.

## Key routes

| Route | Audience |
|-------|----------|
| `/ProgramHelper?mode=demo` | Public demo |
| `/ProgramHelper?mode=owner` | Owner (auth required) |
| `/OwnerAssistant` | Owner PRISM generation |
| `/Settings` | Role + connector posture + health check |
| `/Integrations` | Public overview + links to live controls |

## Release workflow

```bash
npm run qa:release   # qa:privacy + build
git push origin main
# Base44 Builder → Publish
# docs/CANONICAL_Post_Deploy_Audit_Checklist_v0_1.md
# docs/CANONICAL_Mobile_Test_Checklist_v0_1.md
```

## Hard boundaries (unchanged)

- PRISM private via `getCanonicalProgramFull` only
- Demo never calls connectors
- Endpoint Pulse / FieldPulse external — not embedded
- No `../_shared/` in new Base44 functions

## Open decisions (Tim)

- Service worker yes/no
- Production `VITE_ENDPOINT_PULSE_URL`
- Capacitor revisit after field testing
