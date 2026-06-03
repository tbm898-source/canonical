# CANONICAL standing context — AI / Cursor / Base44 workflow

## Active repo

- Path: `BASE44_CANONICAL_GITHUB_SYNC`
- GitHub: `tbm898-source/canonical`
- Base44 app ID: `69b84417922e4d60ff8ef01c`

## Mobile & platform readiness (2026-06)

Phases 1–7 are in repo. After push: **Publish in Base44**, then run:

- `docs/CANONICAL_Post_Deploy_Audit_Checklist_v0_1.md`
- `docs/CANONICAL_Mobile_Test_Checklist_v0_1.md`
- `docs/CANONICAL_Mobile_Platform_Readiness_v0_1.md`

Release gate: `npm run qa:release` (privacy QA + build).

## Base44 constraints

- Entity API not provisioned on current plan.
- `../_shared/` imports break GitHub-sync deploy — inline helpers per function.
- `getCanonicalProgramFull` serves owner-private PRISM server-side.
- Do not use Base44 “Resolve with AI” on backend without explicit approval.

## PRISM / AYA rules

- PRISM: owner-private full data via backend function; demo summary-only in bundle.
- AYA/CTS: public-safe; no PRISM private framework in student-facing outputs.

## Agent council

Plan → approval → one patch → review → commit/push → publish when approved.

## Do not blindly commit

- `canonical_spine/` (unless intentional mirror PR)
- `.recovery/`
- Stray inbox files (`docs/New Text Document.txt`)

## Cursor prompt pattern

```
Follow .cursor/rules/canonical-program-os.mdc and docs/CANONICAL_Agent_Council_Flow_v0_1.md.
Task: [one narrow task]
Mode: [plan / implement / verify]
Stop after: [exact point]
```

## Next work (after publish audit)

- Set `VITE_ENDPOINT_PULSE_URL` in Base44 env if Pulse URL is known
- Field-test owner mobile on real devices
- Connector live writes only with explicit Tim approval per connector
