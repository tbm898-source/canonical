# Teaching workspace simplification

Prepared October 23, 2026 from GitHub `main` at `afdbfce` on `codex/simplify-teaching`.

## Changed behavior

- Home offers two teaching actions: plan the next class or browse curriculum.
- Main navigation is Home, Curriculum, Plan a class, More. Examples and website tools remain available through More.
- Curriculum lists Design Thinking for a Joyful Life directly. The existing authenticated owner response now includes the six original module outlines, with core questions, concepts and activity outputs. The frontend renders those outlines as readable sections rather than raw metadata.
- The lesson planner accepts class name, session date, topic, completed work, remaining work and the first next step. Separate drafts autosave as edited, restore after reload, and can be downloaded as Markdown or previewed and printed.
- Draft storage is browser-local, scoped by authenticated account ID (email fallback) or a separate anonymous preview key. No cloud sync, provider delivery, curriculum approval or AI generation is implied. Student records are not supported.
- Malformed saved data is preserved rather than overwritten; failed storage writes show an error and keep download available. No deletion feature was added.
- The module sync script checks all six module headings against the index before attaching outlines. No curriculum meaning or backend authorization behavior was changed.

## Verification

- Four focused Node tests pass: independent class drafts, storage corruption rejection, exact preservation of notes/date in download content, and correspondence of all six outlines to source with owner gate retained.
- Production build, configured lint and post-build privacy checks pass.
- Type checking still fails with 188 diagnostics across the existing project. No diagnostics name the new planner, library or draft utility. This change does not claim to repair the repository-wide typing baseline.
- Local browser verified: home navigation; curriculum discovery and anonymous access explanation; drafting; autosave; date persistence; reload recovery; two independent class drafts; and lesson preview. A date-input event problem found during this test was corrected and retested.
- Live owner login, actual provider responses, cross-device persistence, physical print output and mobile-device interaction were not tested. The local preview has no backend configuration. The new teaching outlines require a successful backend sync to appear in production; old responses receive an explicit outline-unavailable message.

## Integration and release

This is a local review candidate, not a deployed release. Source authority remains `tbm898-source/canonical`; the original Dropbox checkout is unchanged. Its observed dirty files include `src/App.jsx`, `.gitignore`, `package.json` and two docs. The mesh policy is `PRESERVE_ONLY_UNTIL_WIP_REVIEW`, so this branch has not been pushed or merged.

Before release, reconcile the routing addition with the original checkout's unfinished `src/App.jsx` work. Review the curriculum access policy separately: this change makes the content discoverable and readable for the existing authorized account, but does not publish owner-restricted teaching outlines to other accounts. Then run release checks, sync the frontend and `getCanonicalProgramFull` backend through the documented GitHub/Base44 path, publish, and verify the owner experience on the live domain.

Rollback: revert this change's commit. Existing routes, backend response fields, curriculum sources and provider state are preserved. Browser draft data can remain in place.
