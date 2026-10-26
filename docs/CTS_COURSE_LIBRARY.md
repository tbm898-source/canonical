# CTS course library

Implemented October 26, 2026 from the owner's supplied Cohort 6 teaching folder.

The website now organizes the program as five eight-day courses, with 40 program positions. Thirty-six positions have supplied material: 28 have downloadable teaching files and eight have source notes only. Program days 36, 37, 39 and 40 remain explicit missing positions. Cohort dates are historical references; each new lesson plan gets its own date.

The import contains 363 unique original teaching files plus 36 lesson-note payloads (about 89 MB total). Primary file links are grouped by purpose and format. Nineteen distinct additional versions are preserved in a secondary list. Temporary files, QA renders, exact duplicates, ZIP archives and third-party working drawings are not presented as lessons. Original PDF, Word and PowerPoint bytes are unchanged.

## Using the library

Open Curriculum, choose a CTS course, then choose a course day. Teaching files open from the website rather than requiring a private Dropbox folder. Source-only lessons show their original text notes. Choose Plan this lesson to start or resume its browser-local preparation draft. The source course/program day remains fixed while you choose or change the class date. Missing days can start a blank plan for the reserved position.

Design Thinking for a Joyful Life remains unlocked in the same library. Existing saved drafts remain readable. The earlier admin-only Cohort 6 index routes redirect to the new teaching library/course pages.

## Offline refresh

Run `scripts/import-cts-curriculum.py --source <explicit Cohort 6 folder>` using the bundled Python runtime. The importer uses standard-library Word XML extraction, creates only allowlisted website projections/assets, records checksums in `docs/cts-import-manifest.json`, and leaves the supplied folder untouched. Stale output files are reported for review rather than silently deleted. A refresh needs teaching-content review and release validation before publication.

Contract: `docs/contracts/cts.teaching-library.v1.md`. This handoff does not make Dropbox an application API, change curriculum source authority, or create any student-record storage.

## Verification and limitations

Focused tests verify all 40 positions, course numbering, four missing days, source payloads, all material hashes and signatures, draft compatibility, rescheduling identity, seeded draft recovery and blank plans for missing days. Local browser checks cover course/lesson navigation, source-only and missing positions, and a date change/reload retaining PV102 day 3 / program day 19. A representative PDF was parsed and served with `application/pdf`; served bytes matched the original. The embedded browser's PDF viewer did not render, so native-browser print interaction is not claimed as tested.

This imports and presents existing instruction; it does not validate or rewrite technical/safety content, fill missing lessons, infer completed work, or add AI generation. Backfilled notes and historical equipment/date assumptions remain visible for instructor review. Drafts still save only in the current browser; cross-device storage remains future work. Site-level sign-in and connected-service permissions remain unchanged.

Publication receipts and hosted checks are recorded in the coordination board and task evidence after release.
