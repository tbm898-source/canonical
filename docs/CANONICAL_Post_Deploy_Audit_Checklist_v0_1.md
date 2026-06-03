# CANONICAL post-deploy audit checklist (v0.2)

Run after GitHub push + Base44 **Publish**.

App ID: `69b84417922e4d60ff8ef01c`  
Repo: `tbm898-source/canonical`

## Local release gate

```bash
npm run qa:release
```

Runs `qa:privacy` then `build`. Same gate runs on GitHub Actions for `main`.

## Base44 deploy confirm

- [ ] Builder shows latest commit from `main`
- [ ] Publish completed without timeout
- [ ] No rogue automations on `CanonicalGeneratedArtifact` → ClickUp auto-export

## Function smoke (owner session)

| Function | Expected |
|----------|----------|
| `getCanonicalProgramFull` | `success: true`, `program` for `PRISM_DTJL` |
| `canonicalConnectorHealth` | status labels only (also from `/Settings`) |
| `canonicalSpineDiscovery` | read-only metadata or clear blocked message |
| `proposeOwnerGenerationPlan` | dry-run plan or validation errors |

Ghost check: 404 "Deployment does not exist" → fix deploy before new connector work.

## Demo / public

- [ ] `/ProgramHelper?mode=demo` — PRISM_DTJL summary only
- [ ] `/Settings` — health check blocked without owner
- [ ] `/Integrations` — links work; no live writes from this page alone
- [ ] Mobile menu on Home reaches Settings, Integrations, Demo

## Owner / admin

- [ ] `/ProgramHelper` — owner workbench + PRISM panel
- [ ] `/OwnerAssistant` — gated correctly
- [ ] `/Settings` — Check connectors succeeds
- [ ] Program Helper → Integrations — owner panel usable on phone

## Mobile / PWA

See `docs/CANONICAL_Mobile_Test_Checklist_v0_1.md`.

## Privacy

- [ ] `npm run qa:privacy` passed on release commit
- [ ] Spot-check production bundle for PRISM path leaks

## Connector record (production)

| Item | Live? | Notes |
|------|-------|-------|
| Dropbox | | |
| Classroom dry-run | | |
| ClickUp dry-run | | |
| Gmail | declared | |
| Endpoint Pulse | link if env set | `VITE_ENDPOINT_PULSE_URL` |

**Stop rule:** Fix `getCanonicalProgramFull` or owner gate before enabling new live connector writes.
