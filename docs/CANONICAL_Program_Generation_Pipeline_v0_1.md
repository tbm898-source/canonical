# CANONICAL Program Generation Pipeline v0.1

## Purpose

Define a safe, owner/admin generation pipeline for CANONICAL Program OS that turns parsed `00_INBOX` material into structured generation inputs and (later) draft instructional artifacts, without exposing PRISM-private data to public/demo users.

This document covers Milestone 0 only. Later milestones add UI, backend ingestion, and generation, and are out of scope here.

## Scope of Milestone 0

Milestone 0 is foundation only:

- generation pipeline doc (this file)
- generation profile JSON files
- source record schema
- inbox manifest schema
- local-only dry-run `00_INBOX` scanner script

Explicit non-goals for Milestone 0:

- no UI changes
- no `/OwnerAssistant` route
- no generation execution
- no Base44 function calls
- no Dropbox, Google Classroom, ClickUp, Gmail, GitHub, or other live connector calls
- no file moves, renames, deletes, or modifications inside any source folder
- no full document text extraction by default
- no commits of generated outputs

## Operating Constraints

- The scanner is strictly read-only.
- The scanner records metadata only by default (no document body extraction).
- The scanner never writes anywhere except `.recovery/inbox-scan/`.
- `.recovery/` is gitignored. Outputs must never be committed.
- PRISM/private source paths may appear only in ignored local dry-run outputs, never in `src/`, the public bundle, or any committed generated file.
- Owner/admin authorization is not relevant in Milestone 0 because the scanner runs locally and does not call backend functions.

## Inbox Path

Default local inbox path on this workstation:

```
C:\Users\Tim Milkewicz\Dropbox\CANONICAL\00_INBOX
```

If the inbox folder is not present, the scanner exits with a clear, non-destructive error.

The scanner accepts `--inbox <path>` to override the default for testing against a controlled sample folder.

## Rails and Privacy

Rails:

- `aya` — classroom-facing or institution-facing source material
- `prism` — owner-private framework / facilitator material
- `canonical` — system infrastructure and operating spine material

Privacy classifications:

- `public_demo`
- `aya_classroom`
- `canonical_internal`
- `prism_private`

Hard rules:

- Never emit `prism_private` content into `public_demo` or `aya_classroom` outputs.
- Never bundle raw PRISM source into public frontend imports.
- Never use a query-string mode as authorization.

## Pipeline Stages

The full pipeline (across all milestones) has these conceptual stages:

1. **Scan** (Milestone 0): walk inbox metadata only, no body extraction by default.
2. **Classify** (Milestone 0): rail and privacy guesses with confidence and review flag.
3. **Manifest** (Milestone 0): assemble dry-run inbox manifest and source records.
4. **Normalize** (later milestones): transform approved source records into generation input.
5. **Generate** (later milestones): produce structured drafts from generation profiles.
6. **Validate / Approve / Export** (later milestones): server-side gates before any write.

Milestone 0 implements stages 1–3 locally only.

## Source Record (per-file metadata)

Each scanned file produces one source record. Source records are metadata only and never include extracted document text in Milestone 0.

Recorded fields:

- `source_record_id`
- `source_path` (workspace-relative or absolute, see scanner output settings)
- `file_name`
- `extension`
- `byte_size`
- `mtime` (last modified time, ISO 8601)
- `discovered_at` (ISO 8601)
- `rail_guess` (`aya | prism | canonical | unknown`)
- `privacy_guess` (`public_demo | aya_classroom | canonical_internal | prism_private | unknown`)
- `usable_for` (zero or more of the generation output types this material may eventually feed)
- `confidence` (`low | medium | high`)
- `review_required` (boolean)
- `status` (`discovered | needs_review | rejected`)
- `warnings` (string array)

Optional later modes (NOT enabled in Milestone 0) may add:

- `text_extraction_status`
- `extracted_excerpt` (still owner-only and never bundled)
- `text_extraction_warnings`

## Inbox Manifest

The inbox manifest summarizes a single dry-run scan:

- `manifest_id`
- `scan_mode` (always `dry_run` in Milestone 0)
- `inbox_root`
- `generated_at`
- `summary` (counts by rail, privacy, and confidence)
- `source_records` (array)
- `warnings`

## Generation Profiles

Each generation profile defines:

- `profile_id`, `output_type`
- `allowed_rails`
- `allowed_visibility_scopes`
- `required_source_fields`
- `output_contract` (format and required sections)
- `forbidden_patterns`
- `status`

Profiles are referenced by later milestones. Milestone 0 only declares them as stable contracts.

## Output Locations

Local dry-run output directory (gitignored):

```
.recovery/inbox-scan/
```

Files written by the scanner:

- `inbox-manifest.dry-run.json`
- `source-records.dry-run.json`
- `scan-report.dry-run.md`

The scanner writes to no other locations.

## Reference

See [CANONICAL Agent Council Flow v0.1](./CANONICAL_Agent_Council_Flow_v0_1.md) for the multi-agent workflow, approval gates, and emergency stop conditions that govern later milestones.
