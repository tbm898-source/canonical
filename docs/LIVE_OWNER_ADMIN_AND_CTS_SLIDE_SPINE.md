# Live Owner Admin + CTS Slide Spine Decision Record

Date: 2026-05-25

## Decision

This pass treats CANONICAL as Portal V1, not a shell to rebuild. The site already has public routes, content/docs/proof surfaces, Program Helper owner/demo logic, PV102 demo data, PRISM_DTJL privacy gating, Base44 entity/function declarations, and generated CTS package proof artifacts.

The next live target is an authenticated Base44 owner/admin workbench with honest connector diagnostics, safe package proof, and CTS slide-template indexing.

## Integrated Briefs

This decision record consolidates the May 25 Codex briefs:

- `pure_canonical_core_codex_integration_brief_2026-05-25.md`
- `pure_canonical_core_finish_pass_for_codex_2026-05-25.md`
- `pure_canonical_core_repo_audit_and_codex_plan_2026-05-25.md`

The shared guidance is:

- Preserve the existing Vite + React + Tailwind + Base44 portal architecture.
- Keep the AYA / CTS, PRISM, and CANONICAL boundary model intact.
- Use the existing `/content` layer as the canonical site content path.
- Harden proof/package/docs surfaces instead of rebuilding public pages from scratch.
- Treat backend connector status honestly: declared and dry-run until verified live.
- Keep public/demo mode sanitized and private-first.

## Owner/Admin Posture

The owner side should open through Base44 login with `admin` or `owner` role access. Owner mode may show:

- Program Helper owner workbench
- Live Integrations diagnostics
- declared backend function list
- connector health checks
- Dropbox discovery status
- approved packet save controls after spine approval
- CTS package proof and slide-template inventory

Owner mode must still keep Classroom, ClickUp, and Gmail live actions disabled in V1 unless separately promoted.

## CTS Slide Template Source

Official source package:

`CTS_RCS_10Week_SlideDecks.zip`

The raw ZIP and PPTX files remain outside Git. Generated safe proof files are written to:

`content/packages/generated/`

Source hash:

`C18A9A7547FCCB808C6509402765AAB859C30A786308305A5ABBD6B055B52470`

Detected source shape:

- 10 weekly PPTX decks
- 19 slides per deck
- one slide layout per deck
- theme present
- media assets present

## Generation Policy

V1 supports:

- slide package proof
- deck inventory
- weekly deck map
- slide-outline generation target
- JSON patch-plan metadata

V1 does not support direct PPTX rewriting in the live app.

Direct PPTX editing requires a future fidelity gate that proves a copied deck preserves:

- slide count
- dimensions
- theme
- media count
- package relationships

If fidelity checks fail, output remains outline/notes only.

## Public/Demo Privacy

Public/demo routes may show sanitized proof only:

- source package file name
- source hash
- component/deck counts
- high-level generation policy
- notice that direct PPTX editing is disabled until fidelity checks pass

Public/demo routes must not show:

- local Windows paths
- raw PPTX files
- full slide copy
- private note content
- editable template internals
- PRISM-private guidance
- connector internals
- backend diagnostic output
- credentials or tokens

## Follow-Up

The next backend truth pass should verify which Base44 functions are live in the deployed app, then document the exact difference between declared functions, dry-run adapters, read-only discovery, and approved live Dropbox writes.
