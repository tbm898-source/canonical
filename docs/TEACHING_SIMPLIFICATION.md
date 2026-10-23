# Teaching workspace simplification

Prepared October 23, 2026 on `codex/simplify-teaching`, from GitHub main `afdbfce`.

## Current behavior

- Home offers two teaching actions: plan the next class or browse curriculum.
- Main navigation is Home, Curriculum, Plan a class, More.
- Design Thinking for a Joyful Life opens directly in Curriculum. All six original module outlines include their core questions, concepts and student activity outputs. Reading them does not depend on an owner role, an owner-only backend function, or a mode selection.
- Demo mode and its landing/switching UI are removed. Old ProgramHelper bookmarks redirect to Curriculum, Plan, or Connected services based on their section, ignoring their old mode query. The old demo data and access-policy files are deleted. Existing technical connector request enums remain compatibility guards, not teaching modes.
- The planner saves separate class drafts on this browser, scoped to the authenticated account or a separate preview key. Drafts support chosen dates, progress notes, download, preview and print. It does not claim AI generation or cloud synchronization.
- Examples and website administration are secondary. Connected-service permissions remain separate from teaching access.

## Teaching access decision

The program owner explicitly requested on October 23, 2026: unlock Design Thinking for a Joyful Life and remove demo mode. This supersedes the earlier owner-only restriction for the teaching projection used by this website.

`content/teaching/design-thinking.json` is an allowlisted projection: program title, six module titles, sequence numbers and their teaching outlines. It is generated from the existing module sequence with `npm run generate:teaching`. It does not import diagnostic/intervention records, private facilitator notes, internal paths, inbox metadata or credentials. Curriculum meaning and the original source files are unchanged. This is the human-approved curriculum handoff to the teaching surface; it is not approval to publish every PRISM record.

Teaching outlines ship with the frontend so they do not fail when an owner-only backend function is unavailable. The Base44 app's existing site-level sign-in setting is unchanged. The separate owner-method backend and connector-write permissions retain their existing checks.

## Validation

- Five focused Node tests cover independent class drafts, corruption handling, exact preservation of notes/dates, original backend outline correspondence, and exact correspondence of the newly unlocked projection to all six source modules.
- Lint and release gate pass. The release gate now runs teaching checks, build, then privacy checks against the newly built bundle.
- Local browser checks confirm module contents open without an owner-role response, Life Design Lab fills the planner's program/topic, and old `?mode=demo` bookmarks redirect to Curriculum with no mode selector. The previous pass verified autosave, chosen dates, reload recovery and two independent class drafts.
- Repository-wide type diagnostics remain; see local ignored typecheck log. The content alias was added to match Vite resolution.
- No live provider requests, sign-in changes, external writes or production deployment were performed. Physical print and mobile-device interaction remain unverified.

## Integration and release

Source authority remains `tbm898-source/canonical`. On October 23, the user approved publishing this version. The original Dropbox checkout has unfinished tracked work including `src/App.jsx`, `.gitignore`, `package.json` and two docs; none was overwritten. Review found the App edit adds a post-login redirect already provided by the new HomeRoute; the other edits concern unrelated local backup tooling and remain in the original checkout. The remote main was refreshed and still matched the branch base before publication.

Before release, reconcile routing and package-script additions with that work, run release checks, then use the existing GitHub sync and Base44 Publish path. The unlocked teaching library requires only the frontend update; it no longer needs a backend deployment to become readable. Confirm the published curriculum and old bookmarks on the live domain.

Rollback: revert the two local simplification commits. Existing provider state is unaffected; saved local drafts may remain.
