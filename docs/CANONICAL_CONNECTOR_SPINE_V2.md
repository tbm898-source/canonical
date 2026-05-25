# CANONICAL Connector Spine v2

## Purpose

Connector Spine v2 lets the Program Helper prepare real export workflows while protecting the hard boundaries between CANONICAL, AYA/CTS, and PRISM.

Dropbox is the first live connector because it represents the durable CANONICAL file spine. Google Classroom and ClickUp are adapters only in V1.

## Rails

- `CANONICAL`: durable operating spine, templates, SOPs, manifests, indexes, approved artifacts, generation records, and system memory.
- `AYA / CTS`: Alternative Youth Activities classroom-facing instructional materials, packets, quizzes, answer keys, slide outlines, and Classroom-ready posts.
- `PRISM`: private operator framework, facilitator overlays, adaptive logic, AI continuity notes, diagnostics, and deeper curriculum architecture.

## Connector Modes

- `demo`: no backend connector calls, no real Dropbox paths, no live saves, no Classroom posts, no ClickUp tasks, and no private PRISM material.
- `owner_preview`: connector health checks, Dropbox read-only discovery, Classroom dry-run, and ClickUp dry-run are allowed.
- `owner_live_dropbox`: Dropbox save is allowed only after packet classification, read-only spine discovery, owner-approved `CanonicalSpineMap`, approved destination, and safety validation.
- `owner_live_adapters`: future mode only. Classroom posting, ClickUp creation, and Gmail/email sending are intentionally disabled in V1.

## Dropbox Spine Discovery

The app must discover Dropbox before writing. It must not assume `/CANONICAL/INSTRUCTIONAL/...`.

`canonicalSpineDiscovery`:

- Uses the shared owner Dropbox connector server-side.
- Reads folder metadata only.
- Looks for likely CANONICAL roots and expected spine folders.
- Returns candidate roots, detected folders, missing expected folders, and recommended artifact paths.
- Does not create folders, move files, or write files.
- Stores an accepted map only when the owner approves it.

## Backend Functions

- `canonicalConnectorHealth`: safe availability check for Dropbox, Google Classroom, ClickUp, and Gmail.
- `canonicalDropboxFileOps`: owner-only Dropbox metadata list helper following Base44 Deno connector-token guidance. V1 intentionally blocks generic upload/download so approved packet saves cannot be bypassed.
- `canonicalSpineDiscovery`: read-only Dropbox discovery and optional owner-approved spine map creation.
- `saveInstructionalPacketToDropbox`: saves JSON, Markdown, and manifest to an approved Dropbox destination.
- `prepareClassroomExport`: dry-run Google Classroom draft only.
- `prepareClickUpExport`: dry-run ClickUp task candidates only.

All connector calls happen in backend functions. The frontend calls them with `base44.functions.invoke(...)`.

## Entities

- `CanonicalSpineMap`: approved Dropbox spine mapping.
- `CanonicalGeneratedArtifact`: generated packet metadata and safe export output.
- `CanonicalConnectorRun`: safe connector audit records with no secrets.
- `CanonicalExportApproval`: owner approval records.
- `CanonicalTemplateProfile`: reusable generation template and separation rules.

## Classification

Every generated packet must include:

- `rail`: `canonical`, `aya`, or `prism`
- `visibility_scope`: `public_demo`, `canonical_internal`, `aya_classroom`, or `prism_private`
- `artifact_type`
- `module_key`
- `session_key`
- `session_title`
- `session_date`
- `warnings`

Exports are blocked when classification is missing or unsafe.

## Safety Rules

- Never expose OAuth tokens, refresh tokens, connector secrets, raw connector configs, backend logs, local absolute paths, or raw API responses.
- Never export PRISM-private material to Google Classroom, AYA classroom folders, student packets, or demo mode.
- Never call backend connectors in demo mode.
- Never guess Dropbox destinations without an accepted spine map or explicit owner-approved path.
- Never create Dropbox folders automatically in V1.
- Never create live Classroom posts, ClickUp tasks, or Gmail/email messages in V1.

## Safe Testing Checklist

- Demo generator works without backend calls.
- JSON, Markdown, and print export still work locally.
- Mobile layout has no horizontal overflow.
- Connector health returns status only, with no tokens.
- Dropbox discovery reads metadata only and writes nothing.
- Dropbox save rejects missing classification, missing map, guessed destinations, and unsafe rail/visibility combinations.
- Classroom dry-run rejects PRISM-private content and does not post live.
- ClickUp dry-run rejects raw PRISM-private text and does not create live tasks.
