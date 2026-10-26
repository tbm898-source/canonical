# CTS teaching library v1

Owner: AYA Curriculum. Producer: the offline Cohort 6 teaching importer. Consumer: Program OS teaching library and lesson planner. Repository source authority: `tbm898-source/canonical`.

The human owner supplied `CTS_Cohort_06` as the course material and approved bringing it into the website on October 26, 2026. This is a human-approved teaching handoff, not a runtime integration with a Dropbox path. Original files remain unchanged. The source folder is passed explicitly to the offline importer; the website never reads the operator filesystem.

## Identity and schedule

The program contains 40 teaching positions: ten weeks at four days per week. Courses are PV101, RCS, PV102, EDM101 and EBIKE101, in that order. Each occupies eight course days and two teaching weeks.

`id` is the stable course/day identity, for example `pv102-03`. `courseDay` is 1–8; `programDay` is 1–40. `referenceDate` is the historical Cohort 6 date, never an assigned date for a new class. The planner stores a separate session `date` and retains its source lesson ID and position when that date changes.

Design Thinking remains an independent six-module curriculum; it is not inserted into one of the five CTS course blocks.

## Published representation

- `content/teaching/cts/catalog.json`: versioned program structure, five courses, all 40 reserved positions, historical dates, material availability and file references.
- `public/teaching/cts/lessons/<id>.json`: readable instructor/lesson notes for positions with supplied material. Word source is converted to text and tables; original binary files are separately preserved.
- `public/teaching/cts/assets/<content-hash>.<format>`: unchanged PDF, DOCX and PPTX teaching files. Full SHA-256 and byte size accompany each reference. Exact duplicate bytes share an asset.
- `docs/cts-import-manifest.json`: source-relative provenance, checksums and selected/alternate source mapping. It is build/review evidence, not a runtime source folder API.

Source availability is observational: `materials_available` means teaching files exist; `source_only` means text exists without separate printable outputs; `inventory_only` means the files need further review; `missing` reserves the day without inventing content. These labels do not independently approve curriculum quality or operational readiness. Backfilled and explicitly draft sources retain review notes.

The importer selects primary files by teaching purpose and format and preserves distinct alternate teaching versions under a secondary list. QA renders, archives, temporary files, scripts, unrelated files and third-party working drawings are excluded. Student/assessment filenames refer to teaching templates and are not evidence of real learner records. No real student records are authorized or included; ADR-002 applies to any accidental discovery.

## Compatibility and validation

Schema version 1 changes are additive. Stable lesson IDs and position mappings must not be reassigned when dates change. Missing material can later fill the same reserved ID. If the course order changes, publish a new program structure version and define its migration rather than silently changing the meaning of old saved drafts.

Legacy lesson drafts remain readable. New optional string fields (`lessonId`, `courseCode`, `courseDay`, `programDay`) preserve source references without changing the existing browser storage key. The existing sign-in, private method access and connected-service permissions are not modified.

Release checks verify 40 unique positions, eight days per course, known missing days, source payload identities, original asset signatures/checksums, date/reference separation, saved-draft migration, and unchanged source identity after rescheduling. No external provider writes are part of this contract.
